import type { ReactNode } from "react";
import { AppDialog } from "../../components/ui/AppDialog";
import type { AdminResource } from "../../contracts/resource";
import type { ResourceYearGroup } from "../../utils/groupResourcesByYear";
import { formatResourceDate, formatResourceFileSize } from "../../utils/formatResourceMetadata";

export function AdminResourceYearDialog({ group, onClose, renderActions }: {
  group: ResourceYearGroup<AdminResource>;
  onClose: () => void;
  renderActions: (resource: AdminResource) => ReactNode;
}) {
  return (
    <AppDialog title={group.title} description="Resources by year, newest first." size="wide" onClose={onClose}>
      <ul className="divide-y divide-border p-5 sm:p-6">
        {group.resources.map((resource) => (
          <li key={resource.key} className="py-5 first:pt-0 last:pb-0">
            <p className="text-sm font-bold text-primary">Year: {resource.year}</p>
            <p className="mt-2 break-words font-semibold">{resource.displayName}</p>
            <p className="mt-1 break-all text-sm text-muted-foreground">{resource.filename}</p>
            <p className="mt-2 text-sm text-muted-foreground">{formatResourceFileSize(resource.fileSize)} · Updated {formatResourceDate(resource.uploadedAt)}</p>
            <div className="mt-4">{renderActions(resource)}</div>
          </li>
        ))}
      </ul>
    </AppDialog>
  );
}
