import {
  ChevronLeft,
  ChevronRight,
  FileSearch,
  RefreshCw,
  Search,
} from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useDeferredValue, useMemo, useState } from "react";
import {
  repositoryCategoryById,
  repositorySections,
} from "../../config/repository";
import type {
  AdminResource,
  ResourceFileType,
  ResourceQuery,
  ResourceSort,
} from "../../contracts/resource";
import type { AdminResourceAccessMode } from "../../contracts/adminResourceAccess";
import { useAdminResourcesQuery } from "./useAdminResourcesQuery";
import { deleteResource, renameResource } from "../../services/adminOperations";
import { authorizeAdminResourceAccess } from "../../services/adminResourceAccess";
import { useAuth } from "../auth/useAuth";
import { formatResourceFileType } from "../../utils/formatResourceFileType";
import {
  formatResourceDate,
  formatResourceFileSize,
} from "../../utils/formatResourceMetadata";
import { AdminResourceActions } from "./AdminResourceActions";
import {
  AdminResourceDeleteDialog,
  AdminResourcePreviewDialog,
  AdminResourceRenameDialog,
  type DeleteTarget,
  type PreviewTarget,
  type RenameTarget,
} from "./AdminResourceDialogs";

const fileTypeOptions: readonly {
  value: ResourceFileType | "";
  label: string;
}[] = [
  { value: "", label: "All file types" },
  { value: "pdf", label: "PDF documents" },
  { value: "image", label: "Images" },
  { value: "link", label: "Links" },
];

const sortOptions: readonly { value: ResourceSort; label: string }[] = [
  { value: "newest", label: "Newest first" },
  { value: "oldest", label: "Oldest first" },
  { value: "name-asc", label: "Name A–Z" },
  { value: "name-desc", label: "Name Z–A" },
  { value: "file-size", label: "Largest first" },
  { value: "file-type", label: "File type" },
];

type PageState = { cursor?: string; history: (string | undefined)[] };

