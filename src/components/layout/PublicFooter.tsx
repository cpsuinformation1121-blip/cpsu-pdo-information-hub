import { NavLink } from "react-router-dom";

export function PublicFooter() {
  return (
    <footer className="shrink-0 bg-primary text-primary-foreground">
      <div className="mx-auto grid max-w-content gap-6 px-5 py-8 sm:px-8 md:grid-cols-[1fr_auto] md:items-end lg:px-10">
        <div>
          <p className="text-xs font-bold tracking-[0.14em]">
            CENTRAL PHILIPPINES STATE UNIVERSITY
          </p>
          <p className="mt-2 text-lg">Planning and Development Office</p>
          <p className="mt-1 text-sm text-primary-foreground/75">
            Information Hub
          </p>
        </div>
        <nav
          aria-label="Footer navigation"
          className="flex flex-wrap gap-x-6 gap-y-3 text-sm"
        >
          <NavLink className="hover:underline" to="/repository">
            Repository
          </NavLink>
          <NavLink className="hover:underline" to="/accomplishments">
            Physical Performance
          </NavLink>
          <NavLink className="hover:underline" to="/about">
            About
          </NavLink>
          <NavLink className="hover:underline" to="/contact">
            Contact
          </NavLink>
        </nav>
      </div>
      <div className="border-t border-white/20">
        <div className="mx-auto max-w-content px-5 py-5 text-xs text-primary-foreground/70 sm:px-8 lg:px-10">
          © {new Date().getFullYear()} CPSU Planning and Development Office.
        </div>
      </div>
    </footer>
  );
}
