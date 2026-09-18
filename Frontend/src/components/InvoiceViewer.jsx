import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { fetchWarranty } from "@/services/warrantyService";
import { getApiError } from "@/utils/apiErrors";

export function InvoiceViewer({ warranty, onClose }) {
  const [receipt, setReceipt] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    let ignore = false;
    setLoading(true);
    setReceipt(null);
    setError("");
    fetchWarranty(warranty.id).then((item) => {
      if (ignore) return;
      if (!item) { setError("This warranty no longer exists."); return; }
      if (!item.invoiceImageUrl) { setError("No saved invoice image is available for this item."); return; }
      const url = new URL(item.invoiceImageUrl, window.location.origin);
      if (!["https:", "http:"].includes(url.protocol)) throw new Error("Invalid receipt URL");
      setReceipt({ fileName: item.fileName, url: url.href });
    }).catch((error) => {
      if (!ignore) setError(getApiError(error, "Unable to open the invoice. Please try again."));
    }).finally(() => { if (!ignore) setLoading(false); });
    return () => { ignore = true; };
  }, [warranty.id, revision]);

  return (
    <Modal title={`Invoice for ${warranty.productName}`} onClose={onClose}>
      {loading ? <p role="status" className="py-10 text-center text-slate-300">Loading invoice…</p> : null}
      {error ? <p role="alert" className="rounded-xl bg-rose-400/10 p-4 text-sm text-rose-200">{error}</p> : null}
      {receipt && !error ? (
        <div className="space-y-4">
          <p className="break-all text-sm text-slate-300">{receipt.fileName}</p>
          <img src={receipt.url} alt={`Saved invoice for ${warranty.productName}`}
            className="max-h-[60dvh] w-full rounded-xl bg-white object-contain"
            onError={() => setError("The invoice link may have expired. Refresh the invoice to try again.")} />
          <a href={receipt.url} target="_blank" rel="noreferrer" className="inline-block text-sm font-semibold text-brand">
            Open full-size invoice
          </a>
        </div>
      ) : null}
      <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-slate-400">Refresh the invoice if its link has expired.</p>
        <Button type="button" variant="secondary" isLoading={loading} onClick={() => setRevision((value) => value + 1)}>
          Refresh invoice
        </Button>
      </div>
    </Modal>
  );
}
