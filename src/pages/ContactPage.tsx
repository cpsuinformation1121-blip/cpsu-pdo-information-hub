import { ArrowUpRight, Mail, MessageCircle, Phone, Users } from "lucide-react";
import { Link } from "react-router-dom";

const contactDetails = [
  { label: "Phone", value: "+63917 715 2338", href: "tel:+639177152338", icon: Phone, external: false },
  { label: "Microsoft Teams", value: "Planning Office", href: null, icon: Users, external: false },
  { label: "Facebook", value: "Cpsu Pdo", href: "https://www.facebook.com/cpsu.pdo", icon: MessageCircle, external: true },
  { label: "Email", value: "cpsu_pdo@cpsu.edu.ph", href: "mailto:cpsu_pdo@cpsu.edu.ph", icon: Mail, external: false },
] as const;

const contactCardClassName = "flex h-full min-w-0 flex-col rounded-2xl border border-border bg-surface p-5 shadow-[0_8px_24px_rgba(20,83,45,0.04)] sm:p-6";

export function ContactPage() {
  return (
    <section
      className="mx-auto max-w-content px-5 py-8 sm:px-8 sm:py-12 lg:px-10 lg:py-14"
      aria-labelledby="contact-title"
    >
      <nav aria-label="Breadcrumb" className="text-sm text-muted-foreground">
        <Link className="hover:text-primary hover:underline" to="/">Home</Link>
        <span className="mx-2" aria-hidden="true">/</span>
        <span aria-current="page">Contact</span>
      </nav>
      <div className="mt-6 max-w-3xl border-l-2 border-primary pl-4 sm:pl-5">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">Contact</p>
        <h1 id="contact-title" className="mt-2 font-serif text-3xl tracking-tight sm:text-[2.5rem]">
          Planning and Development Office
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-7 text-muted-foreground">
          Questions about the repository? Contact the office.
        </p>
      </div>
      <ul aria-label="Office contact details" className="mt-9 grid list-none gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {contactDetails.map(({ label, value, href, icon: Icon, external }) => {
          const content = (
            <>
              <div className="flex items-start justify-between gap-3">
                <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-primary-soft text-primary">
                  <Icon className="size-5" aria-hidden="true" />
                </span>
                {href ? <ArrowUpRight className="size-4 text-primary" aria-hidden="true" /> : null}
              </div>
              <span className="mt-5 text-sm text-muted-foreground">{label}</span>
              <span className="mt-1 text-sm font-semibold leading-6 text-foreground [overflow-wrap:anywhere]">{value}</span>
              {external ? <span className="sr-only">Opens in a new tab</span> : null}
            </>
          );

          return (
            <li key={label} className="min-w-0">
              {href ? (
                <a
                  href={href}
                  target={external ? "_blank" : undefined}
                  rel={external ? "noopener noreferrer" : undefined}
                  className={contactCardClassName + " transition-colors hover:border-primary/40 hover:bg-primary-soft/40 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary"}
                >
                  {content}
                </a>
              ) : (
                <div className={contactCardClassName}>{content}</div>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
