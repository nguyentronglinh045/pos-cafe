import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, XAxis, YAxis } from "recharts";
import { formatVnd } from "@/core/money";
import type { RpHour } from "@/features/admin/reportHelpers";

type ReportChartProps = {
  hourly: RpHour[];
  height: number;
  selectedHour: string | null;
  hasData: boolean;
  peakHourLabel: string;
  onSelectHour: (label: string) => void;
};

export function ReportChart({ hourly, height, selectedHour, hasData, peakHourLabel, onSelectHour }: ReportChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={hourly} margin={{ top: 8, right: 6, left: 6, bottom: 0 }}>
        <XAxis dataKey="label" tick={{ fontSize: 11 }} interval={0} />
        <YAxis hide />
        <RechartsTooltip formatter={(v: number) => formatVnd(v)} cursor={{ fill: "rgba(15,118,110,0.06)" }} labelStyle={{ fontWeight: 700 }} />
        <Bar dataKey="revenue" radius={[4, 4, 0, 0]} onClick={(d: { label?: string }) => d?.label && onSelectHour(d.label)}>
          {hourly.map((h) => (
            <Cell
              key={h.label}
              cursor="pointer"
              fill={
                selectedHour === h.label
                  ? "#0b5d57"
                  : hasData && h.label === peakHourLabel
                    ? "#f59e0b"
                    : "#0F766E"
              }
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
