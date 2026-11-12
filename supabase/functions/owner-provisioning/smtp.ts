// SMTP over implicit TLS. The wire sequence was checked in the T05 hosted probe.
type Message = { to: string; subject: string; body: string; id: string };
type Outcome = "submitted" | "rejected" | "failed_before_submit" | "unknown";
const encoder = new TextEncoder();
const safeMailbox = /^[a-z0-9.!#$%&'*+/=?^_\x60{|}~-]+@[a-z0-9.-]+$/i;

class ReplyError extends Error {
  constructor(readonly replyCode: number) { super("SMTP rejected command"); }
}

function dialogue(socket: Deno.TlsConn) {
  const decoder = new TextDecoder();
  const buffer = new Uint8Array(2048);
  let pending = "";

  async function readLine(): Promise<string> {
    while (!pending.includes("\r\n")) {
      const count = await socket.read(buffer);
      if (count === null || count === 0) throw new Error("SMTP connection ended");
      pending += decoder.decode(buffer.subarray(0, count), { stream: true });
      if (pending.length > 8192) throw new Error("SMTP reply too long");
    }
    const end = pending.indexOf("\r\n");
    const line = pending.slice(0, end);
    pending = pending.slice(end + 2);
    return line;
  }

  async function expect(code: number): Promise<void> {
    let firstCode: number | undefined;
    for (let index = 0; index < 32; index += 1) {
      const reply = /^(\d{3})([ -]|$)/.exec(await readLine());
      if (!reply) throw new Error("Malformed SMTP reply");
      const received = Number(reply[1]);
      firstCode ??= received;
      if (received !== firstCode) throw new Error("Inconsistent SMTP reply");
      if (reply[2] === "-") continue;
      if (received !== code) throw new ReplyError(received);
      return;
    }
    throw new Error("Too many SMTP reply lines");
  }

  async function command(value: string, code: number): Promise<void> {
    const bytes = encoder.encode(value + "\r\n");
    let sent = 0;
    while (sent < bytes.length) {
      const count = await socket.write(bytes.subarray(sent));
      if (count <= 0) throw new Error("SMTP write stopped");
      sent += count;
    }
    await expect(code);
  }
  return { command, expect };
}

export async function sendOwnerMail(sender: string, password: string, message: Message): Promise<Outcome> {
  if (!safeMailbox.test(sender) || !safeMailbox.test(message.to) || !password
    || !/^[a-zA-Z0-9-]+$/.test(message.id) || !/^[ -~]+$/.test(message.subject)) return "failed_before_submit";
  let socket: Deno.TlsConn | undefined;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let timedOut = false;
  let dataStarted = false;
  const deadline = new Promise<never>((_, reject) => {
    timer = setTimeout(() => {
      timedOut = true;
      reject(new Error("SMTP deadline expired"));
    }, 12_000);
  });
  async function submit(): Promise<Outcome> {
    const connection = await Deno.connectTls({ hostname: "smtp.gmail.com", port: 465 });
    if (timedOut) {
      connection.close();
      throw new Error("SMTP deadline expired");
    }
    socket = connection;
    await connection.handshake();
    const smtp = dialogue(connection);
    await smtp.expect(220);
    await smtp.command("EHLO localhost", 250);
    await smtp.command("AUTH PLAIN " + btoa("\0" + sender + "\0" + password), 235);
    await smtp.command("MAIL FROM:<" + sender + ">", 250);
    await smtp.command("RCPT TO:<" + message.to + ">", 250);
    await smtp.command("DATA", 354);
    const encoded = btoa(String.fromCharCode(...encoder.encode(message.body)));
    const wire = [
      "From: POS Cafe <" + sender + ">",
      "To: <" + message.to + ">",
      "Subject: " + message.subject,
      "Date: " + new Date().toUTCString(),
      "Message-ID: <" + message.id + "@pos-cafe.invalid>",
      "MIME-Version: 1.0",
      "Content-Type: text/plain; charset=utf-8",
      "Content-Transfer-Encoding: base64",
      "",
      ...(encoded.match(/.{1,76}/g) ?? [""]),
      ".",
    ].join("\r\n");
    dataStarted = true;
    await smtp.command(wire, 250);
    return "submitted";
  }
  try {
    return await Promise.race([submit(), deadline]);
  } catch (failure) {
    if (failure instanceof ReplyError && failure.replyCode >= 400 && failure.replyCode <= 599) return "rejected";
    return dataStarted ? "unknown" : "failed_before_submit";
  } finally {
    if (timer !== undefined) clearTimeout(timer);
    socket?.close();
  }
}
