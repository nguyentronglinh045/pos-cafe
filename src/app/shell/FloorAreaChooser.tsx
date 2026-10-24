import { useLayoutEffect, useRef, useState } from "react";
import type { FloorArea, FloorTable } from "@/domain";

type Props = {
  areas: FloorArea[];
  tables: FloorTable[];
  activeAreaId: string | null;
  onSelect: (id: string) => void;
};

/** Presentation only: arrows scroll; the existing callback selects the area. */
export function FloorAreaChooser({ areas, tables, activeAreaId, onSelect }: Props) {
  const chooser = useRef<HTMLDivElement>(null);
  const scroller = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ overflow: false, atStart: true, atEnd: true });

  const measure = () => {
    const outer = chooser.current, list = scroller.current;
    if (!outer || !list) return;
    const next = {
      overflow: list.scrollWidth > outer.clientWidth + 1,
      atStart: list.scrollLeft <= 1,
      atEnd: list.scrollLeft + list.clientWidth >= list.scrollWidth - 1,
    };
    setPosition(old => old.overflow === next.overflow && old.atStart === next.atStart && old.atEnd === next.atEnd ? old : next);
  };

  useLayoutEffect(() => {
    const outer = chooser.current, list = scroller.current;
    if (!outer || !list) return;
    let frame = 0;
    const revealSelected = () => {
      const selected = list.querySelector<HTMLElement>('[aria-pressed="true"]');
      if (selected) {
        const item = selected.getBoundingClientRect(), viewport = list.getBoundingClientRect();
        if (item.left < viewport.left) list.scrollLeft -= viewport.left - item.left;
        else if (item.right > viewport.right) list.scrollLeft += item.right - viewport.right;
      }
      measure();
    };
    const resize = () => {
      measure();
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(revealSelected);
    };
    resize();
    const observer = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(resize);
    observer?.observe(outer);
    observer?.observe(list);
    window.addEventListener("resize", resize);
    return () => { cancelAnimationFrame(frame); observer?.disconnect(); window.removeEventListener("resize", resize); };
  }, [activeAreaId, areas, tables]);

  const scroll = (direction: number) => {
    const list = scroller.current;
    if (!list) return;
    list.scrollLeft += direction * Math.max(120, list.clientWidth * 0.8);
    measure();
  };

  return <div className="area-chooser" data-testid="floor-area-chooser" ref={chooser}>
    <button type="button" className="icon-button area-step" data-testid="floor-area-prev" aria-label="Cuộn khu vực về trước" hidden={!position.overflow} disabled={position.atStart} onClick={() => scroll(-1)}><span aria-hidden="true">‹</span></button>
    <div className="area-tabs b01-zones" aria-label="Khu vực" data-testid="floor-area-scroller" ref={scroller} onScroll={measure}>
      {areas.map(area => <button type="button" key={area.id} data-testid={`floor-area-${area.id}`} aria-pressed={area.id === activeAreaId} title={area.name} aria-label={area.name} onClick={() => onSelect(area.id)}><span className="b01-zone-name">{area.name}</span><span className="tab-count">{tables.filter(table => table.areaId === area.id).length}</span></button>)}
    </div>
    <button type="button" className="icon-button area-step" data-testid="floor-area-next" aria-label="Cuộn khu vực về sau" hidden={!position.overflow} disabled={position.atEnd} onClick={() => scroll(1)}><span aria-hidden="true">›</span></button>
  </div>;
}
