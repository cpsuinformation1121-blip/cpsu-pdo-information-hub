import { useEffect, useRef, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { policyUpdatedAt, websitePolicyLinks } from "../../config/websitePolicies";
export function PolicyPageLayout({ title, description, children }: { title: string; description: string; children: ReactNode }) {
  const headingRef = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    const previousTitle = document.title;
    document.title = title + " | CPSU Information Hub";
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    headingRef.current?.focus({ preventScroll: true });
    return () => { document.title = previousTitle; };
  }, [title]);
  return <article className="mx-auto max-w-content px-5 py-8 sm:px-8 sm:py-12 lg:px-10">
    <nav aria-label="Breadcrumb" className="text-sm text-muted-foreground">
      <Link to="/" className="hover:text-primary hover:underline focus-visible:outline-2 focus-visible:outline-primary">Home</Link>
      <span className="mx-2" aria-hidden="true">/</span><span aria-current="page">{title}</span>
    </nav>
    <header className="mt-6 max-w-3xl border-l-2 border-primary pl-4 sm:pl-5">
      <h1 ref={headingRef} tabIndex={-1} className="font-serif text-3xl tracking-tight sm:text-[2.5rem]">{title}</h1>
      <p className="mt-4 text-base leading-7 text-muted-foreground">{description}</p>
      <p className="mt-3 text-xs text-muted-foreground">Last updated: <time dateTime={policyUpdatedAt}>2 October 2026</time></p>
    </header>
    <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_16rem]">
      <div className="min-w-0 space-y-8 rounded-2xl border border-border bg-surface p-5 text-sm leading-7 text-muted-foreground [overflow-wrap:anywhere] [&_h2]:mb-3 [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:text-foreground [&_p+p]:mt-3 [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-5 [&_a]:font-medium [&_a]:text-primary [&_a]:underline [&_a]:underline-offset-4 [&_a]:focus-visible:outline-2 [&_a]:focus-visible:outline-primary sm:p-8">{children}</div>
      <aside className="self-start rounded-2xl border border-primary/15 bg-primary-soft p-5">
        <h2 className="text-sm font-semibold">Website information</h2>
        <nav aria-label="Policy navigation" className="mt-3 flex flex-col items-start gap-3 text-sm">
          {websitePolicyLinks.map(link => <Link key={link.path} to={link.path} className="leading-6 text-primary hover:underline focus-visible:outline-2 focus-visible:outline-primary">{link.label}</Link>)}
          <Link to="/contact" className="leading-6 text-primary hover:underline focus-visible:outline-2 focus-visible:outline-primary">Contact the office</Link>
        </nav>
      </aside>
    </div>
  </article>;
}
