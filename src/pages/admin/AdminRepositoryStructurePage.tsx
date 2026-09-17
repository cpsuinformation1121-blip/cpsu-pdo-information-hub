import { useMutation, useQueryClient } from "@tanstack/react-query";
import { FolderPlus, Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { AppDialog } from "../../components/ui/AppDialog";
import { useAuth } from "../../features/auth/useAuth";
import { useRepositoryStructureQuery } from "../../features/repository/useRepositoryStructureQuery";
import { mutateRepositoryStructure } from "../../services/repositoryStructure";
import { protectedRepositorySectionIds } from "../../config/repository";

type EditorState =
  | { kind: "add-category"; sectionId: string; value: string }
  | {
      kind: "rename-section" | "rename-category";
      sectionId: string;
      id: string;
      value: string;
    };
type DeleteState = {
  kind: "section" | "category";
  sectionId: string;
  id: string;
  title: string;
};

export function AdminRepositoryStructurePage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const structure = useRepositoryStructureQuery();
  const [sectionTitle, setSectionTitle] = useState("");
  const [editor, setEditor] = useState<EditorState | null>(null);
  const [pendingDelete, setPendingDelete] = useState<DeleteState | null>(null);
  const mutation = useMutation({
    mutationFn: (body: unknown) => {
      if (!user) throw new Error("Please sign in to make changes.");
      return mutateRepositoryStructure(user, body);
    },
    onSuccess: async () => {
      setSectionTitle("");
      setEditor(null);
      setPendingDelete(null);
      await queryClient.invalidateQueries({
        queryKey: ["repository-structure"],
      });
    },
  });
  function submitEditor() {
    if (!editor?.value.trim()) return;
    if (editor.kind === "add-category")
      mutation.mutate({
        action: "add-category",
        sectionId: editor.sectionId,
        title: editor.value.trim(),
      });
    else if (editor.kind === "rename-section")
      mutation.mutate({
        action: "rename-section",
        id: editor.id,
        title: editor.value.trim(),
      });
    else
      mutation.mutate({
        action: "rename-category",
        sectionId: editor.sectionId,
        id: editor.id,
        title: editor.value.trim(),
      });
  }
  return (
    <section className="mt-5" aria-labelledby="structure-title">
      <p className="text-xs font-bold tracking-[0.14em] text-primary">
        REPOSITORY ORGANIZATION
      </p>
      <h1
        id="structure-title"
        className="mt-2 font-serif text-3xl tracking-tight sm:text-4xl"
      >
        Repository structure
      </h1>
      <p className="mt-3 max-w-3xl leading-7 text-muted-foreground">
        Add, rename, or remove sections and categories.
      </p>
      <form
        className="mt-6 flex flex-col gap-3 rounded-2xl border border-border bg-surface p-4 shadow-[0_10px_28px_rgba(20,83,45,0.05)] sm:flex-row sm:p-5"
        onSubmit={(event) => {
          event.preventDefault();
          if (sectionTitle.trim())
            mutation.mutate({
              action: "add-section",
              title: sectionTitle.trim(),
            });
        }}
      >
        <label className="flex-1">
          <span className="text-sm font-semibold">New section</span>
          <input
            value={sectionTitle}
            onChange={(event) => setSectionTitle(event.target.value)}
            required
            minLength={2}
            maxLength={100}
            placeholder="Example: Institutional Reports"
            className="mt-2 min-h-12 w-full border border-strong-border px-4"
          />
        </label>
        <button
          disabled={mutation.isPending}
          className="mt-auto inline-flex min-h-12 cursor-pointer items-center justify-center gap-2 bg-primary px-5 font-semibold text-primary-foreground disabled:cursor-not-allowed disabled:opacity-50"
        >
          <FolderPlus className="size-4" />
          Add section
        </button>
      </form>
      {mutation.isError ? (
        <p
          className="mt-4 border-l-2 border-danger bg-danger-soft px-4 py-3 text-sm text-danger"
          role="alert"
        >
          {mutation.error instanceof Error
            ? mutation.error.message
            : "The change could not be saved."}
        </p>
      ) : null}
      {structure.isPending ? (
        <p className="mt-8 text-muted-foreground">
          Loading repository structure...
        </p>
      ) : null}
      <div className="mt-6 space-y-5">
        {structure.data?.map((section) => (
          <article
            key={section.id}
            className="overflow-hidden rounded-2xl border border-border bg-surface shadow-[0_10px_28px_rgba(20,83,45,0.05)]"
          >
            <header className="flex flex-col items-start justify-between gap-4 border-b border-strong-border px-4 py-4 min-[28rem]:flex-row min-[28rem]:items-center sm:px-5">
              <div>
                <h2 className="font-serif text-2xl">{section.title}</h2>
                <p className="mt-1 text-xs text-muted-foreground">
                  {section.categories.length}{" "}
                  {section.categories.length === 1 ? "category" : "categories"}
                </p>
              </div>
              <div className="flex w-full flex-wrap gap-2 min-[28rem]:w-auto">
                <button
                  type="button"
                  onClick={() =>
                    setEditor({
                      kind: "add-category",
                      sectionId: section.id,
                      value: "",
                    })
                  }
                  className="inline-flex min-h-10 cursor-pointer items-center text-sm font-semibold text-primary"
                >
                  <Plus className="mr-1 inline size-4" />
                  Add category
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setEditor({
                      kind: "rename-section",
                      sectionId: section.id,
                      id: section.id,
                      value: section.title,
                    })
                  }
                  className="inline-flex min-h-10 cursor-pointer items-center text-sm font-semibold text-primary"
                >
                  <Pencil className="mr-1 inline size-4" />
                  Edit
                </button>
                {!protectedRepositorySectionIds.has(section.id) ? (
                  <button
                    type="button"
                    onClick={() =>
                      setPendingDelete({
                        kind: "section",
                        sectionId: section.id,
                        id: section.id,
                        title: section.title,
                      })
                    }
                    className="inline-flex min-h-10 cursor-pointer items-center text-sm font-semibold text-danger"
                  >
                    <Trash2 className="mr-1 inline size-4" />
                    Delete
                  </button>
                ) : null}
              </div>
            </header>
            {section.categories.length ? (
              <ul className="divide-y divide-border">
                {section.categories.map((category) => (
                  <li
                    key={category.id}
                    className="flex flex-col items-start justify-between gap-2 px-4 py-4 min-[28rem]:flex-row min-[28rem]:items-center sm:px-5"
                  >
                    <span className="font-medium">{category.title}</span>
                    <span className="flex gap-3">
                      <button
                        type="button"
                        onClick={() =>
                          setEditor({
                            kind: "rename-category",
                            sectionId: section.id,
                            id: category.id,
                            value: category.title,
                          })
                        }
                        className="inline-flex min-h-10 cursor-pointer items-center text-sm font-semibold text-primary"
                      >
                        <Pencil className="mr-1 inline size-4" />
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setPendingDelete({
                            kind: "category",
                            sectionId: section.id,
                            id: category.id,
                            title: category.title,
                          })
                        }
                        className="inline-flex min-h-10 cursor-pointer items-center text-sm font-semibold text-danger"
                      >
                        <Trash2 className="mr-1 inline size-4" />
                        Delete
                      </button>
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="px-5 py-5 text-sm text-muted-foreground">
                No categories.
              </p>
            )}
          </article>
        ))}
      </div>
      {editor ? (
        <AppDialog
          title={
            editor.kind === "add-category"
              ? "Add category"
              : `Edit ${editor.kind === "rename-section" ? "section" : "category"}`
          }
        description="Enter a clear name."
          onClose={() => setEditor(null)}
        >
          <form
            onSubmit={(event) => {
              event.preventDefault();
              submitEditor();
            }}
            className="p-5 sm:p-6"
          >
            <label className="text-sm font-semibold">
              Name
              <input
                autoFocus
                required
                minLength={2}
                maxLength={100}
                value={editor.value}
                onChange={(event) =>
                  setEditor({ ...editor, value: event.target.value })
                }
                className="mt-2 min-h-12 w-full border border-strong-border px-4 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </label>
            <div className="mt-6 grid gap-3 min-[24rem]:flex min-[24rem]:justify-end">
              <button
                type="button"
                onClick={() => setEditor(null)}
                className="min-h-11 cursor-pointer border border-strong-border px-5 font-semibold"
              >
                Cancel
              </button>
              <button
                disabled={mutation.isPending || editor.value.trim().length < 2}
                className="min-h-11 cursor-pointer bg-primary px-5 font-semibold text-primary-foreground disabled:cursor-not-allowed disabled:opacity-50"
              >
                {mutation.isPending ? "Saving..." : "Save"}
              </button>
            </div>
          </form>
        </AppDialog>
      ) : null}
      {pendingDelete ? (
        <AppDialog
          title={`Delete ${pendingDelete.kind}`}
          description={`Delete “${pendingDelete.title}”? It must be empty.`}
          onClose={() => setPendingDelete(null)}
        >
          <div className="p-5 sm:p-6">
            <div className="mt-6 grid gap-3 min-[24rem]:flex min-[24rem]:justify-end">
              <button
                type="button"
                onClick={() => setPendingDelete(null)}
                className="min-h-11 cursor-pointer border border-strong-border px-5 font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={mutation.isPending}
                onClick={() =>
                  mutation.mutate(
                    pendingDelete.kind === "section"
                      ? { action: "delete-section", id: pendingDelete.id }
                      : {
                          action: "delete-category",
                          sectionId: pendingDelete.sectionId,
                          id: pendingDelete.id,
                        },
                  )
                }
                className="min-h-11 cursor-pointer bg-danger px-5 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                {mutation.isPending
                  ? "Deleting..."
                  : `Delete ${pendingDelete.kind}`}
              </button>
            </div>
          </div>
        </AppDialog>
      ) : null}
    </section>
  );
}
