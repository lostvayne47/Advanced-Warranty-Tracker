import { Navigate, Route, Routes } from "react-router-dom";
import { AppShell } from "@/components/layout/AppShell";
import { AddWarrantyPage } from "@/pages/AddWarrantyPage";
import { AllItemsPage } from "@/pages/AllItemsPage";
import { DashboardPage } from "@/pages/DashboardPage";
import { ConnectionsPage } from "@/pages/ConnectionsPage";
import { LoginPage } from "@/pages/LoginPage";
import { SignupPage } from "@/pages/SignupPage";
import { ProtectedRoute } from "@/routes/ProtectedRoute";

export function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<AppShell />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/connections" element={<ConnectionsPage />} />
          <Route path="/items" element={<AllItemsPage />} />
          <Route path="/add-warranty" element={<AddWarrantyPage />} />
          <Route path="/warranties/:id/edit" element={<AddWarrantyPage />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
