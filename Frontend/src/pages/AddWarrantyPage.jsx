import { useState } from "react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { FileInput } from "@/components/ui/FileInput";
import { GlassCard } from "@/components/ui/GlassCard";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { createWarranty } from "@/services/warrantyService";
import { validateWarranty } from "@/utils/validation";

const initialValues = {
  productName: "",
  purchaseDate: "",
  expiryDate: "",
  notes: "",
  file: null,
};

export function AddWarrantyPage() {
  const navigate = useNavigate();
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    const validationErrors = validateWarranty(values);
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) {
      return;
    }

    try {
      setIsSubmitting(true);
      await createWarranty(values);
      toast.success("Warranty added successfully.");
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
          <p className="text-sm uppercase tracking-[0.3em] text-brand">New coverage</p>
          <h2 className="mt-3 text-3xl font-bold text-white">Add a warranty</h2>
          <p className="mt-3 max-w-2xl text-sm text-slate-300">
            Save the essential purchase details and attach a proof-of-purchase file if you have one.
          </p>
        </div>

        <form className="grid gap-5 md:grid-cols-2" onSubmit={handleSubmit}>
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
            label="Purchase date"
            type="date"
            value={values.purchaseDate}
            error={errors.purchaseDate}
            onChange={(event) =>
              setValues((current) => ({ ...current, purchaseDate: event.target.value }))
            }
          />
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

          <div className="md:col-span-2">
            <FileInput
              label="Proof of purchase (optional)"
              error={errors.file}
              onChange={(file) => setValues((current) => ({ ...current, file }))}
            />
          </div>

          <div className="md:col-span-2 flex justify-end">
            <Button type="submit" isLoading={isSubmitting}>
              Save warranty
            </Button>
          </div>
        </form>
      </GlassCard>
    </div>
  );
}
