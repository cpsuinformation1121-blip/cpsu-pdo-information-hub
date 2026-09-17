import type { ResourceFileType } from "../contracts/resource";

const resourceFileTypeLabels: Record<ResourceFileType, string> = {
  pdf: "PDF",
  image: "Image",
  xlsx: "File",
  link: "Link",
};

export function formatResourceFileType(fileType: ResourceFileType) {
  return resourceFileTypeLabels[fileType];
}
