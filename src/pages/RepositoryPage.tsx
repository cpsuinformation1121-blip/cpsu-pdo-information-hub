import { Link } from "react-router-dom";
import { RepositoryResults } from "../features/repository/RepositoryResults";

export function RepositoryPage() {
  return (
    <section
      className="mx-auto max-w-content px-5 py-6 sm:px-8 sm:py-8 lg:px-10 lg:py-10"
      aria-labelledby="repository-title"
    >
      <nav aria-label="Breadcrumb" className="text-sm text-muted-foreground">
        <Link className="hover:text-primary hover:underline" to="/">
          Home
        </Link>
        <span className="mx-2" aria-hidden="true">
          /
        </span>
        <span aria-current="page">Repository</span>
      </nav>

      <div className="mt-5 max-w-3xl border-l-2 border-primary pl-4 sm:pl-5">
        <h1
          id="repository-title"
          className="font-serif text-3xl tracking-tight sm:text-[2.5rem]"
        >
          Find a resource
        </h1>
      </div>

      <RepositoryResults />
    </section>
  );
}
