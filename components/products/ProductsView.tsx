"use client";

import { useActionState, useId, useState } from "react";
import type { ChangeEvent } from "react";
import type { EventItem, Product } from "@/lib/types";
import { PLATFORM_LABEL } from "@/lib/status";
import { addProduct, deleteProduct, type ProductFormState } from "@/lib/actions/products";
import { submitPromo, type SubmitState } from "@/lib/actions/submissions";

const addProductInitialState: ProductFormState = null;
const submitInitialState: SubmitState = null;

const SUBMIT_STATUS_LABEL: Record<string, string> = {
  berhasil: "Berhasil",
  pending: "Pending",
  gagal: "Gagal",
};

export function ProductsView({
  products,
  events,
  initialEventId,
}: {
  products: Product[];
  events: EventItem[];
  initialEventId?: string;
}) {
  const formId = useId();
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(
    initialEventId && events.some((e) => e.id === initialEventId) ? initialEventId : null,
  );
  const [diskonTipe, setDiskonTipe] = useState<"persen" | "nominal">("persen");
  const [fotoNama, setFotoNama] = useState("");

  const [addState, addAction, addPending] = useActionState(addProduct, addProductInitialState);
  const [submitState, submitAction, submitPending] = useActionState(submitPromo, submitInitialState);

  function toggleProduct(id: string) {
    setSelectedProductIds((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id],
    );
  }

  function handleFotoChange(e: ChangeEvent<HTMLInputElement>) {
    setFotoNama(e.target.files?.[0]?.name ?? "");
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

          <div className="prod-list">
            {products.length === 0 && (
              <p className="lede">Belum ada produk. Tambahkan produk pertamamu di atas.</p>
            )}
            {products.map((product) => (
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
                <div>
                  <div className="prod-name">{product.nama}</div>
                  <div className="prod-meta">
                    {product.sku ? `SKU: ${product.sku} · ` : ""}Stok: {product.stok}
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
        </div>

        <div>
          <div className="panel-label">Pilih Event & Submit</div>

          <form action={submitAction}>
            <div className="evt-list">
              {events.length === 0 && (
                <p className="lede">Tidak ada event yang bisa diikuti saat ini.</p>
              )}
              {events.map((event) => (
                <div className="evt-block" key={event.id}>
                  <label className="evt-row">
                    <input
                      type="radio"
                      name="event_id_display"
                      checked={selectedEventId === event.id}
                      onChange={() => setSelectedEventId(event.id)}
                    />
                    <div>
                      <div className="evt-name">{event.nama}</div>
                      <div className="evt-meta">
                        <span className="form-flag">{PLATFORM_LABEL[event.platform]}</span>
                      </div>
                    </div>
                  </label>
                </div>
              ))}
            </div>
            <input type="hidden" name="event_id" value={selectedEventId ?? ""} />

            {selectedProductIds.map((id) => (
              <input key={id} type="hidden" name="product_ids" value={id} />
            ))}

            <div className="global-form">
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
                placeholder={diskonTipe === "persen" ? "Nilai diskon (%)" : "Nilai diskon (Rp)"}
                required
              />

              <div>
                <label className="gf-label" htmlFor={`${formId}-foto`}>
                  Foto Promo (opsional)
                </label>
                <input
                  className="gf-input gf-input-file"
                  id={`${formId}-foto`}
                  type="file"
                  accept="image/*"
                  onChange={handleFotoChange}
                />
              </div>
              <input type="hidden" name="foto_nama" value={fotoNama} />
            </div>

            {submitState && "error" in submitState && (
              <div className="auth-error show">{submitState.error}</div>
            )}

            <button className="submit-btn" type="submit" disabled={submitPending}>
              {submitPending ? "Mengirim..." : "Submit ke Marketplace"}
            </button>
          </form>

          {submitState && "success" in submitState && (
            <div className="result-card">
              <div className="result-title">Hasil Submit</div>
              <div className="result-row">
                <span>Status</span>
                <strong>{SUBMIT_STATUS_LABEL[submitState.status]}</strong>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
