import { useState } from "react";
import type { Category, MenuItem } from "@/domain";
import { formatVnd } from "@/core/money";
import { toToastError } from "../../appErrors";

type OrderMenuPaneProps = {
  categories: Category[] | undefined; items: MenuItem[]; allItems?: MenuItem[]; categoryId: string; search: string;
  isLoading: boolean; isError: boolean; error: unknown;
  getMenuImageUrl: (assetKey: string | null | undefined) => string | null;
  hasModifiers?: (itemId: string) => boolean;
  onSelectCategory: (categoryId: string) => void; onSearchChange: (search: string) => void; onRetry: () => void; onAddItem: (item: MenuItem) => void;
};

export function OrderMenuPane({ categories, items, allItems = items, categoryId, search, isLoading, isError, error, getMenuImageUrl, hasModifiers, onSelectCategory, onSearchChange, onRetry, onAddItem }: OrderMenuPaneProps) {
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});
  return <>
    <aside className="categories" data-testid="b02-categories"><h2>DANH MỤC MÓN</h2><nav className="category-list" aria-label="Danh mục món">{categories?.map(cat => <button key={cat.id} className={cat.id === categoryId && !search ? "selected" : undefined} data-testid={`b02-category-${cat.id}`} title={cat.name} aria-label={cat.name} aria-pressed={cat.id === categoryId && !search} onClick={() => onSelectCategory(cat.id)}><span className="category-name">{cat.name}</span><span className="category-count">{allItems.filter(item => item.categoryId === cat.id).length}</span></button>)}</nav></aside>
    <section className="menu-zone" data-testid="b02-menu">
      <div className="search-bar" data-testid="b02-search-bar"><label className="search-box"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10" cy="10" r="6"/><path d="m15 15 6 6"/></svg><input value={search} onChange={event => onSearchChange(event.target.value)} data-testid="b02-search" placeholder="Tìm món..." aria-label="Tìm món"/></label><span className="menu-count">{items.length} món</span></div>
      <div className="menu-scroll" data-testid="b02-menu-scroll">{isLoading ? <p className="empty-message">Đang tải menu...</p> : isError ? <div className="b02-menu-error" data-testid="order-menu-error-state"><strong>Không tải được menu</strong><p>{toToastError(error)}</p><button onClick={onRetry}>Thử tải lại</button></div> : !items.length ? <p className="empty-message">Không có món.</p> : <div className="product-grid">{items.map(item => {
        const image = getMenuImageUrl(item.imageAssetKey);
        return <button key={item.id} className={`product${item.isAvailable ? "" : " unavailable"}`} data-testid={`menu-item-${item.id}`} disabled={!item.isAvailable} title={item.name} onClick={() => onAddItem(item)}>
          <span className="product-image">{image && !failedImages[image] ? <img src={image} alt={`Ảnh ${item.name}`} onError={() => setFailedImages(old => ({ ...old, [image]: true }))}/> : <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 8h12v8a4 4 0 0 1-4 4H9a4 4 0 0 1-4-4Z M17 9h2a3 3 0 0 1 0 6h-2 M3 22h17 M8 2v3 M12 1v4"/></svg>}</span>
          <span className="product-name">{item.name}</span><span className="product-subtitle">{!item.isAvailable ? "Đã bán hết" : hasModifiers?.(item.id) ? "Có tùy chọn" : "Chọn để thêm vào đơn"}</span><span className="product-bottom"><span className="menu-price" data-testid={`b02-menu-price-${item.id}`}>{formatVnd(item.price)}</span><span className="add-label">+ Thêm</span></span>
        </button>;
      })}</div>}</div>
    </section>
  </>;
}
