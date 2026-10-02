import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import { AppDialog } from "../../components/ui/AppDialog";
import { resourceEditSchema, type ResourceEdit } from "../../contracts/adminOperations";
import type { AdminResource } from "../../contracts/resource";
import { useRepositoryStructureQuery } from "../repository/useRepositoryStructureQuery";

const formSchema = resourceEditSchema.omit({ year: true }).extend({
  year: z.string().trim().transform((value) => /^\d{4}$/u.test(value) ? Number(value) : value)
    .pipe(resourceEditSchema.shape.year),
});
type FormInput = z.input<typeof formSchema>;

const fieldClass = "mt-2 min-h-12 w-full border border-strong-border bg-surface px-3 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20";
const errorClass = "mt-2 block text-sm text-danger";

export function AdminResourceEditDialog({ resource, isPending, error, onClose, onSubmit }: {
  resource: AdminResource;
  isPending: boolean;
  error?: string;
  onClose: () => void;
  onSubmit: (input: ResourceEdit) => void;
}) {
  const structure = useRepositoryStructureQuery();
  const { register, handleSubmit, control, setValue, formState: { errors, isDirty } } =
    useForm<FormInput, unknown, ResourceEdit>({
      resolver: zodResolver(formSchema),
      defaultValues: {
        key: resource.key, displayName: resource.displayName,
        sectionId: resource.sectionId, categoryId: resource.categoryId,
        year: String(resource.year),
      },
    });
  const sectionId = useWatch({ control, name: "sectionId" });
  const categoryId = useWatch({ control, name: "categoryId" });
  const section = structure.data?.find((item) => item.id === sectionId);
  return (
    <AppDialog title="Edit resource" description="Update the display name and repository location." onClose={onClose}>
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5 p-5 sm:p-6">
        <p className="break-all text-sm text-muted-foreground">{resource.filename}</p>
        <fieldset disabled={isPending} className="space-y-5">
          <label className="block text-sm font-semibold">
            Display name
            <input autoFocus aria-label="Display name" {...register("displayName")} aria-invalid={!!errors.displayName} aria-describedby={errors.displayName ? "edit-name-error" : undefined} className={fieldClass} />
            {errors.displayName ? <span id="edit-name-error" className={errorClass}>{errors.displayName.message}</span> : null}
          </label>
          <label className="block text-sm font-semibold">
            Section
            <select aria-label="Section" value={sectionId} {...register("sectionId", { onChange: () => setValue("categoryId", undefined, { shouldDirty: true, shouldValidate: true }) })}
              disabled={!structure.isSuccess} aria-invalid={!!errors.sectionId} aria-describedby={errors.sectionId ? "edit-section-error" : undefined} className={fieldClass}>
              {!structure.isSuccess ? <option value={resource.sectionId}>{structure.isPending ? "Loading sections..." : resource.sectionId}</option> : null}
              {structure.data?.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}
            </select>
            {errors.sectionId ? <span id="edit-section-error" className={errorClass}>{errors.sectionId.message}</span> : null}
          </label>
          <label className="block text-sm font-semibold">
            Category
            <select aria-label="Category" value={categoryId ?? ""} {...register("categoryId", { setValueAs: (value: string) => value || undefined })}
              disabled={!structure.isSuccess} aria-invalid={!!errors.categoryId} aria-describedby={errors.categoryId ? "edit-category-error" : undefined} className={fieldClass}>
              <option value="">No category</option>
              {section?.categories.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}
            </select>
            {errors.categoryId ? <span id="edit-category-error" className={errorClass}>{errors.categoryId.message}</span> : null}
          </label>
          <label className="block text-sm font-semibold">
            Year or school year
            <input aria-label="Year or school year" {...register("year")} placeholder="2026 or 2026-2027" aria-invalid={!!errors.year} aria-describedby={errors.year ? "edit-year-error" : undefined} className={fieldClass} />
            {errors.year ? <span id="edit-year-error" className={errorClass}>{errors.year.message}</span> : null}
          </label>
        </fieldset>
        {structure.isError ? <div role="alert" className={errorClass}>Repository sections could not be loaded. <button type="button" onClick={() => structure.refetch()} className="underline">Try again</button></div> : null}
        {error ? <p role="alert" className={errorClass}>{error}</p> : null}
        <div className="grid gap-3 min-[24rem]:flex min-[24rem]:justify-end">
          <button type="button" disabled={isPending} onClick={onClose} className="min-h-11 cursor-pointer border border-strong-border px-5 font-semibold disabled:opacity-50">Cancel</button>
          <button type="submit" disabled={isPending || !structure.isSuccess || !isDirty}
            className="min-h-11 cursor-pointer bg-primary px-5 font-semibold text-primary-foreground disabled:cursor-not-allowed disabled:opacity-50">
            {isPending ? "Saving..." : "Save changes"}
          </button>
        </div>
      </form>
    </AppDialog>
  );
}
