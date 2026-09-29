import {
  FileImage,
  FileText,
  FolderArchive,
  HardDrive,
  Upload,
  Users,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useAdminResourcesQuery } from "../../features/admin/useAdminResourcesQuery";
import { useAdministratorsQuery } from "../../features/admin/useAdministratorsQuery";
import { formatResourceFileType } from "../../utils/formatResourceFileType";

function formatSize(bytes: number) {
  if (bytes < 1_048_576) return `${(bytes / 1_024).toFixed(1)} KB`;
  if (bytes < 1_073_741_824) return `${(bytes / 1_048_576).toFixed(1)} MB`;
  return `${(bytes / 1_073_741_824).toFixed(2)} GB`;
}
export function AdminHomePage() {
  const resources = useAdminResourcesQuery({ limit: 100, sort: "newest" });
  const users = useAdministratorsQuery();
  const data = resources.data?.data ?? [];
  const summary = [
    {
      label: "Total resources",
      value: resources.data?.meta.total ?? "—",
      icon: FolderArchive,
    },
    {
      label: "PDF",
      value: data.filter((item) => item.fileType === "pdf").length,
      icon: FileText,
    },
    {
      label: "Images",
      value: data.filter((item) => item.fileType === "image").length,
      icon: FileImage,
    },
    {
      label: "Storage used",
      value: resources.isSuccess
        ? formatSize(data.reduce((total, item) => total + item.fileSize, 0))
        : "—",
      icon: HardDrive,
    },
  ];
  return (
    <section className="mt-6 sm:mt-10" aria-labelledby="admin-home-title">
      <div className="flex flex-wrap items-end justify-between gap-5">
        <div>
          <h1
            id="admin-home-title"
            className="font-serif text-3xl tracking-tight sm:text-5xl"
          >
            Repository overview
          </h1>
          <p className="mt-3 text-muted-foreground">
            Manage files, structure, and staff.
          </p>
        </div>
        <Link
          to="/admin/resources/upload"
          className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground shadow-[0_10px_24px_rgba(20,83,45,0.16)] min-[24rem]:w-auto"
        >
          <Upload className="size-4" />
          Upload file
        </Link>
      </div>
      <div className="mt-6 grid grid-cols-2 gap-3 sm:mt-8 xl:grid-cols-4">
        {summary.map(({ label, value, icon: Icon }) => (
          <div
            key={label}
            className="rounded-2xl border border-border bg-surface p-4 shadow-[0_10px_28px_rgba(20,83,45,0.05)] sm:p-5"
          >
            <Icon className="size-6 text-primary" />
            <p className="mt-4 font-serif text-2xl sm:mt-5 sm:text-3xl">{value}</p>
            <p className="mt-1 text-sm text-muted-foreground">{label}</p>
          </div>
        ))}
      </div>
      <div className="mt-8 grid gap-6 xl:grid-cols-[1.5fr_0.8fr]">
        <section className="overflow-hidden rounded-2xl border border-border bg-surface shadow-[0_12px_32px_rgba(20,83,45,0.06)]">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-strong-border p-4 sm:p-5">
            <h2 className="font-serif text-2xl">Recent uploads</h2>
            <Link
              to="/admin/resources"
              className="text-sm font-semibold text-primary underline"
            >
              Manage all
            </Link>
          </div>
          <ul className="divide-y divide-border">
            {data.slice(0, 5).map((resource) => (
              <li key={resource.key} className="p-5">
                <p className="break-all text-sm font-semibold">
                  {resource.filename}
                </p>
                <p className="mt-2 text-xs text-muted-foreground">
                  {resource.year} · {formatResourceFileType(resource.fileType)}
                </p>
              </li>
            ))}
          </ul>
          {resources.isSuccess && !data.length ? (
            <p className="p-6 text-muted-foreground">
              No resources yet.
            </p>
          ) : null}
        </section>
        <section className="rounded-2xl border border-border bg-surface p-6 shadow-[0_12px_32px_rgba(20,83,45,0.06)]">
          <Users className="size-7 text-primary" />
          <p className="mt-6 font-serif text-4xl">
            {users.data?.data.length ?? "—"}
          </p>
          <h2 className="mt-2 font-serif text-2xl">Staff access</h2>
          <p className="mt-3 leading-7 text-muted-foreground">
            Authorized repository managers.
          </p>
          <Link
            to="/admin/users"
            className="mt-6 inline-flex min-h-11 items-center border border-primary px-4 text-sm font-semibold text-primary"
          >
            Manage staff
          </Link>
        </section>
      </div>
    </section>
  );
}
