import { Archive, FileSearch, ShieldCheck } from "lucide-react";
import { Link } from "react-router-dom";
import { RepositoryStructureChart } from "../features/repository/RepositoryStructureChart";

const officeFunctions = [
  {
    title: "Institutional information",
    description:
      "Reports, statistics, plans, and performance records.",
    icon: Archive,
  },
  {
    title: "Resource discovery",
    description:
      "Search by section, category, year, or file type.",
    icon: FileSearch,
  },
  {
    title: "Responsible stewardship",
    description:
      "Authorized staff manage the repository securely.",
    icon: ShieldCheck,
  },
] as const;

export function AboutPage() {
  return (
    <>
      <section className="border-b border-border bg-surface-secondary/45">
        <div className="mx-auto max-w-content px-5 py-8 sm:px-8 sm:py-12 lg:px-10 lg:py-14">
          <nav
            aria-label="Breadcrumb"
            className="text-sm text-muted-foreground"
          >
            <Link className="hover:text-primary hover:underline" to="/">
              Home
            </Link>
            <span className="mx-2" aria-hidden="true">
              /
            </span>
            <span aria-current="page">About</span>
          </nav>
          <div className="mt-6 max-w-3xl border-l-2 border-primary pl-4 sm:pl-5">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">
              About the office
            </p>
            <h1
              id="about-title"
              className="mt-2 font-serif text-3xl tracking-tight sm:text-[2.5rem]"
            >
              About the Information Hub
            </h1>
          </div>
        </div>
      </section>

      <section aria-labelledby="about-title">
        <div className="mx-auto grid max-w-content gap-10 px-5 py-10 sm:px-8 sm:py-14 lg:grid-cols-[minmax(0,1.25fr)_minmax(18rem,0.75fr)] lg:px-10 lg:py-16">
          <div>
            <h2 className="font-serif text-2xl tracking-tight sm:text-3xl">
              One reliable source
            </h2>
            <div className="mt-5 space-y-4 text-base leading-7 text-muted-foreground">
              <p>
                Anyone can browse public resource information. Authorized staff
                manage files and access.
              </p>
            </div>
            <div className="mt-9 grid gap-4 sm:grid-cols-3">
              {officeFunctions.map(({ title, description, icon: Icon }) => (
                <article
                  key={title}
                  className="rounded-2xl border border-border bg-surface p-5 shadow-[0_8px_24px_rgba(20,83,45,0.04)]"
                >
                  <span className="grid size-10 place-items-center rounded-xl bg-primary-soft text-primary">
                    <Icon className="size-5" aria-hidden="true" />
                  </span>
                  <h3 className="mt-4 font-semibold text-foreground">
                    {title}
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    {description}
                  </p>
                </article>
              ))}
            </div>
          </div>
          <aside className="h-fit rounded-2xl border border-primary/20 bg-primary-soft p-6 sm:p-7">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-primary">
              Information Hub
            </p>
            <h2 className="mt-3 text-xl font-semibold tracking-tight">
              Find a resource
            </h2>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              Search the public repository.
            </p>
            <Link
              to="/repository"
              className="mt-6 inline-flex min-h-11 items-center justify-center rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary-hover focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-primary"
            >
              Browse repository
            </Link>
          </aside>
        </div>
      </section>

      <section className="border-t border-border bg-surface-secondary/45" aria-labelledby="repository-structure-title">
        <div className="mx-auto max-w-content px-5 py-10 sm:px-8 sm:py-14 lg:px-10 lg:py-16">
          <div className="max-w-3xl border-l-2 border-primary pl-4 sm:pl-5">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">
              Repository structure
            </p>
            <h2 id="repository-structure-title" className="mt-2 font-serif text-2xl tracking-tight sm:text-3xl">
              Repository sections
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base sm:leading-7">
              Select a section to see its categories.
            </p>
          </div>
          <RepositoryStructureChart />
        </div>
      </section>
    </>
  );
}
