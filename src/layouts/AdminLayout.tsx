import { LogOut } from "lucide-react";
import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import cpsuLogo from "../assets/CPSU_Logo-transparent.png";
import { useAuth } from "../features/auth/useAuth";

export function AdminLayout() {
  const { signOut, user } = useAuth();
  const navigate = useNavigate();
  async function handleSignOut() {
    await signOut();
    navigate("/admin/login", { replace: true });
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <a className="skip-link" href="#admin-main-content">
        Skip to main content
      </a>
      <div className="sticky top-0 z-50 bg-surface shadow-[0_8px_28px_rgba(20,83,45,0.06)]">
        <header className="border-b border-border bg-surface">
          <div className="mx-auto flex min-h-16 max-w-content items-center justify-between gap-3 px-4 py-2 sm:min-h-[4.5rem] sm:px-8 lg:px-10">
            <Link
              to="/admin"
              className="flex min-w-0 flex-1 items-center gap-2.5 overflow-hidden focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary sm:gap-3"
            >
              <img
                src={cpsuLogo}
                alt=""
                className="size-10 shrink-0 object-contain sm:size-11"
                width="500"
                height="500"
              />
              <span className="min-w-0 overflow-hidden">
                <span className="block truncate text-[0.56rem] font-bold tracking-[0.08em] text-primary min-[23rem]:text-[0.62rem] sm:text-xs sm:tracking-[0.12em]">
                  CPSU PLANNING AND DEVELOPMENT OFFICE
                </span>
                <span className="mt-0.5 block truncate text-[0.68rem] text-muted-foreground sm:text-sm">
                  Admin
                </span>
              </span>
            </Link>
            <button
              type="button"
              onClick={handleSignOut}
              className="inline-flex size-11 shrink-0 cursor-pointer items-center justify-center gap-2 rounded-xl border border-border bg-primary-soft text-sm font-semibold text-primary hover:bg-primary hover:text-primary-foreground focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-primary sm:w-auto sm:px-4"
            >
              <LogOut className="size-4" aria-hidden="true" />
              <span className="hidden sm:inline">Sign out</span>
            </button>
          </div>
        </header>
        <nav
          aria-label="Repository management navigation"
          className="border-b border-border bg-surface"
        >
          <div className="mx-auto flex max-w-content snap-x gap-5 overflow-x-auto scroll-smooth px-4 sm:gap-6 sm:px-8 lg:px-10">
            {[
              ["/admin", "Overview"],
              ["/admin/resources", "Resources"],
              ["/admin/resources/upload", "Upload"],
              ["/admin/accomplish-resource", "Physical Performance"],
              ["/admin/opcr", "OPCR"],
              ["/admin/structure", "Structure"],
              ["/admin/users", "Staff"],
            ].map(([to, label]) => (
              <NavLink
                key={to}
                end
                to={to}
                className={({ isActive }) =>
                  `flex min-h-12 shrink-0 snap-start cursor-pointer items-center border-b-2 text-sm font-semibold ${isActive ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-primary"}`
                }
              >
                {label}
              </NavLink>
            ))}
          </div>
        </nav>
      </div>
      <main
        id="admin-main-content"
        className="mx-auto max-w-content px-4 py-5 sm:px-8 sm:py-6 lg:px-10 lg:py-8"
      >
        <div className="rounded-2xl border border-primary/15 bg-primary-soft px-4 py-3 shadow-[0_8px_22px_rgba(20,83,45,0.04)]">
          <p className="text-xs font-bold tracking-[0.14em] text-primary">
            SIGNED IN
          </p>
          <p className="mt-1 break-all text-sm text-muted-foreground">
            {user?.email}
          </p>
        </div>
        <Outlet />
      </main>
    </div>
  );
}
