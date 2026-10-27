import clsx from "clsx";
import { formatVnd } from "@/core/money";
import type { RpDataset } from "@/features/admin/reportHelpers";

type ReportSummaryProps = {
  dataset: Pick<RpDataset, "revenue" | "paidOrders" | "avgTicket" | "voidCount" | "voidAmount" | "hourly">;
  rangeLabel: string;
  hasData: boolean;
  peakHourLabel: string;
  sparkMax: number;
};

export function ReportSummary({ dataset, rangeLabel, hasData, peakHourLabel, sparkMax }: ReportSummaryProps) {
  return (
    <div
      data-testid="report-summary"
      data-revenue={dataset.revenue}
      data-paid-orders={dataset.paidOrders}
      data-void-count={dataset.voidCount}
      data-void-amount={dataset.voidAmount}
      className="relative overflow-hidden rounded-pos p-4 text-white"
      style={{ background: "linear-gradient(135deg,#0f766e,#0b5d57 60%,#0a4f4a)" }}
    >
      <div
        className="pointer-events-none absolute -right-8 -top-12 h-44 w-44 rounded-full"
        style={{ background: "radial-gradient(circle,rgba(255,255,255,0.14),transparent 70%)" }}
      />
      <div className="relative z-10">
        <div className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#bff0e7]">Doanh thu {rangeLabel}</div>
        <div className="mt-1 text-[28px] font-extrabold leading-none tracking-[-0.02em] tabular-nums">{formatVnd(dataset.revenue)}</div>
        <div className="mt-1.5 text-xs text-[#d7f5ef]">{dataset.paidOrders} đơn · TB {formatVnd(dataset.avgTicket)}</div>
        {dataset.hourly.length >= 2 && (
          <div className="mt-3 flex h-9 items-end gap-1">
            {dataset.hourly.map((h, i) => (
              <span
                key={`${h.label}-${i}`}
                className={clsx("flex-1 rounded-t", hasData && h.label === peakHourLabel ? "bg-white" : "bg-white/45")}
                style={{ height: `${Math.max(8, (h.revenue / sparkMax) * 100)}%` }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
