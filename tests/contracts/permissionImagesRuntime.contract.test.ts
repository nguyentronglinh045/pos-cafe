import { afterAll, beforeAll, expect, test } from "vitest";
import { observeCandidateStage } from "./permissionStageObservation";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { db, EMPLOYEE_IDS as E, env, rpc, STORE_IDS as S } from "./permissionReadFixture";
import { emptyMenuChanges } from "./permissionChangesFixture";
import { cleanupImagesRuntimeFixture, expiredImageStoreJwt, setupImagesRuntimeFixture, snapshotOwnedImageObject,
  trackImageCopyTarget, trackImageUpload, verifyDirectImageMutationRoutes } from "./permissionImagesFixture";
import {
  prepareCompatibilityHook,
  verifyCompatibilityRestRouting,
} from "../../scripts/permission-compatibility-prepare.mjs";

let token = "", itemId = "", expiredJwt = "", signedValidJwt = "";
let compatibilityReceipt: { installedByCaller: boolean } | undefined;
const headers = () => ({ apikey: env.anonKey, Authorization: `Bearer ${env.storeJwt}`, "x-pos-employee-token": token });
const gateway = `${env.api}/functions/v1/menu-image-gateway`;
const bucket = "menu-item-image-staging";
// The 1x1 PNG used by the CI1 preservation fixture. A valid ancillary chunk
// gives exact HTTP boundary sizes without signature-only or trailing padding.
const imagePng = (size?: number) => {
  const source = new Uint8Array(Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=", "base64"));
  if (size === undefined) return source;
  const dataLength = size - source.length - 12;
  if (dataLength < 0 || Buffer.from(source.subarray(-8, -4)).toString() !== "IEND") throw new Error("IMAGE_PNG_FIXTURE_INVALID");
  const output = new Uint8Array(size), offset = source.length - 12;
  output.set(source.subarray(0, offset));
  new DataView(output.buffer).setUint32(offset, dataLength);
  output.set([112, 97, 68, 100], offset + 4); // paDd: ancillary/private/reserved-valid/safe-to-copy.
  let crc = 0xffffffff;
  for (const byte of output.subarray(offset + 4, size - 16)) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit++) crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
  }
  new DataView(output.buffer).setUint32(size - 16, (crc ^ 0xffffffff) >>> 0);
  output.set(source.subarray(-12), size - 12);
  return output;
};
// Baseline 1x1 grayscale JPEG: a zero DC coefficient and AC EOB produce
// one neutral pixel. Both one-symbol Huffman tables use code 0; 0x3f is
// DC(0), EOB(0), then the required one-bit padding before EOI.
const imageJpeg = () => new Uint8Array([
  0xff, 0xd8,
  0xff, 0xdb, 0, 67, 0, ...new Array<number>(64).fill(1),
  0xff, 0xc0, 0, 11, 8, 0, 1, 0, 1, 1, 1, 0x11, 0,
  0xff, 0xc4, 0, 38,
  0, 1, ...new Array<number>(15).fill(0), 0,
  0x10, 1, ...new Array<number>(15).fill(0), 0,
  0xff, 0xda, 0, 8, 1, 1, 0, 0, 63, 0,
  0x3f, 0xff, 0xd9,
]);
const imageForm = (id: string, bytes = imagePng(), mime = "image/png", extra: Record<string, string> = {}) => {
  const form = new FormData(); form.set("itemId", id);
  form.set("file", new File([bytes], "fixture.png", { type: mime }));
  for (const [key, value] of Object.entries(extra)) form.set(key, value);
  return form;
};
const imageState = async () => (await db.query(`select
  (select md5(coalesce(jsonb_agg(to_jsonb(u) order by upload_handle)::text,'[]')) from private.menu_image_uploads u where store_id=$1) uploads,
  (select md5(coalesce(jsonb_agg(to_jsonb(a) order by asset_key)::text,'[]')) from private.menu_image_assets a where store_id=$1) assets,
  (select md5(coalesce(jsonb_agg(jsonb_build_array(id,image_asset_key) order by id)::text,'[]')) from public.menu_items where store_id=$1) items,
  (select md5(coalesce(jsonb_agg(to_jsonb(o) order by name)::text,'[]')) from storage.objects o where bucket_id=$2) objects`, [S[0], bucket])).rows[0];
