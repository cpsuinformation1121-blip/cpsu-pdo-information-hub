import type {
  ResourceFileType,
  ResourceSort,
} from "../../contracts/resource";

export const resourceFileTypeOptions: readonly {
  value: ResourceFileType | "";
  label: string;
}[] = [
  { value: "", label: "All file types" },
  { value: "pdf", label: "PDF documents" },
  { value: "image", label: "Images" },
  { value: "link", label: "Links" },
];

export const resourceSortOptions: readonly {
  value: ResourceSort;
  label: string;
}[] = [
  { value: "newest", label: "Newest first" },
  { value: "oldest", label: "Oldest first" },
  { value: "name-asc", label: "Name A–Z" },
  { value: "name-desc", label: "Name Z–A" },
  { value: "file-size", label: "Largest first" },
  { value: "file-type", label: "File type" },
];
