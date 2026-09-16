import { lazy, Suspense } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { PublicLayout } from "../layouts/PublicLayout";
import { AccomplishmentsPage } from "../pages/AccomplishmentsPage";
import { OpcrPublicPage } from "../pages/OpcrPublicPage";
import { AboutPage } from "../pages/AboutPage";
import { ContactPage } from "../pages/ContactPage";
import { HomePage } from "../pages/HomePage";
import { NotFoundPage } from "../pages/NotFoundPage";
import { RepositoryPage } from "../pages/RepositoryPage";

const AdminRoutes = lazy(() =>
  import("../features/auth/AdminRoutes").then((module) => ({
    default: module.AdminRoutes,
  })),
);

export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<PublicLayout />}>
          <Route index element={<HomePage />} />
          <Route path="repository" element={<RepositoryPage />} />
          <Route path="accomplishments" element={<AccomplishmentsPage />} />
          <Route path="opcr" element={<OpcrPublicPage />} />
          <Route path="about" element={<AboutPage />} />
          <Route path="contact" element={<ContactPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
        <Route
          path="admin/*"
          element={
            <Suspense
              fallback={
                <main className="grid min-h-screen place-items-center bg-background px-5">
                  <p
                    className="text-sm font-medium text-muted-foreground"
                    role="status"
                  >
                    Loading administrator access…
                  </p>
                </main>
              }
            >
              <AdminRoutes />
            </Suspense>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}
