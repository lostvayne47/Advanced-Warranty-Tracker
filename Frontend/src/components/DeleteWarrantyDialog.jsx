import { useRef, useState } from "react";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { deleteWarranty } from "@/services/warrantyService";
import { getApiError } from "@/utils/apiErrors";

export function DeleteWarrantyDialog({ warranty, onClose, onDeleted }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const pending = useRef(false);
  async function confirm() {
    if (pending.current) return;
    pending.current = true;
    setBusy(true);
    setError("");
    try {
      await deleteWarranty(warranty.id);
      toast.success("Warranty deleted.");
      onDeleted(warranty.id);
      onClose();
    } catch (error) {
      if (error.response?.status === 404) {
        onDeleted(warranty.id);
        onClose();
        toast.success("This warranty has already been deleted.");
      } else {
        setError(getApiError(error, "Unable to delete this warranty. Try again."));
      }
    } finally {
      pending.current = false;
      setBusy(false);
    }
  }
  return (
    <Modal title="Delete warranty?" onClose={onClose} busy={busy}>
      <p className="text-sm leading-6 text-slate-300">
        Delete <strong className="text-white">{warranty.productName}</strong> and its saved invoice?
        This cannot be undone.
      </p>
      {error ? <p role="alert" className="mt-4 text-sm text-rose-200">{error}</p> : null}
      <div className="mt-6 flex justify-end gap-3">
        <Button type="button" variant="secondary" disabled={busy} onClick={onClose}>Cancel</Button>
        <Button type="button" variant="danger" isLoading={busy} onClick={confirm}>Delete warranty</Button>
      </div>
    </Modal>
  );
}
