"use client";

import { useActionState, useId, useMemo, useState } from "react";
import type { ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import type { EventItem, Product } from "@/lib/types";
import { PLATFORM_LABEL } from "@/lib/status";
import { addProduct, deleteProduct, type ProductFormState } from "@/lib/actions/products";
import { submitPromo, type SubmitState } from "@/lib/actions/submissions";

type SyncResult = { synced: number } | { error: string };

const addProductInitialState: ProductFormState = null;
const submitInitialState: SubmitState = null;

const SUBMIT_STATUS_LABEL: Record<string, string> = {
  berhasil: "Berhasil",
  pending: "Menunggu Approval",
  gagal: "Gagal",
};

export function ProductsView({
  products,
  events,
  initialEventIds = [],
  tiktokConnected = false,
  shopLabels = {},
}: {
  products: Product[];
  events: EventItem[];
  initialEventIds?: string[];
  tiktokConnected?: boolean;
  shopLabels?: Record<string, string>;
}) {
  const router = useRouter();
  const formId = useId();
  const [syncPending, setSyncPending] = useState(false);
  const [syncResult, setSyncResult] = useState<SyncResult | null>(null);
  const [search, setSearch] = useState("");
  const [selectedShopKey, setSelectedShopKey] = useState<string | null>(null);
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [selectedEventIds, setSelectedEventIds] = useState<string[]>(() =>
    initialEventIds.filter((id) => events.some((e) => e.id === id)),
  );
  const [diskonTipe, setDiskonTipe] = useState<"persen" | "nominal">("persen");
  const [diskonNilai, setDiskonNilai] = useState("");
  const [fotoNama, setFotoNama] = useState("");

  const [addState, addAction, addPending] = useActionState(addProduct, addProductInitialState);
  const [submitState, submitAction, submitPending] = useActionState(submitPromo, submitInitialState);

  const shopGroups = useMemo(() => {
    const groups = new Map<string, { key: string; label: string; items: Product[] }>();
    for (const product of products) {
      const key = product.source === "manual" ? "manual" : product.marketplace_connection_id ?? "unknown";
      if (!groups.has(key)) {
        const label =
          product.source === "manual"
            ? "Produk Manual"
            : shopLabels[product.marketplace_connection_id ?? ""] ?? "TikTok Shop";
        groups.set(key, { key, label, items: [] });
      }
      groups.get(key)!.items.push(product);
    }
    return Array.from(groups.values());
  }, [products, shopLabels]);

  const activeShopKey = selectedShopKey ?? shopGroups[0]?.key ?? null;
  const activeGroup = shopGroups.find((g) => g.key === activeShopKey) ?? null;

  const visibleProducts = useMemo(() => {
    if (!activeGroup) return [];
    const query = search.trim().toLowerCase();
    if (!query) return activeGroup.items;
    return activeGroup.items.filter(
      (p) => p.nama.toLowerCase().includes(query) || (p.sku ?? "").toLowerCase().includes(query),
    );
  }, [activeGroup, search]);

  const selectedEvents = useMemo(
    () => events.filter((e) => selectedEventIds.includes(e.id)),
    [events, selectedEventIds],
  );
  const needsDiskon = selectedEvents.some((e) => e.butuh_diskon);
  const needsFoto = selectedEvents.some((e) => e.butuh_foto);
  const hasExtraForm = needsDiskon || needsFoto;

  const canSubmit =
    selectedProductIds.length > 0 &&
    selectedEventIds.length > 0 &&
    (!needsDiskon || diskonNilai.trim() !== "") &&
    (!needsFoto || fotoNama !== "");

  function toggleProduct(id: string) {
    setSelectedProductIds((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id],
    );
  }

  function toggleEvent(id: string) {
    setSelectedEventIds((prev) =>
      prev.includes(id) ? prev.filter((e) => e !== id) : [...prev, id],
    );
  }

  function handleFotoChange(e: ChangeEvent<HTMLInputElement>) {
    setFotoNama(e.target.files?.[0]?.name ?? "");
  }

  async function handleSync() {
    setSyncPending(true);
    setSyncResult(null);
    try {
      const res = await fetch("/api/tiktok/products/sync", { method: "POST" });
      const json = await res.json();
      if (!res.ok) {
        setSyncResult({ error: json.message || "Gagal menarik produk dari TikTok Shop." });
      } else {
        setSyncResult({ synced: json.synced });
        router.refresh();
      }
    } catch {
      setSyncResult({ error: "Gagal menarik produk dari TikTok Shop." });
    } finally {
      setSyncPending(false);
    }
  }

  return (
    <>
      <div className="pagehead">
        <h1>Produk Saya</h1>
        <p className="lede">
          Kelola daftar produk dan submit produk untuk ikut event promo marketplace.
        </p>
      </div>

      <div className="submit-layout">
        <div>
          <div className="panel-label">Daftar Produk</div>

          {tiktokConnected && (
            <div style={{ marginBottom: 16 }}>
              <button
                type="button"
                className="submit-btn"
                onClick={handleSync}
                disabled={syncPending}
              >
                {syncPending ? "Menarik produk..." : "Tarik Produk dari TikTok Shop"}
              </button>
              {syncResult && "error" in syncResult && (
                <div className="auth-error show">{syncResult.error}</div>
              )}
              {syncResult && "synced" in syncResult && (
                <div className="result-card">
                  <div className="result-row">
                    <span>{syncResult.synced} produk berhasil ditarik dari TikTok Shop.</span>
                  </div>
                </div>
              )}
            </div>
          )}

          <form action={addAction} className="add-prod-form">
            <div className="add-prod-row">
              <input className="gf-input" name="nama" placeholder="Nama produk" required />
              <input className="gf-input" name="sku" placeholder="SKU (opsional)" />
            </div>
            <div className="add-prod-row">
              <input
                className="gf-input"
                name="stok"
                type="number"
                min={0}
                placeholder="Stok"
                defaultValue={0}
              />
            </div>
            {addState?.error && <div className="auth-error show">{addState.error}</div>}
            <button className="add-prod-btn" type="submit" disabled={addPending}>
              {addPending ? "Menambah..." : "+ Tambah Produk"}
            </button>
          </form>

          {products.length === 0 && (
            <p className="lede">Belum ada produk. Tambahkan produk pertamamu di atas.</p>
          )}

          {shopGroups.length > 0 && (
            <div className="shop-tabs">
              {shopGroups.map((group) => (
                <button
                  key={group.key}
                  type="button"
                  className={`shop-tab${group.key === activeShopKey ? " active" : ""}`}
                  onClick={() => setSelectedShopKey(group.key)}
                >
                  <span className="shop-tab-name" title={group.label}>
                    {group.label}
                  </span>
                  <span className="shop-tab-count">{group.items.length} produk</span>
                </button>
              ))}
            </div>
          )}

          {activeGroup && activeGroup.items.length > 5 && (
            <input
              className="gf-input prod-search"
              type="search"
              placeholder="Cari produk atau SKU..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          )}

          {activeGroup && visibleProducts.length === 0 && search && (
            <p className="lede">Tidak ada produk yang cocok dengan &quot;{search}&quot;.</p>
          )}

          {activeGroup && (
            <div className="prod-list">
              {visibleProducts.map((product) => (
                <div
                  className="prod-row"
                  key={product.id}
                  onClick={() => toggleProduct(product.id)}
                >
                  <input
                    type="checkbox"
                    checked={selectedProductIds.includes(product.id)}
                    onChange={() => toggleProduct(product.id)}
                    onClick={(e) => e.stopPropagation()}
                    aria-label={`Pilih ${product.nama}`}
                  />
                  <div className="prod-row-info">
                    <div className="prod-name" title={product.nama}>
                      {product.nama}
                    </div>
                    <div className="prod-meta">
                      {product.sku ? `SKU: ${product.sku} · ` : ""}Stok: {product.stok}
                      {product.platform_product_id && ` · ID: ${product.platform_product_id}`}
                    </div>
                  </div>
                  <form action={deleteProduct} onClick={(e) => e.stopPropagation()}>
                    <input type="hidden" name="id" value={product.id} />
                    <button type="submit" className="prod-del" aria-label={`Hapus ${product.nama}`}>
                      ✕
                    </button>
                  </form>
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <div className="panel-label">Pilih Event & Submit</div>

          <form action={submitAction}>
            <div className="evt-list-horizontal">
              {events.length === 0 && (
                <p className="lede">Tidak ada event yang bisa diikuti saat ini.</p>
              )}
              {events.map((event) => {
                const needsExtra = event.butuh_diskon || event.butuh_foto;
                const selected = selectedEventIds.includes(event.id);
                return (
                  <label
                    className={`evt-card${selected ? " selected" : ""}`}
                    key={event.id}
                  >
                    <input
                      type="checkbox"
                      checked={selected}
                      onChange={() => toggleEvent(event.id)}
                    />
                    <div className="evt-name" title={event.nama}>
                      {event.nama}
                    </div>
                    <div className="evt-meta">
                      <span className="form-flag">{PLATFORM_LABEL[event.platform]}</span>
                      {needsExtra && <span className="form-flag">Butuh data tambahan</span>}
                    </div>
                  </label>
                );
              })}
            </div>

            {selectedEventIds.map((id) => (
              <input key={id} type="hidden" name="event_ids" value={id} />
            ))}
            {selectedProductIds.map((id) => (
              <input key={id} type="hidden" name="product_ids" value={id} />
            ))}

            {hasExtraForm && (
              <div className="global-form">
                {needsDiskon && (
                  <>
                    <div className="gf-row">
                      <span className="gf-label">Tipe Diskon</span>
                      <div className="gf-toggle">
                        <button
                          type="button"
                          className={`gf-toggle-btn${diskonTipe === "persen" ? " active" : ""}`}
                          onClick={() => setDiskonTipe("persen")}
                        >
                          Persen
                        </button>
                        <button
                          type="button"
                          className={`gf-toggle-btn${diskonTipe === "nominal" ? " active" : ""}`}
                          onClick={() => setDiskonTipe("nominal")}
                        >
                          Nominal
                        </button>
                      </div>
                    </div>
                    <input type="hidden" name="diskon_tipe" value={diskonTipe} />
                    <input
                      className="gf-input"
                      name="diskon_nilai"
                      type="number"
                      min={0}
                      value={diskonNilai}
                      onChange={(e) => setDiskonNilai(e.target.value)}
                      placeholder={diskonTipe === "persen" ? "Nilai diskon (%)" : "Nilai diskon (Rp)"}
                      required
                    />
                  </>
                )}

                {needsFoto && (
                  <div>
                    <label className="gf-label" htmlFor={`${formId}-foto`}>
                      Foto Promo
                    </label>
                    <input
                      className="gf-input gf-input-file"
                      id={`${formId}-foto`}
                      type="file"
                      accept="image/*"
                      onChange={handleFotoChange}
                    />
                    <input type="hidden" name="foto_nama" value={fotoNama} />
                  </div>
                )}
              </div>
            )}

            {submitState && "error" in submitState && (
              <div className="auth-error show">{submitState.error}</div>
            )}

            <button className="submit-btn" type="submit" disabled={submitPending || !canSubmit}>
              {submitPending ? "Mengirim..." : "Submit ke Marketplace"}
            </button>
          </form>

          {submitState && "success" in submitState && (
            <div className="result-card">
              <div className="result-title">Hasil Submit</div>
              {submitState.results.map((r) => (
                <div className="result-row" key={r.eventId}>
                  <span>
                    {r.eventName} · {PLATFORM_LABEL[r.platform]}
                  </span>
                  <strong>{SUBMIT_STATUS_LABEL[r.status]}</strong>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
