import { Link } from "react-router-dom";

export function WarrantyActions({ warranty, onDelete, onViewInvoice }) {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-3 text-sm font-semibold">
      <Link to={`/warranties/${warranty.id}/edit`} className="text-brand hover:underline">Edit</Link>
      {warranty.fileName || warranty.invoiceImageUrl ? (
        <button type="button" className="text-brand hover:underline" onClick={() => onViewInvoice(warranty)}>
          View invoice
        </button>
      ) : null}
      <button type="button" className="text-rose-300 hover:underline" onClick={() => onDelete(warranty)}
        aria-label={`Delete ${warranty.productName}`}>Delete</button>
    </div>
  );
}
