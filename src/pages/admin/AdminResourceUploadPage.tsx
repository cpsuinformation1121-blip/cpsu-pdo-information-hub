import { ResourceUploadForm } from "../../features/admin/ResourceUploadForm";

export function AdminResourceUploadPage() {
  return (
    <section className="mt-5" aria-labelledby="upload-title">
      <h1
        id="upload-title"
        className="font-serif text-3xl tracking-tight sm:text-4xl"
      >
        Add a resource
      </h1>
      <p className="mt-3 max-w-2xl leading-7 text-muted-foreground">
        Upload a file or publish a secure link in the selected repository location.
      </p>
      <ResourceUploadForm />
    </section>
  );
}
