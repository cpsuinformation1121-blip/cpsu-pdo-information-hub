import { X } from "lucide-react";
import { type ReactNode, useEffect, useRef } from "react";

type AppDialogProps = {
  title: string;
  description?: string;
  children: ReactNode;
  onClose: () => void;
  size?: "default" | "wide" | "viewport";
};

export function AppDialog({
  title,
  description,
  children,
  onClose,
  size = "default",
}: AppDialogProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const sizeClass = {
    default: "max-w-lg",
    wide: "max-w-5xl",
    viewport:
      "h-[calc(100dvh-1rem)] max-w-[96rem] overflow-hidden sm:h-[calc(100dvh-3rem)]",
  }[size];

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    dialog.showModal();
    return () => dialog.close();
  }, []);

  return (
    <dialog
      ref={ref}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClick={(event) => {
        if (event.target === ref.current) onClose();
      }}
      className={`m-auto max-h-[calc(100dvh-1rem)] w-[calc(100%-1rem)] ${sizeClass} ${size === "viewport" ? "flex flex-col" : "overflow-y-auto"} rounded-3xl border border-primary/20 bg-surface p-0 text-foreground shadow-[0_28px_90px_rgba(20,83,45,0.24)] backdrop:bg-primary/25 sm:w-[calc(100%-2rem)]`}
    >
      <div className="sticky top-0 z-10 flex shrink-0 items-start justify-between gap-4 bg-primary px-4 py-5 text-primary-foreground sm:px-6">
        <div>
          <h2 className="font-serif text-2xl tracking-tight">{title}</h2>
          {description ? (
            <p className="mt-2 text-sm leading-6 text-primary-foreground/75">
              {description}
            </p>
          ) : null}
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close dialog"
          className="-mr-2 inline-flex size-10 shrink-0 cursor-pointer items-center justify-center rounded-xl text-primary-foreground/80 hover:bg-white/15 hover:text-primary-foreground focus-visible:outline-2 focus-visible:outline-primary-foreground"
        >
          <X className="size-5" />
        </button>
      </div>
      {children}
    </dialog>
  );
}
