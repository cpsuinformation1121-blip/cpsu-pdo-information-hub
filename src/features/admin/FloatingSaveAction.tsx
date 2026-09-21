import { Save } from "lucide-react";

export function FloatingSaveAction({
  isVisible,
  isSaving,
  onSave,
}: {
  isVisible: boolean;
  isSaving: boolean;
  onSave: () => void;
}) {
  if (!isVisible) return null;

  return (
    <div
      className="fixed bottom-4 left-4 right-4 z-40 flex flex-col gap-3 rounded-xl border border-primary/25 bg-surface p-4 shadow-[0_18px_48px_rgba(20,83,45,0.24)] sm:bottom-5 sm:left-auto sm:right-5 sm:w-[22rem] sm:flex-row sm:items-center sm:justify-between"
      role="region"
      aria-label="Unsaved changes actions"
    >
      <p
        className="text-sm font-semibold text-foreground"
        role="status"
        aria-live="polite"
      >
        You have unsaved changes.
      </p>
      <button
        type="button"
        disabled={isSaving}
        onClick={onSave}
        className="inline-flex min-h-11 shrink-0 cursor-pointer items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground hover:bg-primary-hover disabled:cursor-wait disabled:opacity-70"
      >
        <Save className="size-4" aria-hidden="true" />
        {isSaving ? "Saving..." : "Save changes"}
      </button>
    </div>
  );
}
