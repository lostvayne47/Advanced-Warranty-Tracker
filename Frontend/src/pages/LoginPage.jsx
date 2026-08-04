import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { AuthLayout } from "@/components/layout/AuthLayout";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useAuth } from "@/hooks/useAuth";
import { beginGoogleSignIn } from "@/services/authService";
import { validateAuth } from "@/utils/validation";

const initialValues = {
  email: "",
  password: "",
};

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  function handleGoogleSignIn() {
    try {
      beginGoogleSignIn();
    } catch (error) {
      toast.error(error.message);
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const validationErrors = validateAuth(values, "login");
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) {
      return;
    }

    try {
      setIsSubmitting(true);
      await login(values);
      toast.success("Welcome back.");
      navigate(location.state?.from?.pathname || "/dashboard", { replace: true });
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to login right now.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AuthLayout
      title="Sign in to your account"
      subtitle="Use your email and password to access your warranty dashboard."
    >
      <form className="space-y-5" onSubmit={handleSubmit}>
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
          placeholder="Enter your password"
          value={values.password}
          error={errors.password}
          onChange={(event) =>
            setValues((current) => ({ ...current, password: event.target.value }))
          }
        />
        <Button type="submit" className="w-full" isLoading={isSubmitting}>
          Sign in
        </Button>
        <div className="flex items-center gap-3 text-xs text-slate-500">
          <span className="h-px flex-1 bg-white/10" />
          OR
          <span className="h-px flex-1 bg-white/10" />
        </div>
        <Button type="button" variant="secondary" className="w-full" onClick={handleGoogleSignIn}>
          Continue with Google
        </Button>
      </form>
      <p className="mt-6 text-sm text-slate-300">
        Need an account?{" "}
        <Link className="font-semibold text-brand" to="/signup">
          Create one
        </Link>
      </p>
    </AuthLayout>
  );
}