const expectGatewayFailure = async (response: Response, status: number, code: string) => {
  expect(response.status).toBe(status); expect(response.headers.get("cache-control")).toBe("no-store");
  expect(await response.json()).toMatchObject({ ok: false, error: { code } });
};
const markedRpc = async (name: string, body: object = {}, employeeToken = token) => {
  const response = await fetch(`${env.api}/rest/v1/rpc/${name}`, { method: "POST", headers: {
    apikey: env.anonKey,
    Authorization: `Bearer ${env.storeJwt}`,
    "Content-Type": "application/json",
    "x-pos-employee-token": employeeToken,
    "x-pos-permission-contract": "2",
  }, body: JSON.stringify(body), signal: AbortSignal.timeout(10_000) });
  return response.json();
};
beforeAll(async () => {
  try {
    await setupImagesRuntimeFixture();
    await db.query(readFileSync("supabase/candidate/permission-changes.sql", "utf8"));
    await db.query(readFileSync("supabase/candidate/permission-images.sql", "utf8"));
    await db.query("notify pgrst,'reload schema'");
    await new Promise(resolve => setTimeout(resolve, 1200));
    token = (await rpc("permission_start_session", { p_employee_id: E[0], p_pin: "384729" })).token;
    ({ expiredJwt, validJwt: signedValidJwt } = await expiredImageStoreJwt());
    itemId = (await db.query("select id from public.menu_items where store_id=$1 order by id limit 1", [S[0]])).rows[0].id;
    compatibilityReceipt = await prepareCompatibilityHook(db);
    await verifyCompatibilityRestRouting({ restUrl: `${env.api}/rest/v1`, anonKey: env.anonKey });
    await db.query(readFileSync("supabase/candidate/permission-compatibility-activate.sql", "utf8"));
    await observeCandidateStage(db);
  } catch (error) {
    await cleanupImagesRuntimeFixture(compatibilityReceipt);
    throw error;
  }
});
afterAll(async () => {
  await cleanupImagesRuntimeFixture(compatibilityReceipt);
});

