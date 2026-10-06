import { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';

export function InvoiceExtractionReview({ result, onApply, onClose }) {
  const [selected, setSelected] = useState({});
  return <Modal title="Review extracted invoice" onClose={onClose}>
    <p className="mb-4 text-sm text-slate-300">Gemini can make mistakes. Select the suggestions to apply. Selected fields replace your current entries; nothing is saved yet.</p>
    {result.warnings?.length > 0 && <ul className="mb-4 list-disc space-y-1 pl-5 text-sm text-amber-100">{result.warnings.map((warning, index) => <li key={index}>{warning}</li>)}</ul>}
    <div className="space-y-3">
      {Object.entries(result.fields).map(([field, value]) => <label key={field} className="flex items-start gap-3 text-sm">
        <input type="checkbox" checked={Boolean(selected[field])} onChange={(event) => setSelected({ ...selected, [field]: event.target.checked })} />
        <span className="break-all">{field.replace(/([A-Z])/g, ' $1')}: {value}</span>
      </label>)}
    </div>
    {!Object.keys(result.fields).length && <p>No reliable details were found. Try a clearer image or enter details manually.</p>}
    {Object.keys(result.fields).length > 0 && <Button type="button" variant="secondary" className="mt-4" onClick={() => setSelected(Object.fromEntries(Object.keys(result.fields).map((field) => [field, true])))}>Select all suggestions</Button>}
    <div className="mt-5 flex justify-end gap-3">
      <Button type="button" variant="secondary" onClick={onClose}>Discard extraction</Button>
      <Button type="button" disabled={!Object.values(selected).some(Boolean)} onClick={() => onApply(Object.fromEntries(Object.entries(result.fields).filter(([field]) => selected[field])))}>Apply selected details</Button>
    </div>
  </Modal>;
}