export function AdminResourceInventory() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search);
  const [section, setSection] = useState<ResourceQuery["section"]>();
  const [fileType, setFileType] = useState<ResourceFileType>();
  const [sort, setSort] = useState<ResourceSort>("newest");
  const [page, setPage] = useState<PageState>({ history: [] });
  const [renameTarget, setRenameTarget] = useState<RenameTarget | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null);
  const [previewTarget, setPreviewTarget] = useState<PreviewTarget | null>(
    null,
  );
  const query = useMemo<Partial<ResourceQuery>>(
    () => ({
      q: deferredSearch || undefined,
      section,
      fileType,
      sort,
      cursor: page.cursor,
      limit: 25,
    }),
    [deferredSearch, fileType, page.cursor, section, sort],
  );
  const resourcesQuery = useAdminResourcesQuery(query);
  const refreshResources = () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: ["admin-resources"] }),
      queryClient.invalidateQueries({ queryKey: ["resources"] }),
    ]);
  const renameMutation = useMutation({
    mutationFn: ({ key, filename }: { key: string; filename: string }) => {
      if (!user) throw new Error("Please sign in to rename a file.");
      return renameResource(user, key, filename);
    },
    onSuccess: async () => {
      setRenameTarget(null);
      await refreshResources();
    },
  });
  const deleteMutation = useMutation({
    mutationFn: ({
      key,
      confirmation,
    }: {
      key: string;
      confirmation: string;
    }) => {
      if (!user) throw new Error("Please sign in to delete a file.");
      return deleteResource(user, key, confirmation);
    },
    onSuccess: async () => {
      setDeleteTarget(null);
      await refreshResources();
    },
  });
  const accessMutation = useMutation({
    mutationFn: ({
      resource,
      mode,
    }: {
      resource: AdminResource;
      mode: AdminResourceAccessMode;
    }) => {
      if (!user) throw new Error("Please sign in to access this file.");
      return authorizeAdminResourceAccess(user, resource.key, mode);
    },
    onSuccess: (access, request) => {
      if (request.mode === "preview") {
        setPreviewTarget({ resource: request.resource, url: access.url });
        return;
      }

      const link = document.createElement("a");
      link.href = access.url;
      link.download = request.resource.filename;
      link.rel = "noopener noreferrer";
      document.body.append(link);
      link.click();
      link.remove();
    },
  });

  function resetPage() {
    setPage({ history: [] });
  }

  function requestAccess(
    resource: AdminResource,
    mode: AdminResourceAccessMode,
  ) {
    accessMutation.reset();
    accessMutation.mutate({ resource, mode });
  }

  function openRename(resource: AdminResource) {
    const editableName =
      resource.fileType === "link" ? resource.displayName : resource.filename;
    setRenameTarget({
      key: resource.key,
      original: editableName,
      value: editableName,
      isLink: resource.fileType === "link",
    });
  }

  function openDelete(resource: AdminResource) {
    setDeleteTarget({ key: resource.key, filename: resource.filename });
  }

  return (
    <div className="mt-6">
      <div className="grid grid-cols-2 gap-4 rounded-2xl border border-border bg-surface-secondary px-4 py-5 shadow-[0_10px_28px_rgba(20,83,45,0.05)] md:grid-cols-2 md:px-5 xl:grid-cols-[minmax(16rem,1.5fr)_repeat(3,minmax(10rem,0.7fr))]">
        <label className="relative col-span-2 block xl:col-span-1">
          <span className="block text-xs font-bold tracking-[0.1em] text-muted-foreground">
            SEARCH
          </span>
          <Search
            className="pointer-events-none absolute bottom-3.5 left-3 size-4 text-muted-foreground"
            aria-hidden="true"
          />
          <input
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              resetPage();
            }}
            type="search"
            placeholder="Resource, category, or year"
            className="mt-2 min-h-11 w-full border border-strong-border bg-surface pl-10 pr-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </label>
        <label className="col-span-2 md:col-span-1">
          <span className="block text-xs font-bold tracking-[0.1em] text-muted-foreground">
            SECTION
          </span>
          <select
            value={section ?? ""}
            onChange={(event) => {
              setSection(
                (event.target.value || undefined) as ResourceQuery["section"],
              );
              resetPage();
            }}
            className="mt-2 min-h-11 w-full cursor-pointer border border-strong-border bg-surface px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          >
            <option value="">All sections</option>
            {repositorySections.map((item) => (
              <option key={item.id} value={item.id}>
                {item.title}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span className="block text-xs font-bold tracking-[0.1em] text-muted-foreground">
            FILE TYPE
          </span>
          <select
            value={fileType ?? ""}
            onChange={(event) => {
              setFileType(
                (event.target.value || undefined) as
                  ResourceFileType | undefined,
              );
              resetPage();
            }}
            className="mt-2 min-h-11 w-full cursor-pointer border border-strong-border bg-surface px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          >
            {fileTypeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span className="block text-xs font-bold tracking-[0.1em] text-muted-foreground">
            SORT
          </span>
          <select
            value={sort}
            onChange={(event) => {
              setSort(event.target.value as ResourceSort);
              resetPage();
            }}
            className="mt-2 min-h-11 w-full cursor-pointer border border-strong-border bg-surface px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          >
            {sortOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      {resourcesQuery.isPending ? (
        <div
          className="border-b border-border bg-surface px-6 py-16 text-center"
          role="status"
        >
          <RefreshCw
            className="mx-auto size-7 animate-spin text-primary motion-reduce:animate-none"
            aria-hidden="true"
          />
          <p className="mt-4 font-medium">Loading files…</p>
        </div>
      ) : null}
      {resourcesQuery.isError ? (
        <div
          className="border-b border-border bg-surface px-6 py-14 text-center"
          role="alert"
        >
          <h2 className="text-xl font-semibold">
            Files unavailable
          </h2>
          <p className="mx-auto mt-3 max-w-xl leading-7 text-muted-foreground">
            Check your connection and try again.
          </p>
          <button
            type="button"
            onClick={() => resourcesQuery.refetch()}
            className="mt-6 inline-flex min-h-11 cursor-pointer items-center gap-2 border border-primary px-5 text-sm font-semibold text-primary hover:bg-primary-soft focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            <RefreshCw className="size-4" aria-hidden="true" />
            Try again
          </button>
        </div>
      ) : null}
      {resourcesQuery.isSuccess && resourcesQuery.data.data.length === 0 ? (
        <div className="border-b border-border bg-surface px-6 py-14 text-center">
          <FileSearch
            className="mx-auto size-8 text-primary"
            strokeWidth={1.5}
            aria-hidden="true"
          />
          <h2 className="mt-5 text-xl font-semibold">No results</h2>
          <p className="mx-auto mt-3 max-w-xl leading-7 text-muted-foreground">
            Change your search or filters.
          </p>
        </div>
      ) : null}
      {resourcesQuery.isSuccess && resourcesQuery.data.data.length > 0 ? (
        <>
          <div className="flex flex-col gap-2 border-b border-border py-4 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
            <p>{resourcesQuery.data.meta.total} results</p>
            <p>25 per page</p>
          </div>
          <ul className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-surface shadow-[0_10px_28px_rgba(20,83,45,0.05)] md:hidden">
            {resourcesQuery.data.data.map((resource) => (
              <li key={resource.key} className="p-4">
                <p className="break-words text-sm font-semibold leading-6 [overflow-wrap:anywhere]">
                  {resource.fileType === "link"
                    ? resource.displayName
                    : resource.filename}
                </p>
                <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
                  <div className="col-span-2">
                    <dt className="text-xs font-bold tracking-wide text-muted-foreground">
                      LOCATION
                    </dt>
                    <dd className="mt-1">
                      {repositorySections.find(
                        (item) => item.id === resource.sectionId,
                      )?.title ?? resource.sectionId}
                      <span className="block text-xs text-muted-foreground">
                        {resource.categoryId
                          ? (repositoryCategoryById.get(resource.categoryId)
                              ?.title ?? resource.categoryId)
                          : "No category"}
                      </span>
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs font-bold tracking-wide text-muted-foreground">
                      SCHOOL YEAR
                    </dt>
                    <dd className="mt-1">{resource.year}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-bold tracking-wide text-muted-foreground">
                      FILE
                    </dt>
                    <dd className="mt-1">
                      {formatResourceFileType(resource.fileType)}
                      <span className="block text-xs text-muted-foreground">
                        {formatResourceFileSize(resource.fileSize)}
                      </span>
                    </dd>
                  </div>
                  <div className="col-span-2">
                    <dt className="text-xs font-bold tracking-wide text-muted-foreground">
                      UPDATED
                    </dt>
                    <dd className="mt-1">
                      {formatResourceDate(resource.uploadedAt)}
                    </dd>
                  </div>
                </dl>
                <div className="mt-4 border-t border-border pt-4">
                  <AdminResourceActions
                    resource={resource}
                    accessDisabled={accessMutation.isPending}
                    accessPendingMode={
                      accessMutation.isPending &&
                      accessMutation.variables?.resource.key === resource.key
                        ? accessMutation.variables.mode
                        : undefined
                    }
                    accessError={
                      accessMutation.isError &&
                      accessMutation.variables?.resource.key === resource.key
                        ? accessMutation.error instanceof Error
                          ? accessMutation.error.message
                          : "The file could not be accessed."
                        : undefined
                    }
                    onAccess={requestAccess}
                    onRename={openRename}
                    onDelete={openDelete}
                  />
                </div>
              </li>
            ))}
          </ul>
          <div className="hidden overflow-x-auto rounded-2xl border border-border bg-surface shadow-[0_10px_28px_rgba(20,83,45,0.05)] md:block">
            <table className="w-full min-w-[80rem] border-collapse text-left">
              <colgroup>
                <col />
                <col />
                <col className="w-32" />
                <col className="w-24" />
                <col className="w-28" />
                <col className="w-40" />
                <col className="w-72" />
              </colgroup>
              <thead>
                <tr className="border-b border-strong-border text-xs font-bold tracking-[0.1em] text-muted-foreground">
                  <th className="px-5 py-4">FILE NAME</th>
                  <th className="px-5 py-4">LOCATION</th>
                  <th className="whitespace-nowrap px-5 py-4">YEAR</th>
                  <th className="whitespace-nowrap px-5 py-4">TYPE</th>
                  <th className="whitespace-nowrap px-5 py-4">SIZE</th>
                  <th className="whitespace-nowrap px-5 py-4">UPDATED</th>
                  <th className="whitespace-nowrap px-5 py-4">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {resourcesQuery.data.data.map((resource) => (
                  <tr
                    key={resource.key}
                    className="align-top hover:bg-primary-soft"
                  >
                    <td className="px-5 py-5">
                      <p className="break-all font-semibold">
                        {resource.fileType === "link"
                    ? resource.displayName
                    : resource.filename}
                      </p>
                    </td>
                    <td className="px-5 py-5 text-sm">
                      <p>
                        {repositorySections.find(
                          (item) => item.id === resource.sectionId,
                        )?.title ?? resource.sectionId}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {resource.categoryId
                          ? (repositoryCategoryById.get(resource.categoryId)
                              ?.title ?? resource.categoryId)
                          : "No category"}
                      </p>
                    </td>
                    <td className="whitespace-nowrap px-5 py-5 text-sm">
                      {resource.year}
                    </td>
                    <td className="whitespace-nowrap px-5 py-5 text-sm uppercase">
                      {formatResourceFileType(resource.fileType)}
                    </td>
                    <td className="whitespace-nowrap px-5 py-5 text-sm">
                      {formatResourceFileSize(resource.fileSize)}
                    </td>
                    <td className="whitespace-nowrap px-5 py-5 text-sm">
                      {formatResourceDate(resource.uploadedAt)}
                    </td>
                    <td className="whitespace-nowrap px-5 py-5">
                      <AdminResourceActions
                        resource={resource}
                        accessDisabled={accessMutation.isPending}
                        accessPendingMode={
                          accessMutation.isPending &&
                          accessMutation.variables?.resource.key ===
                            resource.key
                            ? accessMutation.variables.mode
                            : undefined
                        }
                        accessError={
                          accessMutation.isError &&
                          accessMutation.variables?.resource.key ===
                            resource.key
                            ? accessMutation.error instanceof Error
                              ? accessMutation.error.message
                              : "The file could not be accessed."
                            : undefined
                        }
                        onAccess={requestAccess}
                        onRename={openRename}
                        onDelete={openDelete}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <nav
            aria-label="Resource inventory pages"
            className="grid grid-cols-2 gap-3 pt-6 sm:flex sm:items-center sm:justify-between sm:gap-4"
          >
            <button
              type="button"
              disabled={page.history.length === 0}
              onClick={() =>
                setPage((current) => ({
                  cursor: current.history.at(-1),
                  history: current.history.slice(0, -1),
                }))
              }
              className="inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 border border-strong-border px-3 text-sm font-semibold text-primary hover:bg-primary-soft disabled:cursor-not-allowed disabled:opacity-45 sm:px-4"
            >
              <ChevronLeft className="size-4" aria-hidden="true" />
              Previous
            </button>
            <button
              type="button"
              disabled={!resourcesQuery.data.meta.nextCursor}
              onClick={() =>
                setPage((current) => ({
                  cursor: resourcesQuery.data.meta.nextCursor ?? undefined,
                  history: [...current.history, current.cursor],
                }))
              }
              className="inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 border border-primary px-3 text-sm font-semibold text-primary hover:bg-primary-soft disabled:cursor-not-allowed disabled:opacity-45 sm:px-4"
            >
              Next
              <ChevronRight className="size-4" aria-hidden="true" />
            </button>
          </nav>
        </>
      ) : null}
      {previewTarget ? (
        <AdminResourcePreviewDialog
          target={previewTarget}
          onClose={() => setPreviewTarget(null)}
        />
      ) : null}
      {renameTarget ? (
        <AdminResourceRenameDialog
          target={renameTarget}
          error={
            renameMutation.isError
              ? renameMutation.error instanceof Error
                ? renameMutation.error.message
                : "The resource could not be renamed."
              : undefined
          }
          isPending={renameMutation.isPending}
          onChange={(value) => setRenameTarget({ ...renameTarget, value })}
          onClose={() => setRenameTarget(null)}
          onSubmit={() =>
            renameMutation.mutate({
              key: renameTarget.key,
              filename: renameTarget.isLink
                ? `${renameTarget.value}.link`
                : renameTarget.value,
            })
          }
        />
      ) : null}
      {deleteTarget ? (
        <AdminResourceDeleteDialog
          target={deleteTarget}
          error={
            deleteMutation.isError
              ? deleteMutation.error instanceof Error
                ? deleteMutation.error.message
                : "The resource could not be deleted."
              : undefined
          }
          isPending={deleteMutation.isPending}
          onClose={() => setDeleteTarget(null)}
          onConfirm={() =>
            deleteMutation.mutate({
              key: deleteTarget.key,
              confirmation: deleteTarget.filename,
            })
          }
        />
      ) : null}
    </div>
  );
}
