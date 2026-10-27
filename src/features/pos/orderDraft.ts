import type { MenuCatalog, OrderDetail, OrderItemSnapshot, SubmitOrderDraftItem } from "@/domain";

export type OrderFlowOrder = Pick<OrderDetail, "id" | "orderNo" | "orderType" | "tableId" | "status" | "total" | "lockVersion" | "items">;

export type CartLine = {
  id: string;
  name: string;
  quantity: number;
  optionText: string;
  total: number;
};

export const snapshotToDraft = (item: OrderItemSnapshot): SubmitOrderDraftItem => ({
  id: item.id,
  sourceItemId: item.id,
  sourceQuantity: item.quantity,
  snapshotName: item.itemName,
  quotedBasePrice: item.unitPrice,
  menuItemId: item.menuItemId,
  quantity: item.quantity,
  note: item.note ?? null,
  options: item.options.map((option) => ({
    id: option.id,
    optionValueId: option.optionValueId,
    quantity: option.quantity,
    quotedPriceDelta: option.priceDelta,
    snapshotName: option.optionName,
  })),
});

export const orderDetailToDraft = (order: OrderFlowOrder): SubmitOrderDraftItem[] =>
  order.items.map(snapshotToDraft);

export const buildCartLines = (menu: MenuCatalog | undefined, draftItems: SubmitOrderDraftItem[]): CartLine[] =>
  draftItems
    .filter((draft) => draft.quantity > 0)
    .map((draft) => {
      const menuItem = menu?.menuItems.find((item) => item.id === draft.menuItemId);
      const options = draft.options.map((option) => ({
        option,
        value: menu?.optionValues.find((candidate) => candidate.id === option.optionValueId),
      }));
      const optionDelta = options.reduce(
        (sum, option) => sum + (option.option.quotedPriceDelta ?? option.value?.priceDelta ?? 0) * option.option.quantity,
        0,
      );
      const unitPrice = draft.quotedBasePrice ?? menuItem?.price ?? 0;

      return {
        id: draft.id,
        name: draft.snapshotName ?? menuItem?.name ?? "Món không còn hợp lệ",
        quantity: draft.quantity,
        optionText: options
          .map((option) => {
            const name = option.option.snapshotName ?? option.value?.name ?? "Tuỳ chọn không còn hợp lệ";
            return option.option.quantity > 1 ? `${name} ×${option.option.quantity}` : name;
          })
          .filter(Boolean)
          .join(", "),
        total: (unitPrice + optionDelta) * draft.quantity,
      };
    });

export const calculateCartTotal = (cartLines: CartLine[]): number =>
  cartLines.reduce((sum, line) => sum + line.total, 0);
