import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { FileInput } from "@/components/ui/FileInput";
import { GlassCard } from "@/components/ui/GlassCard";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { LoadError } from "@/components/ui/LoadError";
import { LoadingScreen } from "@/components/ui/LoadingScreen";
import { InvoiceViewer } from "@/components/InvoiceViewer";
import { InvoiceExtractionReview } from "@/components/InvoiceExtractionReview";
import { extractInvoiceData } from "@/services/invoiceExtraction";
import { appConfig } from "@/config/appConfig";
import {
  createWarranty,
  fetchWarranty,
  updateWarranty,
} from "@/services/warrantyService";
import { validateWarranty } from "@/utils/validation";
import { getApiError, getFieldErrors } from "@/utils/apiErrors";
import { INVOICE_ACCEPT, inspectInvoiceImage } from "@/utils/invoiceValidation";

const initialValues = {
  productName: "",
  brand: "",
  modelNumber: "",
  serialNumber: "",
  category: "",
  purchaseDate: "",
  purchasePrice: "",
  currency: "INR",
  retailerName: "",
  retailerOrderNumber: "",
  warrantyProvider: "",
  warrantyType: "MANUFACTURER",
  policyNumber: "",
  coverageStartDate: "",
  expiryDate: "",
  coverageTerms: "",
  supportPhone: "",
  supportEmail: "",
  supportUrl: "",
  notes: "",
  file: null,
};

