import { describe, expect, it } from "vitest";
import type { MenuCatalog, OrderItemSnapshot, SubmitOrderDraftItem } from "@/domain";
import { buildCartLines, calculateCartTotal, orderDetailToDraft, snapshotToDraft, type OrderFlowOrder } from "./orderFlow";
import * as extracted from "./orderDraft";
import * as flow from "./orderFlow";
import * as pos from "./index";

const menu: MenuCatalog = {
  categories: [], optionGroups: [], menuItemOptionGroups: [],
  menuItems: [{ id: "coffee", categoryId: "drinks", name: "Cà phê mới", price: 50_000, imageAssetKey: null, sortOrder: 1, isAvailable: true }],
  optionValues: [{ id: "shot", optionGroupId: "extras", name: "Shot mới", priceDelta: 9_000, sortOrder: 1 }],
};
const snapshot = (): OrderItemSnapshot => ({
  id: "retained-line", menuItemId: "coffee", itemName: "Cà phê cũ", quantity: 3, unitPrice: 20_000,
  options: [{ id: "retained-option", optionValueId: "shot", optionName: "Shot cũ", quantity: 2, priceDelta: 3_000 }],
});
const order = (items: OrderItemSnapshot[]): OrderFlowOrder => ({
  id: "order", orderNo: 7, orderType: "dine_in", tableId: "table", status: "open", total: 78_000, lockVersion: 4, items,
});
const newDraft = (): SubmitOrderDraftItem => ({
  id: "new-line", menuItemId: "coffee", quantity: 2,
  options: [{ id: "new-option", optionValueId: "shot", quantity: 2 }],
});

describe("order draft presentation contracts", () => {
  it("preserves each function identity through the existing flow and POS barrel", () => {
    for (const name of ["snapshotToDraft", "orderDetailToDraft", "buildCartLines", "calculateCartTotal"] as const) {
      expect(flow[name]).toBe(extracted[name]);
      expect(pos[name]).toBe(extracted[name]);
    }
  });

  it("copies immutable source identity, prices and nested options without sharing mutable objects", () => {
    const source = snapshot();
    Object.freeze(source.options[0]); Object.freeze(source.options); Object.freeze(source);
    const sourceOrder = order([source]);
    Object.freeze(sourceOrder.items); Object.freeze(sourceOrder);
    const drafts = orderDetailToDraft(sourceOrder);
    expect(drafts).toEqual([{
      id: "retained-line", sourceItemId: "retained-line", sourceQuantity: 3,
      snapshotName: "Cà phê cũ", quotedBasePrice: 20_000, menuItemId: "coffee", quantity: 3, note: null,
      options: [{ id: "retained-option", optionValueId: "shot", quantity: 2, quotedPriceDelta: 3_000, snapshotName: "Shot cũ" }],
    }]);
    expect(drafts).not.toBe(sourceOrder.items);
    expect(drafts[0]).not.toBe(source);
    expect(drafts[0].options).not.toBe(source.options);
    expect(drafts[0].options[0]).not.toBe(source.options[0]);
    drafts[0].quantity = 1;
    drafts[0].options[0].quantity = 1;
    expect(source).toEqual(snapshot());
  });

  it.each([undefined, null, "", "Ít đá"])("preserves note normalization for %s", (note) => {
    expect(snapshotToDraft({ ...snapshot(), note }).note).toBe(note ?? null);
  });

  it("retains historical quotes across catalog changes and multiplies both option and item quantities", () => {
    const draft = snapshotToDraft(snapshot());
    const expected = [{ id: "retained-line", name: "Cà phê cũ", quantity: 3, optionText: "Shot cũ ×2", total: 78_000 }];
    expect(buildCartLines(menu, [draft])).toEqual(expected);
    expect(buildCartLines(undefined, [draft])).toEqual(expected);
    expect(calculateCartTotal(expected)).toBe(78_000);
  });

  it("treats quoted zero as a price rather than falling back to the nonzero catalog", () => {
    const draft = newDraft();
    draft.quotedBasePrice = 0; draft.snapshotName = "Món tặng";
    draft.options[0].quotedPriceDelta = 0; draft.options[0].snapshotName = "Shot tặng";
    expect(buildCartLines(menu, [draft])).toEqual([
      { id: "new-line", name: "Món tặng", quantity: 2, optionText: "Shot tặng ×2", total: 0 },
    ]);
  });

  it("uses current catalog values only when quotes are absent, without changing the input draft", () => {
    const draft = newDraft();
    const before = structuredClone(draft);
    expect(buildCartLines(menu, [draft])).toEqual([
      { id: "new-line", name: "Cà phê mới", quantity: 2, optionText: "Shot mới ×2", total: 136_000 },
    ]);
    expect(draft).toEqual(before);
  });

  it.each([undefined, menu])("displays missing identities without validating submission, catalog=%s", (catalog) => {
    const draft: SubmitOrderDraftItem = {
      id: "missing-line", menuItemId: "missing-item", quantity: 1,
      options: [{ id: "missing-option", optionValueId: "missing-value", quantity: 2 }],
    };
    expect(buildCartLines(catalog, [draft])).toEqual([
      { id: "missing-line", name: "Món không còn hợp lệ", quantity: 1, optionText: "Tuỳ chọn không còn hợp lệ ×2", total: 0 },
    ]);
  });

  it("excludes nonpositive draft quantities and sums only displayed lines, including the empty case", () => {
    const draft = snapshotToDraft(snapshot());
    const lines = buildCartLines(menu, [
      { ...draft, id: "removed", quantity: 0 }, draft,
      { ...draft, id: "negative", quantity: -1 }, newDraft(),
    ]);
    expect(lines.map((line) => [line.id, line.total])).toEqual([["retained-line", 78_000], ["new-line", 136_000]]);
    expect(calculateCartTotal(lines)).toBe(214_000);
    expect(buildCartLines(undefined, [])).toEqual([]);
    expect(orderDetailToDraft(order([]))).toEqual([]);
    expect(calculateCartTotal([])).toBe(0);
  });
});
