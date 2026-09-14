import { Outlet } from "react-router-dom";
import { PublicFooter } from "../components/layout/PublicFooter";
import { PublicHeader } from "../components/layout/PublicHeader";

export function PublicLayout() {
  return (
    <div className="flex min-h-dvh flex-col bg-background text-foreground">
      <a className="skip-link" href="#main-content">
        Skip to main content
      </a>
      <PublicHeader />
      <main id="main-content" className="min-w-0 flex-1">
        <Outlet />
      </main>
      <PublicFooter />
    </div>
  );
}