export function AddWarrantyPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = Boolean(id);
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(isEditing);
  const [isExtracting, setIsExtracting] = useState(false);
  const [invoicePreview, setInvoicePreview] = useState("");
  const [loadError, setLoadError] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [conflict, setConflict] = useState(false);
  const [reloadRevision, setReloadRevision] = useState(0);
  const [showInvoice, setShowInvoice] = useState(false);
  const [checkingInvoice, setCheckingInvoice] = useState(false);
  const fileSequence = useRef(0);
  const saving = useRef(false);
  const extracting = useRef(false);
  const extractionController = useRef(null);
  const [extraction, setExtraction] = useState(null);
  const [extractionError, setExtractionError] = useState("");
  const [extractionProgress, setExtractionProgress] = useState("");
  useEffect(() => () => extractionController.current?.abort(), []);

  useEffect(() => () => {
    if (invoicePreview) URL.revokeObjectURL(invoicePreview);
  }, [invoicePreview]);

  useEffect(() => {
    let ignore = false;
    fileSequence.current++;
    extractionController.current?.abort();
    setExtraction(null);
    setExtractionError("");
    setCheckingInvoice(false);
    setValues(initialValues);
    setInvoicePreview("");
    setErrors({});
    setLoadError("");
    setSubmitError("");
    setConflict(false);
    if (!isEditing) {
      setIsLoading(false);
      return () => { fileSequence.current++; };
    }
    setIsLoading(true);

    async function loadWarranty() {
      try {
        const warranty = await fetchWarranty(id);
        if (ignore) return;
        if (!warranty) {
          setLoadError("Warranty not found. Return to All items to choose another warranty.");
          return;
        }
        const normalized = Object.fromEntries(Object.entries(initialValues)
          .map(([field, fallback]) => [field, warranty[field] ?? fallback]));
        setValues({ ...normalized, id: warranty.id, version: warranty.version,
          fileName: warranty.fileName, invoiceImageUrl: warranty.invoiceImageUrl, file: null });
      } catch (error) {
        if (!ignore) setLoadError(getApiError(error, "Unable to load this warranty."));
      } finally {
        if (!ignore) setIsLoading(false);
      }
    }

    loadWarranty();
    return () => { ignore = true; fileSequence.current++; };
  }, [id, isEditing, reloadRevision]);

  async function handleInvoiceChange(file) {
    extractionController.current?.abort();
    setExtraction(null);
    setExtractionError("");
    const sequence = ++fileSequence.current;
    setValues((current) => ({ ...current, file: null }));
    setInvoicePreview("");
    setCheckingInvoice(Boolean(file));
    setErrors((current) => ({ ...current, file: undefined }));
    if (!file) return;
    const error = await inspectInvoiceImage(file);
    if (sequence !== fileSequence.current) return;
    setCheckingInvoice(false);
    if (error) { setErrors((current) => ({ ...current, file: error })); return; }
    setValues((current) => ({ ...current, file }));
    setInvoicePreview(URL.createObjectURL(file));
  }

  async function handleExtractInvoice() {
    if (extracting.current || checkingInvoice || saving.current) return;
    if (!values.file) {
      setErrors((current) => ({ ...current, file: "Capture or choose an invoice image first." }));
      return;
    }

    const sequence = fileSequence.current;
    const controller = new AbortController();
    extractionController.current = controller;
    try {
      extracting.current = true;
      setExtractionError("");
      setIsExtracting(true);
      setExtractionProgress("Preparing invoice…");
      const result = await extractInvoiceData(values.file, { signal: controller.signal, onProgress: setExtractionProgress });
      if (sequence === fileSequence.current && !controller.signal.aborted) setExtraction(result);
    } catch (error) {
      if (!controller.signal.aborted && sequence === fileSequence.current)
        setExtractionError(error.message || "Unable to extract invoice details. Enter them manually.");
    } finally {
      extracting.current = false;
      setIsExtracting(false);
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (saving.current || checkingInvoice || isExtracting || isLoading || loadError || conflict) return;
    setSubmitError("");
    const validationErrors = { ...validateWarranty(values), ...(errors.file ? { file: errors.file } : {}) };
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) {
      return;
    }

    try {
      saving.current = true;
      setIsSubmitting(true);
      if (isEditing) {
        await updateWarranty(id, values);
        toast.success("Warranty updated successfully.");
      } else {
        await createWarranty(values);
        toast.success("Warranty added successfully.");
      }
      navigate("/dashboard");
    } catch (error) {
      setErrors(getFieldErrors(error));
      setSubmitError(getApiError(error, "Unable to save this warranty. Your changes are still in the form."));
      setConflict(error.response?.status === 409);
    } finally {
      saving.current = false;
      setIsSubmitting(false);
    }
  }

  if (isLoading) return <LoadingScreen />;
  if (loadError) return <LoadError message={loadError} onRetry={() => setReloadRevision((value) => value + 1)} />;

  return (
    <div className="mx-auto max-w-4xl">
      <GlassCard className="animate-fadeUp">
        <div className="mb-8">
          <p className="text-sm uppercase tracking-[0.3em] text-brand">
            {isEditing ? "Update coverage" : "New coverage"}
          </p>
          <h2 className="mt-3 text-3xl font-bold text-white">
            {isEditing ? "Edit warranty" : "Add a warranty"}
          </h2>
          <p className="mt-3 max-w-2xl text-sm text-slate-300">
            Add your product and coverage details, and attach an invoice if you have one.
          </p>
        </div>

        <form className="grid gap-5 md:grid-cols-2" onSubmit={handleSubmit}>
          {submitError ? (
            <div className="md:col-span-2 rounded-xl bg-rose-400/10 p-4">
              <p role="alert" className="text-sm text-rose-200">{submitError}</p>
              {conflict ? (
                <div className="mt-3 space-y-3">
                  <p className="text-sm text-slate-300">Copy any changes you want to keep before reloading. Reloading replaces this form with the latest saved version.</p>
                  <Button type="button" variant="secondary" onClick={() => {
                    if (window.confirm("Reload the latest warranty? Your unsaved changes will be discarded.")) setReloadRevision((value) => value + 1);
                  }}>Reload latest warranty</Button>
                </div>
              ) : null}
              {Object.keys(errors).length ? (
                <ul className="mt-2 list-inside list-disc text-sm text-rose-200">
                  {Object.entries(errors).map(([field, message]) => (
                    <li key={field}>{field.replace(/([A-Z])/g, " $1").replace(/^./, (letter) => letter.toUpperCase())}: {message}</li>
                  ))}
                </ul>
              ) : null}
            </div>
          ) : null}
          {isExtracting ? <div className="md:col-span-2">
            <p role="status" className="text-sm text-slate-300">{extractionProgress}</p>
            <Button type="button" variant="secondary" onClick={() => extractionController.current?.abort()}>Cancel extraction</Button>
          </div> : null}
          <fieldset disabled={isSubmitting || isExtracting} className="contents">
          <div className="md:col-span-2 rounded-2xl border border-brand/20 bg-brand/5 p-5">
            <p className="text-sm font-semibold text-white">Invoice (optional)</p>
            <p className="mt-1 text-sm text-slate-300">
              JPEG, PNG, or still WebP, up to 10 MB and 20 megapixels.
              {isEditing ? " Choose a new image only if you want to replace the saved invoice." : ""}
            </p>
            <p className="mt-2 text-sm text-slate-300">Extract invoice details sends this image to Google Gemini to read product and purchase details. Review the suggestions before applying them; your warranty is saved only when you choose Save.</p>
            {isEditing && values.fileName ? (
              <div className="mt-3 flex flex-wrap items-center gap-3 text-sm">
                <span className="break-all text-slate-300">Saved invoice: {values.fileName}</span>
                <Button type="button" variant="secondary" onClick={() => setShowInvoice(true)}>View saved invoice</Button>
              </div>
            ) : null}
            {!appConfig.apiBaseUrl ? <p className="mt-2 text-sm text-amber-100">Demo mode saves invoice filenames only, not image files.</p> : null}
            <div className="mt-4">
              <FileInput
                label="Invoice image"
                accept={INVOICE_ACCEPT}
                capture="environment"
                error={errors.file}
                onChange={handleInvoiceChange}
              />
            </div>
            {checkingInvoice ? <p role="status" className="mt-3 text-sm text-slate-300">Checking image…</p> : null}
            {errors.file && !values.file ? (
              <Button type="button" variant="ghost" className="mt-2" onClick={() => handleInvoiceChange(null)}>Continue without a new invoice</Button>
            ) : null}
            {values.file ? (
              <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-slate-300">
                <span className="break-all">{values.file.name}</span>
                <Button type="button" variant="ghost" onClick={() => handleInvoiceChange(null)}>Remove selected image</Button>
              </div>
            ) : null}
            {invoicePreview ? (
              <img
                src={invoicePreview}
                alt="Invoice preview"
                className="mt-4 max-h-72 w-full rounded-xl border border-white/10 object-contain"
              />
            ) : null}
            <Button
              type="button"
              variant="secondary"
              className="mt-4"
              isLoading={isExtracting}
              disabled={checkingInvoice || !values.file || isSubmitting}
              onClick={handleExtractInvoice}
            >
              {extractionError ? "Retry invoice extraction" : "Extract invoice details"}
            </Button>
            {extractionError ? <div role="alert" className="mt-3 rounded-xl border border-rose-400/30 bg-rose-400/10 p-4 text-sm text-rose-100">
              <p className="font-semibold">Invoice details could not be extracted</p>
              <p className="mt-1">{extractionError}</p>
              <p className="mt-2">Your image and form entries are still here. Retry extraction or enter the details manually.</p>
            </div> : null}
          </div>

          <div className="md:col-span-2 mt-2 border-t border-white/10 pt-5">
            <p className="text-sm font-semibold text-white">Product details</p>
          </div>
          <div className="md:col-span-2">
            <Input
              label="Product name"
              placeholder="Dell XPS 13"
              value={values.productName}
              error={errors.productName}
              onChange={(event) =>
                setValues((current) => ({ ...current, productName: event.target.value }))
              }
            />
          </div>

          <Input
            label="Brand"
            placeholder="Dell"
            value={values.brand}
            onChange={(event) => setValues((current) => ({ ...current, brand: event.target.value }))}
          />
          <Input
            label="Category"
            placeholder="Laptop, appliance, phone..."
            value={values.category}
            onChange={(event) => setValues((current) => ({ ...current, category: event.target.value }))}
          />
          <Input
            label="Model number"
            placeholder="XPS 13 9340"
            value={values.modelNumber}
            onChange={(event) => setValues((current) => ({ ...current, modelNumber: event.target.value }))}
          />
          <Input
            label="Serial number"
            placeholder="Optional"
            value={values.serialNumber}
            onChange={(event) => setValues((current) => ({ ...current, serialNumber: event.target.value }))}
          />

          <Input
            label="Purchase date"
            type="date"
            value={values.purchaseDate}
            error={errors.purchaseDate}
            onChange={(event) =>
              setValues((current) => ({ ...current, purchaseDate: event.target.value }))
            }
          />

          <Input
            label="Coverage starts"
            type="date"
            value={values.coverageStartDate}
            error={errors.coverageStartDate}
            onChange={(event) =>
              setValues((current) => ({ ...current, coverageStartDate: event.target.value }))
            }
          />

          <Input
            label="Purchase price"
            type="number"
            min="0"
            step="0.01"
            placeholder="Optional"
            value={values.purchasePrice}
            error={errors.purchasePrice}
            onChange={(event) => setValues((current) => ({ ...current, purchasePrice: event.target.value }))}
          />
          <Input
            label="Currency"
            maxLength="3"
            placeholder="INR"
            value={values.currency}
            error={errors.currency}
            onChange={(event) =>
              setValues((current) => ({ ...current, currency: event.target.value.toUpperCase() }))
            }
          />
          <Input
            label="Retailer"
            placeholder="Amazon, Croma..."
            value={values.retailerName}
            onChange={(event) => setValues((current) => ({ ...current, retailerName: event.target.value }))}
          />
          <Input
            label="Order number"
            placeholder="Optional"
            value={values.retailerOrderNumber}
            onChange={(event) =>
              setValues((current) => ({ ...current, retailerOrderNumber: event.target.value }))
            }
          />

          <div className="md:col-span-2 mt-4 border-t border-white/10 pt-5">
            <p className="text-sm font-semibold text-white">Coverage details</p>
          </div>
          <Input
            label="Warranty provider"
            placeholder="Manufacturer or insurer"
            value={values.warrantyProvider}
            onChange={(event) =>
              setValues((current) => ({ ...current, warrantyProvider: event.target.value }))
            }
          />
          <label className="block space-y-2">
            <span className="text-sm font-medium text-slate-200">Warranty type</span>
            <select
              value={values.warrantyType}
              onChange={(event) =>
                setValues((current) => ({ ...current, warrantyType: event.target.value }))
              }
              className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-sm text-white outline-none transition focus:border-brand/60"
            >
              <option value="MANUFACTURER">Manufacturer</option>
              <option value="EXTENDED">Extended</option>
              <option value="SELLER">Seller</option>
              <option value="INSURANCE">Insurance</option>
              <option value="OTHER">Other</option>
            </select>
          </label>
          <Input
            label="Policy or plan number"
            placeholder="Optional"
            value={values.policyNumber}
            onChange={(event) => setValues((current) => ({ ...current, policyNumber: event.target.value }))}
          />
          <Input
            label="Support phone"
            type="tel"
            placeholder="Optional"
            value={values.supportPhone}
            onChange={(event) => setValues((current) => ({ ...current, supportPhone: event.target.value }))}
          />
          <Input
            label="Support email"
            type="email"
            placeholder="Optional"
            value={values.supportEmail}
            onChange={(event) => setValues((current) => ({ ...current, supportEmail: event.target.value }))}
          />
          <Input
            label="Support website"
            type="url"
            placeholder="https://..."
            value={values.supportUrl}
            onChange={(event) => setValues((current) => ({ ...current, supportUrl: event.target.value }))}
          />

          <div className="md:col-span-2">
            <Textarea
              label="Coverage terms"
              placeholder="What the plan covers, exclusions, or claim instructions"
              value={values.coverageTerms}
              onChange={(event) =>
                setValues((current) => ({ ...current, coverageTerms: event.target.value }))
              }
            />
          </div>
          <Input
            label="Expiry date"
            type="date"
            value={values.expiryDate}
            error={errors.expiryDate}
            onChange={(event) =>
              setValues((current) => ({ ...current, expiryDate: event.target.value }))
            }
          />

          <div className="md:col-span-2">
            <Textarea
              label="Notes"
              placeholder="Serial number, coverage details, or support contact information"
              value={values.notes}
              error={errors.notes}
              onChange={(event) => setValues((current) => ({ ...current, notes: event.target.value }))}
            />
          </div>

          <div className="md:col-span-2 flex justify-end">
            <Button type="submit" isLoading={isSubmitting} disabled={checkingInvoice || isExtracting || conflict}>
              {isEditing ? "Save changes" : "Save warranty"}
            </Button>
          </div>
          </fieldset>
        </form>
      </GlassCard>
      {showInvoice ? <InvoiceViewer warranty={{ id, productName: values.productName }} onClose={() => setShowInvoice(false)} /> : null}
      {extraction ? <InvoiceExtractionReview result={extraction} onClose={() => setExtraction(null)} onApply={(fields) => {
        setValues((current) => ({ ...current, ...fields }));
        setErrors((current) => Object.fromEntries(Object.entries(current).filter(([field]) => !(field in fields))));
        setExtraction(null);
        toast.success("Selected details applied. Review the form before saving.");
      }} /> : null}
    </div>
  );
}
