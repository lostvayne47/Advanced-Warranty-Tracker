import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { AuthLayout } from "@/components/layout/AuthLayout";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useAuth } from "@/hooks/useAuth";
import { validateAuth } from "@/utils/validation";

const initialValues = {
  name: "",
  email: "",
  password: "",
};

export function SignupPage() {
  const navigate = useNavigate();
  const { signup } = useAuth();
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    const validationErrors = validateAuth(values, "signup");
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) {
      return;
    }

    try {
      setIsSubmitting(true);
      await signup(values);
      toast.success("Your account is ready.");
      navigate("/dashboard", { replace: true });
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to create your account.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AuthLayout
      title="Create a new account"
      subtitle="Start tracking product warranties, coverage dates, and receipts in one place."
    >
      <form className="space-y-5" onSubmit={handleSubmit}>
        <Input
          label="Full name"
          type="text"
          placeholder="Avery Watson"
          value={values.name}
          error={errors.name}
          onChange={(event) => setValues((current) => ({ ...current, name: event.target.value }))}
        />
        <Input
          label="Email"
          type="email"
          placeholder="you@example.com"
          value={values.email}
          error={errors.email}
          onChange={(event) => setValues((current) => ({ ...current, email: event.target.value }))}
        />
        <Input
          label="Password"
          type="password"
          placeholder="At least 6 characters"
          value={values.password}
          error={errors.password}
          onChange={(event) =>
            setValues((current) => ({ ...current, password: event.target.value }))
          }
        />
        <Button type="submit" className="w-full" isLoading={isSubmitting}>
          Create account
        </Button>
      </form>
      <p className="mt-6 text-sm text-slate-300">
        Already have an account?{" "}
        <Link className="font-semibold text-brand" to="/login">
          Sign in
        </Link>
      </p>
    </AuthLayout>
  );
}
