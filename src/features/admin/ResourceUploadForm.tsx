import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, Link2, Upload } from "lucide-react";
import { useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import {
  maximumResourceFileSize,
  resourceUploadFileExtensions,
  resourceUploadMimeTypes,
} from "../../contracts/resourceUpload";
import {
  resourceLinkNameSchema,
  resourceLinkUrlSchema,
} from "../../contracts/resourceLink";
import { schoolYearSchema } from "../../contracts/resource";
import { createResourceLink } from "../../services/adminOperations";
import { uploadResource } from "../../services/resourceUpload";
import { useAuth } from "../auth/useAuth";
import { useRepositoryStructureQuery } from "../repository/useRepositoryStructureQuery";

const locationFields = {
  sectionId: z.string().min(1, "Select a repository section."),
  categoryId: z.string().optional(),
  year: schoolYearSchema,
};

const formSchema = z.discriminatedUnion("kind", [
  z.object({
    ...locationFields,
    kind: z.literal("file"),
    file: z
      .custom<File>((value) => value instanceof File, "Select a file.")
      .refine(
        (file) => file.size <= maximumResourceFileSize,
        "The file must not exceed 25 MB.",
      )
      .refine(
        (file) => resourceUploadMimeTypes.some((type) => type === file.type),
        "Select a PDF document or image.",
      ),
  }),
  z.object({
    ...locationFields,
    kind: z.literal("link"),
    linkName: resourceLinkNameSchema,
    linkUrl: resourceLinkUrlSchema,
  }),
]);

type FormInput = z.input<typeof formSchema>;
type FormValues = z.output<typeof formSchema>;

const currentDate = new Date();
const currentSchoolYearStart =
  currentDate.getMonth() >= 5
    ? currentDate.getFullYear()
    : currentDate.getFullYear() - 1;
const schoolYearOptions = Array.from({ length: 12 }, (_, index) => {
  const start = currentSchoolYearStart + 1 - index;
  return `${start}-${start + 1}`;
});

export function ResourceUploadForm() {
  const { user } = useAuth();
  const structure = useRepositoryStructureQuery();
  const queryClient = useQueryClient();
  const [completedName, setCompletedName] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    control,
    resetField,
    setValue,
    formState: { errors },
  } = useForm<FormInput, unknown, FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      kind: "file",
      sectionId: "",
      categoryId: "",
      year: `${currentSchoolYearStart}-${currentSchoolYearStart + 1}`,
    },
  });
  const kind = useWatch({ control, name: "kind" });
  const selectedSectionId = useWatch({ control, name: "sectionId" });
  const selectedSection = structure.data?.find(
    (section) => section.id === selectedSectionId,
  );
  const mutation = useMutation({
    mutationFn: async (values: FormValues) => {
      if (!user) throw new Error("Please sign in before adding a resource.");
      if (values.kind === "link") {
        return createResourceLink(user, {
          name: values.linkName,
          url: values.linkUrl,
          sectionId: values.sectionId,
          categoryId: values.categoryId || undefined,
          year: values.year,
        });
      }
      return uploadResource(user, values.file, {
        sectionId: values.sectionId,
        categoryId: values.categoryId || undefined,
        year: values.year,
      });
    },
    onSuccess: async (_key, values) => {
      setCompletedName(
        values.kind === "link" ? values.linkName : values.file.name,
      );
      if (values.kind === "link") {
        resetField("linkName");
        resetField("linkUrl");
      } else {
        resetField("file");
      }
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["admin-resources"] }),
        queryClient.invalidateQueries({ queryKey: ["resources"] }),
      ]);
    },
  });

  function selectKind(nextKind: "file" | "link") {
    mutation.reset();
    setCompletedName(null);
    setValue("kind", nextKind);
  }

  return (
    <form
      className="mt-6 w-full space-y-6 rounded-2xl border border-border bg-surface px-4 py-5 shadow-[0_12px_32px_rgba(20,83,45,0.06)] sm:px-7 sm:py-6"
      onSubmit={handleSubmit((values) => {
        setCompletedName(null);
        mutation.mutate(values);
      })}
      noValidate
    >
      <fieldset>
        <legend className="text-sm font-semibold">Resource type</legend>
        <div className="mt-2 grid max-w-md grid-cols-2 gap-2 rounded-2xl bg-surface-secondary p-1.5">
          <button
            type="button"
            onClick={() => selectKind("file")}
            aria-pressed={kind === "file"}
            className={`inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold ${kind === "file" ? "bg-primary text-primary-foreground" : "text-foreground hover:bg-primary-soft"}`}
          >
            <Upload className="size-4" aria-hidden="true" />
            File
          </button>
          <button
            type="button"
            onClick={() => selectKind("link")}
            aria-pressed={kind === "link"}
            className={`inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold ${kind === "link" ? "bg-primary text-primary-foreground" : "text-foreground hover:bg-primary-soft"}`}
          >
            <Link2 className="size-4" aria-hidden="true" />
            Link
          </button>
        </div>
        <input type="hidden" {...register("kind")} />
      </fieldset>

      <div className="grid gap-6 sm:grid-cols-2">
        <label>
          <span className="block text-sm font-semibold">Section</span>
          <select
            {...register("sectionId", {
              onChange: () => resetField("categoryId"),
            })}
            disabled={structure.isPending}
            className="mt-2 min-h-12 w-full cursor-pointer border border-strong-border bg-surface px-3 disabled:cursor-not-allowed disabled:bg-surface-secondary"
          >
            <option value="">
              {structure.isPending ? "Loading sections..." : "Select section"}
            </option>
            {structure.data?.map((section) => (
              <option key={section.id} value={section.id}>
                {section.title}
              </option>
            ))}
          </select>
          {errors.sectionId ? (
            <span className="mt-2 block text-sm text-danger">
              {errors.sectionId.message}
            </span>
          ) : null}
        </label>
        <label>
          <span className="block text-sm font-semibold">
            Category{" "}
            <span className="font-normal text-muted-foreground">
              (optional)
            </span>
          </span>
          <select
            {...register("categoryId")}
            disabled={!selectedSection}
            className="mt-2 min-h-12 w-full cursor-pointer border border-strong-border bg-surface px-3 disabled:cursor-not-allowed disabled:bg-surface-secondary"
          >
            <option value="">No category</option>
            {selectedSection?.categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.title}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label className="block">
        <span className="block text-sm font-semibold">Year</span>
        <select
          {...register("year")}
          className="mt-2 min-h-12 w-full cursor-pointer border border-strong-border bg-surface px-4 sm:max-w-xs"
        >
          {schoolYearOptions.map((schoolYear) => (
            <option key={schoolYear} value={schoolYear}>
              {schoolYear}
            </option>
          ))}
        </select>
        {errors.year ? (
          <span className="mt-2 block text-sm text-danger">
            {errors.year.message}
          </span>
        ) : null}
      </label>

      {kind === "link" ? (
        <div className="grid gap-5">
          <label>
            <span className="block text-sm font-semibold">Link name</span>
            <input
              {...register("linkName")}
              type="text"
              autoComplete="off"
              placeholder="Example: MIS DPCR Evaluation Form"
              className="mt-2 min-h-12 w-full border border-strong-border bg-surface px-4 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
            {"linkName" in errors && errors.linkName ? (
              <span className="mt-2 block text-sm text-danger">
                {errors.linkName.message}
              </span>
            ) : null}
          </label>
          <label>
            <span className="block text-sm font-semibold">Web address</span>
            <input
              {...register("linkUrl")}
              type="url"
              inputMode="url"
              autoCapitalize="none"
              autoCorrect="off"
              placeholder="https://example.com/form"
              className="mt-2 min-h-12 w-full border border-strong-border bg-surface px-4 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
            <span className="mt-2 block text-sm text-muted-foreground">
              Secure HTTPS links only. The destination opens in a new tab.
            </span>
            {"linkUrl" in errors && errors.linkUrl ? (
              <span className="mt-2 block text-sm text-danger">
                {errors.linkUrl.message}
              </span>
            ) : null}
          </label>
        </div>
      ) : (
        <div className="block">
          <span id="resource-file-label" className="block text-sm font-semibold">
            File
          </span>
          <Controller
            name="file"
            control={control}
            render={({ field: { name, onBlur, onChange, ref, value } }) => (
              <div className="mt-2 flex min-h-20 flex-col gap-3 rounded-2xl border border-dashed border-strong-border bg-surface-secondary p-4 sm:flex-row sm:items-center">
                <input
                  id="resource-file"
                  ref={ref}
                  name={name}
                  onBlur={onBlur}
                  onChange={(event) =>
                    onChange(event.target.files?.item(0) ?? undefined)
                  }
                  type="file"
                  accept={resourceUploadFileExtensions
                    .map((extension) => `.${extension}`)
                    .join(",")}
                  aria-describedby="resource-file-help"
                  aria-labelledby="resource-file-label"
                  aria-invalid={"file" in errors && errors.file ? "true" : "false"}
                  className="peer sr-only"
                />
                <label
                  htmlFor="resource-file"
                  className="inline-flex min-h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground shadow-[0_8px_20px_rgba(20,83,45,0.12)] transition-colors hover:bg-primary-hover peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-primary sm:w-auto"
                >
                  <Upload className="size-4" aria-hidden="true" />
                  Choose file
                </label>
                <span className="min-w-0 flex-1 break-all text-sm text-foreground">
                  {value instanceof File ? value.name : "No file chosen"}
                </span>
              </div>
            )}
          />
          <span
            id="resource-file-help"
            className="mt-2 block text-sm text-muted-foreground"
          >
            PDF, JPG, PNG, or WebP · 25 MB max.
          </span>
          {"file" in errors && errors.file ? (
            <span className="mt-2 block text-sm text-danger">
              {errors.file.message}
            </span>
          ) : null}
        </div>
      )}

      {mutation.isError ? (
        <p
          className="rounded-xl border border-danger/20 bg-danger-soft px-4 py-3 text-sm text-danger"
          role="alert"
        >
          {mutation.error instanceof Error
            ? mutation.error.message
            : "The resource could not be added."}
        </p>
      ) : null}
      {completedName ? (
        <p
          className="flex items-start gap-2 rounded-xl border border-primary/15 bg-primary-soft px-4 py-3 text-sm text-primary"
          role="status"
        >
          <CheckCircle2 className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          <span>
            <span className="break-all font-medium">{completedName}</span>{" "}
            added to the repository.
          </span>
        </p>
      ) : null}
      <button
        type="submit"
        disabled={mutation.isPending}
        className="inline-flex min-h-12 w-full cursor-pointer items-center justify-center gap-2 bg-primary px-6 text-sm font-semibold text-primary-foreground hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-55 min-[24rem]:w-auto"
      >
        {kind === "link" ? (
          <Link2 className="size-4" aria-hidden="true" />
        ) : (
          <Upload className="size-4" aria-hidden="true" />
        )}
        {mutation.isPending
          ? kind === "link"
            ? "Adding link…"
            : "Uploading…"
          : kind === "link"
            ? "Add link"
            : "Upload file"}
      </button>
    </form>
  );
}