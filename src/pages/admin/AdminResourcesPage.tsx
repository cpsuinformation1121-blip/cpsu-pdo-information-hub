import { AdminResourceInventory } from "../../features/admin/AdminResourceInventory";

export function AdminResourcesPage() {
  return (
    <section className="mt-5" aria-labelledby="admin-resources-title">
      <h1
        id="admin-resources-title"
        className="font-serif text-3xl tracking-tight sm:text-4xl"
      >
        Manage files
      </h1>
      <p className="mt-3 max-w-2xl text-base leading-7 text-muted-foreground">
        Search, preview, edit, or delete resources.
      </p>
      <AdminResourceInventory />
    </section>
  );
}