test("T09 real Storage and Edge lifecycle closes direct storage and checks authority before 304", async () => {
  expect((await db.query("select strict from private.permission_contract_gate where singleton")).rows[0].strict).toBe(true);
  const unmarked = await fetch(`${env.api}/rest/v1/rpc/permission_menu_image_read_staging`, { method: "POST", headers: {
    apikey: env.anonKey, Authorization: `Bearer ${env.storeJwt}`, "Content-Type": "application/json", "x-pos-employee-token": token,
  }, body: JSON.stringify({ p_upload_handle: crypto.randomUUID() }) });
  expect(unmarked.status).toBe(426);
  const direct = await fetch(`${env.api}/storage/v1/object/menu-item-image-staging/forged.png`, {
    method: "POST", headers: { apikey: env.anonKey, Authorization: `Bearer ${env.storeJwt}`, "Content-Type": "image/png" }, body: new Uint8Array([1,2,3]),
  });
  expect(direct.ok).toBe(false);

  const form = new FormData(); form.set("itemId", itemId); form.set("file", new File([new Uint8Array([137,80,78,71,13,10,26,10])], "tiny.png", { type: "image/png" }));
  const uploaded = await fetch(`${env.api}/functions/v1/menu-image-gateway`, { method: "POST", headers: headers(), body: form });
  expect(uploaded.status).toBe(201); expect(uploaded.headers.get("cache-control")).toBe("no-store");
  const uploadBody = await uploaded.json(); const uploadHandle = uploadBody.data.uploadHandle as string; await trackImageUpload(uploadHandle);
  expect(Object.keys(uploadBody.data)).toEqual(["uploadHandle"]);
  const uploadRow = (await db.query("select store_id,item_id,object_key from private.menu_image_uploads where upload_handle=$1", [uploadHandle])).rows[0];
  expect(uploadRow).toEqual({ store_id: S[0], item_id: itemId, object_key: `${S[0]}/menu-items/${itemId}/${uploadHandle}.png` });
  const originalBytes = await snapshotOwnedImageObject(uploadRow.object_key);
  expect(originalBytes.metadata).not.toBeNull(); expect(originalBytes.bytes).not.toBeNull(); expect(originalBytes.size).toBe(8);

  // Use a known-existing source and a tracked absent copy destination. A 200
  // empty remove denial is valid only when both bytes and metadata survive.
  const copyTarget = await trackImageCopyTarget(itemId);
  const noCopy = { metadata: null, bytes: null, size: null };
  expect(await snapshotOwnedImageObject(copyTarget)).toEqual(noCopy);
  const controlPng = imagePng();
  await verifyDirectImageMutationRoutes(itemId, controlPng, imagePng(controlPng.length + 13));
  const encodedKey = uploadRow.object_key.split("/").map(encodeURIComponent).join("/");
  for (const employee of [false, true]) {
    const directHeaders: Record<string, string> = { apikey: env.anonKey, Authorization: `Bearer ${env.storeJwt}`,
      ...(employee ? { "x-pos-employee-token": token } : {}) };
    const operations: { route: string; method: string; headers: Record<string, string>; body: Uint8Array<ArrayBuffer> | string }[] = [
      { route: `object/${bucket}/${encodedKey}`, method: "POST", headers: { "Content-Type": "image/png", "x-upsert": "true" }, body: imagePng() },
      { route: `object/${bucket}/${encodedKey}`, method: "PUT", headers: { "Content-Type": "image/png" }, body: imagePng() },
      { route: `object/${bucket}`, method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ prefixes: [uploadRow.object_key] }) },
      { route: "object/copy", method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ bucketId: bucket, sourceKey: uploadRow.object_key, destinationKey: copyTarget }) },
    ];
    for (const operation of operations) {
      const denied = await fetch(`${env.api}/storage/v1/${operation.route}`, { method: operation.method,
        headers: { ...directHeaders, ...operation.headers }, body: operation.body, signal: AbortSignal.timeout(5000) });
      // The paired service controls proved all four route/body shapes above.
      // Storage may return an error or a 200 empty denial; effects decide.
      expect(denied.status).toBeLessThan(500);
      await denied.arrayBuffer();
      expect(await snapshotOwnedImageObject(uploadRow.object_key)).toEqual(originalBytes);
      expect(await snapshotOwnedImageObject(copyTarget)).toEqual(noCopy);
    }
    const privateRead = await fetch(`${env.api}/storage/v1/object/${bucket}/${encodedKey}`, { headers: directHeaders });
    expect(privateRead.ok).toBe(false); await privateRead.arrayBuffer();
  }

  const beforeDenied = await imageState();
  // The same key, claims and iat must work; only exp differs in the denial.
  const signedPositive = await fetch(`${gateway}/staging/${uploadHandle}`, { headers: { ...headers(), Authorization: `Bearer ${signedValidJwt}` } });
  expect(signedPositive.status).toBe(200); expect(new Uint8Array(await signedPositive.arrayBuffer()).length).toBe(8);
  const cashier = (await markedRpc("permission_start_session", { p_employee_id: E[2], p_pin: "384729" })).token as string;
  const revoked = (await markedRpc("permission_start_session", { p_employee_id: E[1], p_pin: "384729" })).token as string;
  expect(typeof cashier).toBe("string"); expect(typeof revoked).toBe("string");
  expect(await markedRpc("permission_revoke_session", {}, revoked)).toMatchObject({ ok: true });
  const deniedCredentials: { label: string; headers: Record<string, string>; status: number; code?: string }[] = [
    { label: "missing JWT", headers: { apikey: env.anonKey, "x-pos-employee-token": token }, status: 401 },
    { label: "bad JWT", headers: { ...headers(), Authorization: "Bearer invalid.jwt.signature" }, status: 401 },
    { label: "expired signed JWT", headers: { ...headers(), Authorization: `Bearer ${expiredJwt}` }, status: 401 },
    { label: "missing employee", headers: { apikey: env.anonKey, Authorization: `Bearer ${env.storeJwt}` }, status: 401, code: "EMPLOYEE_SESSION_REQUIRED" },
    { label: "wrong employee", headers: { ...headers(), "x-pos-employee-token": "x".repeat(43) }, status: 401, code: "EMPLOYEE_SESSION_REQUIRED" },
    { label: "revoked employee", headers: { ...headers(), "x-pos-employee-token": revoked }, status: 401, code: "EMPLOYEE_SESSION_REQUIRED" },
    { label: "cashier without menu.manage", headers: { ...headers(), "x-pos-employee-token": cashier }, status: 403, code: "FORBIDDEN" },
  ];
  for (const credential of deniedCredentials) {
    for (const request of [
      { url: gateway, method: "POST", body: imageForm(itemId) },
      { url: `${gateway}/staging/${uploadHandle}`, method: "GET", body: undefined },
      { url: `${gateway}/staging/${uploadHandle}`, method: "DELETE", body: undefined },
    ]) {
      const response = await fetch(request.url, { method: request.method, headers: credential.headers, body: request.body });
      expect(response.status, credential.label).toBe(credential.status);
      if (credential.code) await expectGatewayFailure(response, credential.status, credential.code);
      else await response.arrayBuffer(); // Edge JWT rejection happens before the handler's cache headers.
    }
  }
  expect(await imageState()).toEqual(beforeDenied);
  expect(await snapshotOwnedImageObject(uploadRow.object_key)).toEqual(originalBytes);

  const invalidForms = [
    imageForm(itemId, imagePng(5 * 1024 * 1024 + 1)),
    imageForm(itemId, new Uint8Array(Buffer.from("R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7", "base64")), "image/gif"),
    imageForm(itemId, new Uint8Array()),
    imageForm(itemId, imagePng(), "image/png", { path: `${S[1]}/menu-items/${itemId}/${uploadHandle}.png` }),
    imageForm(itemId, imagePng(), "image/png", { path: `../${uploadRow.object_key}` }),
    imageForm(itemId, imagePng(), "image/png", { storeId: S[1] }),
    imageForm(itemId, imagePng(), "image/png", { objectKey: uploadRow.object_key }),
    imageForm(itemId, imagePng(), "image/png", { upsert: "true" }),
  ];
  for (const invalid of invalidForms) {
    await expectGatewayFailure(await fetch(gateway, { method: "POST", headers: headers(), body: invalid }), 400, "INVALID_WRITE_REQUEST");
    expect(await imageState()).toEqual(beforeDenied);
  }
  const boundaryBytes = imagePng(5 * 1024 * 1024);
  const boundary = await fetch(gateway, { method: "POST", headers: headers(), body: imageForm(itemId, boundaryBytes) });
  expect(boundary.status).toBe(201); expect(boundary.headers.get("cache-control")).toBe("no-store");
  const boundaryHandle = (await boundary.json()).data.uploadHandle as string; await trackImageUpload(boundaryHandle);
  const boundaryRow = (await db.query("select store_id,item_id,object_key,byte_size,state from private.menu_image_uploads where upload_handle=$1", [boundaryHandle])).rows[0];
  expect(boundaryRow).toMatchObject({ store_id: S[0], item_id: itemId, object_key: `${S[0]}/menu-items/${itemId}/${boundaryHandle}.png`, state: "ready" });
  expect(Number(boundaryRow.byte_size)).toBe(5 * 1024 * 1024);
  expect(await snapshotOwnedImageObject(boundaryRow.object_key)).toMatchObject({ size: 5 * 1024 * 1024,
    bytes: createHash("sha256").update(boundaryBytes).digest("hex") });
  const discard = await fetch(`${gateway}/staging/${boundaryHandle}`, { method: "DELETE", headers: headers() });
  expect(discard.status).toBe(200); expect(discard.headers.get("cache-control")).toBe("no-store");
  expect(await discard.json()).toEqual({ ok: true, data: null });
  expect((await db.query("select state from private.menu_image_uploads where upload_handle=$1", [boundaryHandle])).rows[0].state).toBe("discarded");
  expect(await snapshotOwnedImageObject(boundaryRow.object_key)).toEqual(noCopy);
  await expectGatewayFailure(await fetch(`${gateway}/staging/${boundaryHandle}`, { headers: headers() }), 404, "NOT_FOUND");
  expect(await snapshotOwnedImageObject(uploadRow.object_key)).toEqual(originalBytes);

  for (const sample of [
    { mime: "image/jpeg", extension: "jpg", bytes: imageJpeg() },
    { mime: "image/webp", extension: "webp", bytes: new Uint8Array(readFileSync("public/floor-assets/walls/img-color-cell4.webp")) },
  ]) {
    const response = await fetch(gateway, { method: "POST", headers: headers(), body: imageForm(itemId, sample.bytes, sample.mime) });
    expect(response.status).toBe(201); expect(response.headers.get("cache-control")).toBe("no-store");
    const body = await response.json(); expect(Object.keys(body.data)).toEqual(["uploadHandle"]);
    const handle = body.data.uploadHandle as string; await trackImageUpload(handle);
    const objectKey = `${S[0]}/menu-items/${itemId}/${handle}.${sample.extension}`;
    expect((await db.query("select object_key,mime_type from private.menu_image_uploads where upload_handle=$1", [handle])).rows[0])
      .toEqual({ object_key: objectKey, mime_type: sample.mime });
    const staged = await fetch(`${gateway}/staging/${handle}`, { headers: headers() });
    expect(staged.status).toBe(200); expect(staged.headers.get("cache-control")).toBe("no-store");
    expect(staged.headers.get("x-image-content-type")).toBe(sample.mime);
    expect(new Uint8Array(await staged.arrayBuffer())).toEqual(sample.bytes);
    const removed = await fetch(`${gateway}/staging/${handle}`, { method: "DELETE", headers: headers() });
    expect(removed.status).toBe(200); expect(await removed.json()).toEqual({ ok: true, data: null });
    expect(await snapshotOwnedImageObject(objectKey)).toEqual(noCopy);
  }

  for (const candidate of [crypto.randomUUID(), uploadHandle]) {
    await expectGatewayFailure(await fetch(`${env.api}/functions/v1/menu-image-public/${candidate}`), 404, "NOT_FOUND");
  }
  const publicBucket = await fetch(`${env.api}/storage/v1/object/public/${bucket}/${encodedKey}`);
  expect(publicBucket.ok).toBe(false); await publicBucket.arrayBuffer();
  const legacy = (await db.query("select name from storage.objects where bucket_id='menu-item-images' order by name limit 1")).rows[0];
  expect(legacy).toBeDefined();
  const legacyPublic = await fetch(`${env.api}/storage/v1/object/public/menu-item-images/${legacy.name.split("/").map(encodeURIComponent).join("/")}`);
  expect(legacyPublic.status).toBe(200); expect(new Uint8Array(await legacyPublic.arrayBuffer()).length).toBeGreaterThan(0);

  const staged = await fetch(`${env.api}/functions/v1/menu-image-gateway/staging/${uploadHandle}`, { headers: headers() });
  expect(staged.status).toBe(200); expect(staged.headers.get("cache-control")).toBe("no-store"); expect(new Uint8Array(await staged.arrayBuffer()).length).toBe(8);
  const method = await fetch(`${env.api}/functions/v1/menu-image-gateway/staging/${uploadHandle}`, { method: "PUT", headers: headers() });
  expect(method.status).toBe(405); expect(method.headers.get("cache-control")).toBe("no-store");
  for (const unsupported of ["POST", "PATCH", "HEAD"]) {
    const response = await fetch(`${gateway}/staging/${uploadHandle}`, { method: unsupported, headers: headers() });
    expect(response.status).toBe(405); expect(response.headers.get("cache-control")).toBe("no-store"); await response.arrayBuffer();
  }
  const unauth = await fetch(`${env.api}/functions/v1/menu-image-gateway/staging/${uploadHandle}`, {
    headers: { apikey: env.anonKey, Authorization: `Bearer ${env.storeJwt}` },
  });
  expect(unauth.status).toBe(401); expect(unauth.headers.get("cache-control")).toBe("no-store");

  const proposedItemId = crypto.randomUUID(), proposed = new FormData(); proposed.set("itemId", proposedItemId);
  proposed.set("file", new File([new Uint8Array([137,80,78,71,13,10,26,10])], "new.png", { type: "image/png" }));
  const proposedUpload = await fetch(`${env.api}/functions/v1/menu-image-gateway`, { method: "POST", headers: headers(), body: proposed });
  expect(proposedUpload.status).toBe(201); const proposedHandle = (await proposedUpload.json()).data.uploadHandle as string; await trackImageUpload(proposedHandle);
  expect((await db.query("select state from private.menu_image_uploads where upload_handle=$1", [proposedHandle])).rows[0].state).toBe("ready");
  expect(await markedRpc("apply_menu_changes", { p_changes: { ...emptyMenuChanges, imageChanges: [{ itemId: proposedItemId, uploadHandle: proposedHandle }] } })).toMatchObject({ ok: false, error: { code: "NOT_FOUND" } });
  expect(Number((await db.query("select count(*) n from private.menu_image_assets where item_id=$1", [proposedItemId])).rows[0].n)).toBe(0);
  expect(await markedRpc("apply_menu_changes", { p_changes: { ...emptyMenuChanges, imageChanges: [{ itemId: proposedItemId, uploadHandle: crypto.randomUUID() }] } })).toMatchObject({ ok: false, error: { code: "NOT_FOUND" } });
  const categoryId = (await db.query("select id from public.categories where store_id=$1 and deleted_at is null order by id limit 1", [S[0]])).rows[0].id;
  expect(await markedRpc("apply_menu_changes", { p_changes: { ...emptyMenuChanges,
    menuItems: { created: [{ id: proposedItemId, categoryId, name: "New staged image", price: 19000, imageAssetKey: null, sortOrder: 99, isAvailable: true }], updated: [], deleted: [] },
    imageChanges: [{ itemId: proposedItemId, uploadHandle: proposedHandle }],
  } })).toEqual({ ok: true, data: null });
  const proposedAsset = (await db.query("select image_asset_key from public.menu_items where id=$1", [proposedItemId])).rows[0].image_asset_key;
  expect((await fetch(`${env.api}/functions/v1/menu-image-public/${proposedAsset}`)).status).toBe(200);

  const deniedId = crypto.randomUUID(), deniedForm = new FormData(); deniedForm.set("itemId", deniedId);
  deniedForm.set("file", new File([new Uint8Array([137,80,78,71,13,10,26,10])], "denied.png", { type: "image/png" }));
  const deniedUpload = await fetch(`${env.api}/functions/v1/menu-image-gateway`, { method: "POST", headers: headers(), body: deniedForm });
  const deniedHandle = (await deniedUpload.json()).data.uploadHandle as string; await trackImageUpload(deniedHandle);
  await db.query("update public.employees set permission_overrides=jsonb_build_object('grants','[]'::jsonb,'denies','[\"menu.manage\"]'::jsonb),permission_revision=permission_revision+1 where id=$1", [E[0]]);
  expect(await markedRpc("apply_menu_changes", { p_changes: { ...emptyMenuChanges,
    menuItems: { created: [{ id: deniedId, categoryId, name: "Denied staged image", price: 19000, imageAssetKey: null, sortOrder: 100, isAvailable: true }], updated: [], deleted: [] },
    imageChanges: [{ itemId: deniedId, uploadHandle: deniedHandle }],
  } })).toMatchObject({ ok: false, error: { code: "FORBIDDEN" } });
  expect((await db.query("select state from private.menu_image_uploads where upload_handle=$1", [deniedHandle])).rows[0].state).toBe("ready");
  await db.query("update public.employees set permission_overrides=null,permission_revision=permission_revision+1 where id=$1", [E[0]]);

  expect(await markedRpc("apply_menu_changes", { p_changes: { ...emptyMenuChanges, imageChanges: [{ itemId, uploadHandle }] } })).toEqual({ ok: true, data: null });
  const assetKey = (await db.query("select image_asset_key from public.menu_items where store_id=$1 and id=$2", [S[0], itemId])).rows[0].image_asset_key;
  const publicUrl = `${env.api}/functions/v1/menu-image-public/${assetKey}`;
  const published = await fetch(publicUrl); expect(published.status).toBe(200); expect(published.headers.get("cache-control")).toBe("private, max-age=60, must-revalidate");
  const etag = published.headers.get("etag"); expect(etag).toBe(`"${assetKey}"`);
  const unchanged = await fetch(publicUrl, { headers: { "If-None-Match": etag! } }); expect(unchanged.status).toBe(304);
  const beforePublicMethods = await imageState();
  for (const method of ["POST", "PUT", "PATCH", "DELETE", "HEAD"]) {
    const denied = await fetch(publicUrl, { method });
    expect(denied.status).toBe(405); expect(denied.headers.get("cache-control")).toBe("no-store"); await denied.arrayBuffer();
  }
  expect(await imageState()).toEqual(beforePublicMethods);
  expect(await snapshotOwnedImageObject(uploadRow.object_key)).toEqual(originalBytes);

  // TC46 starts from a published A-old, rather than only a proposed new item.
  const replacement = await fetch(gateway, { method: "POST", headers: headers(), body: imageForm(itemId) });
  expect(replacement.status).toBe(201);
  const replacementHandle = (await replacement.json()).data.uploadHandle as string; await trackImageUpload(replacementHandle);
  const replacementKey = (await db.query("select object_key from private.menu_image_uploads where upload_handle=$1", [replacementHandle])).rows[0].object_key;
  const readyBytes = await snapshotOwnedImageObject(replacementKey), beforeRevoke = await imageState();
  await db.query("update public.employees set permission_overrides=jsonb_build_object('grants','[]'::jsonb,'denies','[\"menu.manage\"]'::jsonb),permission_revision=permission_revision+1 where id=$1", [E[0]]);
  try {
    expect(await markedRpc("apply_menu_changes", { p_changes: { ...emptyMenuChanges, imageChanges: [{ itemId, uploadHandle: replacementHandle }] } }))
      .toMatchObject({ ok: false, error: { code: "FORBIDDEN" } });
    expect(await imageState()).toEqual(beforeRevoke);
    expect((await db.query("select image_asset_key from public.menu_items where store_id=$1 and id=$2", [S[0], itemId])).rows[0].image_asset_key).toBe(assetKey);
    expect((await db.query("select state from private.menu_image_uploads where upload_handle=$1", [replacementHandle])).rows[0].state).toBe("ready");
    expect(Number((await db.query("select count(*) n from private.menu_image_assets where upload_handle=$1", [replacementHandle])).rows[0].n)).toBe(0);
    await expectGatewayFailure(await fetch(`${gateway}/staging/${replacementHandle}`, { headers: headers() }), 403, "FORBIDDEN");
    await expectGatewayFailure(await fetch(`${env.api}/functions/v1/menu-image-public/${replacementHandle}`), 404, "NOT_FOUND");
    const oldStillPublic = await fetch(publicUrl);
    expect(oldStillPublic.status).toBe(200); expect(new Uint8Array(await oldStillPublic.arrayBuffer())).toEqual(new Uint8Array([137,80,78,71,13,10,26,10]));
    expect(await snapshotOwnedImageObject(uploadRow.object_key)).toEqual(originalBytes);
    expect(await snapshotOwnedImageObject(replacementKey)).toEqual(readyBytes);
  } finally {
    await db.query("update public.employees set permission_overrides=null,permission_revision=permission_revision+1 where id=$1", [E[0]]);
  }

  const lookupDefinition = (await db.query("select pg_get_functiondef('public.permission_menu_image_public_lookup(uuid)'::regprocedure) definition")).rows[0].definition;
  const beforeLookupFault = await imageState();
  try {
    await db.query(`create or replace function public.permission_menu_image_public_lookup(p_asset_key uuid) returns jsonb
      language plpgsql stable security definer set search_path=pg_catalog as $$ begin raise exception 'IMAGE_LOOKUP_FAULT'; end $$`);
    for (const conditional of [{}, { "If-None-Match": etag! }]) {
      await expectGatewayFailure(await fetch(publicUrl, { headers: conditional }), 503, "IMAGE_GATEWAY_UNAVAILABLE");
    }
    expect(await imageState()).toEqual(beforeLookupFault);
  } finally { await db.query(lookupDefinition); }
  expect((await fetch(publicUrl)).status).toBe(200);

  const originalObjectKey = (await db.query("select object_key from private.menu_image_assets where asset_key=$1", [assetKey])).rows[0].object_key as string;
  const missingObjectKey = `${S[0]}/menu-items/${itemId}/missing-${crypto.randomUUID()}.png`;
  await db.query("update private.menu_image_assets set object_key=$1 where asset_key=$2 and object_key=$3",
    [missingObjectKey, assetKey, originalObjectKey]);
  try {
    for (const headers of [{}, { "If-None-Match": etag! }]) {
      const fault = await fetch(publicUrl, { headers });
      expect(fault.status).toBe(503);
      expect(fault.headers.get("cache-control")).toBe("no-store");
      expect((await fault.json()).error.code).toBe("IMAGE_STORAGE_UNAVAILABLE");
    }
  } finally {
    await db.query("update private.menu_image_assets set object_key=$1 where asset_key=$2 and object_key=$3",
      [originalObjectKey, assetKey, missingObjectKey]);
  }

  expect(await markedRpc("apply_menu_changes", { p_changes: { ...emptyMenuChanges, imageChanges: [{ itemId, uploadHandle: null }] } })).toEqual({ ok: true, data: null });
  const withdrawn = await fetch(publicUrl, { headers: { "If-None-Match": etag! } });
  expect(withdrawn.status).toBe(404); expect(withdrawn.headers.get("cache-control")).toBe("no-store");
  const publicMethod = await fetch(publicUrl, { method: "POST" }); expect(publicMethod.status).toBe(405); expect(publicMethod.headers.get("cache-control")).toBe("no-store");
  for (const suffix of [`${bucket}/${uploadRow.object_key}`, `staging/${replacementHandle}`]) {
    await expectGatewayFailure(await fetch(`${env.api}/functions/v1/menu-image-public/${suffix}`), 404, "NOT_FOUND");
  }

  expect(await markedRpc("apply_menu_changes", { p_changes: { ...emptyMenuChanges,
    menuItems: { created: [], updated: [], deleted: [{ id: proposedItemId }] }, imageChanges: [{ itemId: proposedItemId, uploadHandle: null }],
  } })).toMatchObject({ ok: false, error: { code: "NOT_FOUND" } });
  expect((await fetch(`${env.api}/functions/v1/menu-image-public/${proposedAsset}`)).status).toBe(200);
  expect(await markedRpc("apply_menu_changes", { p_changes: { ...emptyMenuChanges,
    menuItems: { created: [], updated: [], deleted: [{ id: proposedItemId }] },
  } })).toEqual({ ok: true, data: null });
  const deleted = await fetch(`${env.api}/functions/v1/menu-image-public/${proposedAsset}`, { headers: { "If-None-Match": `"${proposedAsset}"` } });
  expect(deleted.status).toBe(404); expect(deleted.headers.get("cache-control")).toBe("no-store");
  const tombstoneForm = new FormData(); tombstoneForm.set("itemId", proposedItemId);
  tombstoneForm.set("file", new File([new Uint8Array([137,80,78,71,13,10,26,10])], "tombstone.png", { type: "image/png" }));
  const tombstoneUpload = await fetch(`${env.api}/functions/v1/menu-image-gateway`, { method: "POST", headers: headers(), body: tombstoneForm });
  expect(tombstoneUpload.status).toBe(201); const tombstoneHandle = (await tombstoneUpload.json()).data.uploadHandle as string; await trackImageUpload(tombstoneHandle);
  expect(await markedRpc("apply_menu_changes", { p_changes: { ...emptyMenuChanges, imageChanges: [{ itemId: proposedItemId, uploadHandle: tombstoneHandle }] } })).toMatchObject({ ok: false, error: { code: "NOT_FOUND" } });
  expect((await db.query("select state from private.menu_image_uploads where upload_handle=$1", [tombstoneHandle])).rows[0].state).toBe("ready");
});
