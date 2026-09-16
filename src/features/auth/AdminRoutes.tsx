import { Route, Routes } from "react-router-dom";
import { AdminLayout } from "../../layouts/AdminLayout";
import { AdminHomePage } from "../../pages/admin/AdminHomePage";
import { AdminAccomplishResourcePage } from "../../pages/admin/AdminAccomplishResourcePage";
import { AdminOpcrPage } from "../../pages/admin/AdminOpcrPage";
import { AdminLoginPage } from "../../pages/admin/AdminLoginPage";
import { AdminResourcesPage } from "../../pages/admin/AdminResourcesPage";
import { AdminResourceUploadPage } from "../../pages/admin/AdminResourceUploadPage";
import { AdminUsersPage } from "../../pages/admin/AdminUsersPage";
import { AdminRepositoryStructurePage } from "../../pages/admin/AdminRepositoryStructurePage";
import { NotFoundPage } from "../../pages/NotFoundPage";
import { AuthProvider } from "./AuthContext";
import { ProtectedAdminRoute } from "./ProtectedAdminRoute";

export function AdminRoutes() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="login" element={<AdminLoginPage />} />
        <Route element={<ProtectedAdminRoute />}>
          <Route element={<AdminLayout />}>
            <Route index element={<AdminHomePage />} />
            <Route path="resources" element={<AdminResourcesPage />} />
            <Route
              path="resources/upload"
              element={<AdminResourceUploadPage />}
            />
            <Route
              path="accomplish-resource"
              element={<AdminAccomplishResourcePage />}
            />
            <Route path="opcr" element={<AdminOpcrPage />} />
            <Route
              path="structure"
              element={<AdminRepositoryStructurePage />}
            />
            <Route path="users" element={<AdminUsersPage />} />
          </Route>
        </Route>
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </AuthProvider>
  );
}
