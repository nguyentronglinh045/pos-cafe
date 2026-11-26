import { ArrowLeft, Check, type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

export type OwnerCreateStep = 1 | 2 | 3;

const steps: Array<{ step: OwnerCreateStep; label: string }> = [
  { step: 1, label: "Thông tin quán" },
  { step: 2, label: "Xác minh email" },
  { step: 3, label: "Nhận Store Key" },
];

type FrameProps = {
  testId: string;
  step: OwnerCreateStep;
  isMock: boolean;
  /** Shown in the header. The result frame has no back action because leaving goes through its own buttons. */
  back?: { onClick: () => void; disabled?: boolean };
  aside: ReactNode;
  children: ReactNode;
};

/**
 * Full-page frame shared by the two owner-create screens: the input frame
 * (create form, email verification) and the result frame (status lookup,
 * Store Key). It only lays out content; all behaviour stays with the caller.
 */
export function OwnerCreateFrame({ testId, step, isMock, back, aside, children }: FrameProps) {
  return (
    <main className="box-border grid min-h-[100dvh] w-full place-items-center overflow-y-auto overflow-x-hidden bg-pos-bg p-4 max-sm:p-3" data-testid={testId}>
      <div className="w-[min(960px,100%)] overflow-hidden rounded-pos border border-pos-line bg-pos-surface">
        <header className="flex items-center justify-between gap-3 border-b border-pos-line px-5 py-3 max-sm:px-4">
          {back ? (
            <button type="button" onClick={back.onClick} disabled={back.disabled}
              className="inline-flex min-h-11 cursor-pointer items-center gap-1.5 border-0 bg-transparent px-0 text-sm font-semibold text-pos-primary hover:underline disabled:cursor-not-allowed disabled:opacity-50">
              <ArrowLeft size={16} aria-hidden />
              Quay lại
            </button>
          ) : (
            <span className="text-sm font-semibold text-pos-muted">Tạo quán mới</span>
          )}
          <div className="flex items-center gap-2.5">
            {isMock && <span className="rounded-full border border-pos-line bg-pos-surface2 px-2 py-0.5 text-xs font-semibold text-pos-muted">Dữ liệu mock</span>}
            <div className="grid h-10 w-10 place-items-center rounded-pos bg-pos-primary font-black text-white" aria-hidden>P</div>
            <span className="text-base font-bold text-pos-ink max-[420px]:sr-only">POS Cafe</span>
          </div>
        </header>

        <nav aria-label="Các bước tạo quán" className="border-b border-pos-line bg-pos-surface2 px-5 py-3 max-sm:px-4">
          <ol className="m-0 grid list-none grid-cols-3 gap-2 p-0">
            {steps.map(item => {
              const done = item.step < step;
              const current = item.step === step;
              return (
                <li key={item.step} aria-current={current ? "step" : undefined}
                  className="flex min-w-0 items-center gap-2">
                  <span className={`grid h-7 w-7 shrink-0 place-items-center rounded-full border text-xs font-bold ${
                    done ? "border-pos-primary bg-pos-primary text-white"
                      : current ? "border-pos-primary bg-pos-primarySoft text-pos-primary"
                        : "border-pos-line bg-pos-surface text-pos-muted"}`}>
                    {done ? <Check size={14} aria-hidden /> : item.step}
                  </span>
                  <span className={`min-w-0 text-[13px] leading-tight max-sm:text-xs ${current ? "font-bold text-pos-ink" : "text-pos-muted"}`}>
                    {item.label}
                    {done && <span className="sr-only"> (đã xong)</span>}
                  </span>
                </li>
              );
            })}
          </ol>
        </nav>

        <div className="grid grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)] max-[700px]:grid-cols-1">
          <div className="grid content-start gap-5 p-[clamp(20px,4vw,36px)]">{children}</div>
          <aside className="grid content-start gap-4 border-l border-pos-line bg-pos-surface2 p-[clamp(20px,4vw,36px)] max-[700px]:border-l-0 max-[700px]:border-t">
            {aside}
          </aside>
        </div>
      </div>
    </main>
  );
}

export function FrameHeading({ title, description, headingRef }: {
  title: string;
  description: ReactNode;
  headingRef?: React.Ref<HTMLHeadingElement>;
}) {
  return (
    <div className="grid gap-1.5">
      <h1 ref={headingRef} tabIndex={headingRef ? -1 : undefined}
        className="m-0 text-[clamp(20px,3vw,26px)] leading-tight text-pos-ink outline-none">
        {title}
      </h1>
      <div className="m-0 text-sm leading-normal text-pos-muted">{description}</div>
    </div>
  );
}

export function AsideItem({ icon: Icon, title, children }: {
  icon: LucideIcon;
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-pos bg-pos-primarySoft text-pos-primary">
        <Icon size={16} aria-hidden />
      </span>
      <div className="grid gap-0.5">
        <strong className="text-[13px] text-pos-ink">{title}</strong>
        <p className="m-0 text-[13px] leading-normal text-pos-muted">{children}</p>
      </div>
    </div>
  );
}
