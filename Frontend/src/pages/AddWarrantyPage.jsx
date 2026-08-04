import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { FileInput } from "@/components/ui/FileInput";
import { GlassCard } from "@/components/ui/GlassCard";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import {
  createWarranty,
  extractInvoiceData,
  fetchWarranty,
  updateWarranty,
} from "@/services/warrantyService";
import { validateWarranty } from "@/utils/validation";

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

  useEffect(() => () => {
    if (invoicePreview) URL.revokeObjectURL(invoicePreview);
  }, [invoicePreview]);

  useEffect(() => {
    if (!isEditing) return;

    async function loadWarranty() {
      try {
        const warranty = await fetchWarranty(id);
        if (!warranty) {
          toast.error("Warranty not found.");
          navigate("/items", { replace: true });
          return;
        }
        setValues({ ...initialValues, ...warranty, file: null });
      } catch (error) {
        toast.error(error.response?.data?.message || "Unable to load this warranty.");
      } finally {
        setIsLoading(false);
      }
    }

    loadWarranty();
  }, [id, isEditing, navigate]);

  function handleInvoiceChange(file) {
    if (file && !file.type.startsWith("image/")) {
      setErrors((current) => ({ ...current, file: "Please choose an invoice image." }));
      return;
    }

    setErrors((current) => ({ ...current, file: undefined }));
    setValues((current) => ({ ...current, file }));
    setInvoicePreview(file ? URL.createObjectURL(file) : "");
  }

  async function handleExtractInvoice() {
    if (!values.file) {
      setErrors((current) => ({ ...current, file: "Capture or choose an invoice image first." }));
      return;
    }

    try {
      setIsExtracting(true);
      const extractedData = await extractInvoiceData(values.file);
      const allowedFields = Object.keys(initialValues).filter((field) => field !== "file");
      const safeData = Object.fromEntries(
        Object.entries(extractedData).filter(([field, value]) => allowedFields.includes(field) && value != null),
      );
      setValues((current) => ({ ...current, ...safeData }));
      toast.success("Invoice details extracted. Review and confirm the information below.");
    } catch (error) {
      toast.error(error.response?.data?.message || error.message || "Unable to extract invoice details.");
    } finally {
      setIsExtracting(false);
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const validationErrors = validateWarranty(values);
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) {
      return;
    }

    try {
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
      toast.error(error.response?.data?.message || "Unable to save this warranty.");
    } finally {
      setIsSubmitting(false);
    }
  }

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
            Capture an invoice to extract details, then review and confirm every field before saving.
          </p>
        </div>

        <form className="grid gap-5 md:grid-cols-2" onSubmit={handleSubmit}>
          <div className="md:col-span-2 rounded-2xl border border-brand/20 bg-brand/5 p-5">
            <p className="text-sm font-semibold text-white">1. Capture your invoice</p>
            <p className="mt-1 text-sm text-slate-300">
              Take a photo or choose an image. We will send it to the backend for extraction; you remain in control of the final details.
            </p>
            <div className="mt-4">
              <FileInput
                label="Invoice image"
                accept="image/*"
                capture="environment"
                error={errors.file}
                onChange={handleInvoiceChange}
              />
            </div>
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
              onClick={handleExtractInvoice}
            >
              Extract invoice details
            </Button>
          </div>

          <div className="md:col-span-2 mt-2 border-t border-white/10 pt-5">
            <p className="text-sm font-semibold text-white">2. Review and confirm</p>
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
            <Button type="submit" isLoading={isSubmitting || isLoading}>
              {isEditing ? "Save changes" : "Save warranty"}
            </Button>
          </div>
        </form>
      </GlassCard>
    </div>
  );
}
