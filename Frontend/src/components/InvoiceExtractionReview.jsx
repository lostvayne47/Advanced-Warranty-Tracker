import { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';

export function InvoiceExtractionReview({ result, onApply, onClose }) {
  const [selected, setSelected] = useState({});
  return <Modal title="Review extracted invoice" onClose={onClose}>
    <p className="mb-4 text-sm text-slate-300">OCR can make mistakes. Select the suggestions to apply. Selected fields replace your current entries; nothing is saved yet.</p>
    <div className="space-y-3">
      {Object.entries(result.fields).map(([field, value]) => <label key={field} className="flex items-start gap-3 text-sm">
        <input type="checkbox" checked={Boolean(selected[field])} onChange={(event) => setSelected({ ...selected, [field]: event.target.checked })} />
        <span className="break-all">{field.replace(/([A-Z])/g, ' $1')}: {value}</span>
      </label>)}
    </div>
    {!Object.keys(result.fields).length && <p>No labelled fields were recognized. Use the text below to enter details manually.</p>}
    <details className="my-5"><summary>Recognized text</summary><pre className="mt-3 max-h-64 overflow-auto whitespace-pre-wrap text-sm">{result.text}</pre></details>
    <div className="flex justify-end gap-3">
      <Button type="button" variant="secondary" onClick={onClose}>Discard extraction</Button>
      <Button type="button" disabled={!Object.values(selected).some(Boolean)} onClick={() => onApply(Object.fromEntries(Object.entries(result.fields).filter(([field]) => selected[field])))}>Apply selected details</Button>
    </div>
  </Modal>;
}
