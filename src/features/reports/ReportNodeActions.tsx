import { Pencil, Plus, Trash2 } from "lucide-react";
import {
  reportChildType,
  type ReportTreeNode,
} from "./adminReportEditorModel";

const actionClass =
  "inline-flex min-h-11 min-w-11 justify-center sm:min-h-9 sm:min-w-0 cursor-pointer items-center gap-1 px-2 text-xs font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary";

export function ReportNodeActions({
  node,
  onAdd,
  onEdit,
  onDelete,
}: {
  node: ReportTreeNode;
  onAdd: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <span className="flex shrink-0 items-center">
      {reportChildType(node.type) ? (
        <button
          type="button"
          onClick={onAdd}
          className={actionClass + " text-primary"}
        >
          <Plus className="size-3.5" aria-hidden="true" />
          Add
        </button>
      ) : null}
      <button
        type="button"
        onClick={onEdit}
        aria-label={`Edit ${node.title}`}
        className={actionClass + " text-primary"}
      >
        <Pencil className="size-3.5" aria-hidden="true" />
      </button>
      <button
        type="button"
        onClick={onDelete}
        aria-label={`Delete ${node.title}`}
        className={actionClass + " text-danger"}
      >
        <Trash2 className="size-3.5" aria-hidden="true" />
      </button>
    </span>
  );
}
