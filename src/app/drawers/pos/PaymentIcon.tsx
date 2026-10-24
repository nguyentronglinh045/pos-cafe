const paths = {
  back: "M19 12H5m7-7-7 7 7 7",
  close: "m6 6 12 12M6 18 18 6",
  receipt: "M6 3h12v18l-3-2-3 2-3-2-3 2V3m3 5h6m-6 4h6",
  cash: "M3 6h18v12H3zM12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6",
  transfer: "m3 9 9-6 9 6H3m2 3v6m7-6v6m7-6v6M3 21h18",
  card: "M3 5h18v14H3zM3 10h18",
  qr: "M3 3h6v6H3zM15 3h6v6h-6zM3 15h6v6H3zm12 0h3v3h3v3h-6z",
  print: "M6 8V3h12v5M6 17H3V9h18v8h-3M6 14h12v7H6z",
  check: "m5 12 4 4L19 6",
  plus: "M12 5v14M5 12h14",
  delete: "m9 5-7 7 7 7h12V5H9m3 4 6 6m-6 0 6-6"
};
/** Approved B03 presentation assets; inherit semantic text color. */
export function PaymentIcon({
  name
}: {
  name: keyof typeof paths;
}) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={paths[name]} /></svg>;
}
