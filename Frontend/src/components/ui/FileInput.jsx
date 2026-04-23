export function FileInput({ error, label, onChange }) {
  return (
    <label className="block space-y-2">
      <span className="text-sm font-medium text-slate-200">{label}</span>
      <div className="rounded-2xl border border-dashed border-white/15 bg-white/5 px-4 py-5">
        <input
          type="file"
          onChange={(event) => onChange(event.target.files?.[0] || null)}
          className="block w-full text-sm text-slate-300 file:mr-4 file:rounded-full file:border-0 file:bg-brand/20 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-brand"
        />
      </div>
      {error ? <p className="text-xs text-rose-300">{error}</p> : null}
    </label>
  );
}
