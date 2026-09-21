import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { FloatingSaveAction } from "./FloatingSaveAction";

describe("FloatingSaveAction", () => {
  it("stays hidden until the editor has unsaved changes", () => {
    expect(
      renderToStaticMarkup(
        <FloatingSaveAction
          isVisible={false}
          isSaving={false}
          onSave={vi.fn()}
        />,
      ),
    ).toBe("");
  });

  it("shows an accessible save action for pending changes", () => {
    const markup = renderToStaticMarkup(
      <FloatingSaveAction
        isVisible
        isSaving={false}
        onSave={vi.fn()}
      />,
    );

    expect(markup).toContain('aria-label="Unsaved changes actions"');
    expect(markup).toContain("You have unsaved changes.");
    expect(markup).toContain("Save changes");
  });

  it("disables the action while a save is in progress", () => {
    const markup = renderToStaticMarkup(
      <FloatingSaveAction isVisible isSaving onSave={vi.fn()} />,
    );

    expect(markup).toContain("disabled");
    expect(markup).toContain("Saving...");
  });
});