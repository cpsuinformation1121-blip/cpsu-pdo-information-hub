import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ReportIndicatorDataTable } from "./ReportIndicatorDataTable";

describe("ReportIndicatorDataTable", () => {
  it("renders percentage and special-character raw values without changing them", () => {
    const markup = renderToStaticMarkup(
      <ReportIndicatorDataTable
        title="Research"
        periods={[
          { id: "h1", label: "H1" },
          { id: "total", label: "Total" },
        ]}
        entry={{
          results: {
            target: { h1: "50", total: "50" },
            accomplishment: { h1: "63", total: "63" },
          },
          rawData: {
            target: { h1: "(27)", total: "(27)" },
            accomplishment: { h1: "53 & 10", total: "63+" },
          },
        }}
      />,
    );

    expect(markup).toContain("50%");
    expect(markup).toContain("63%");
    expect(markup).toContain("(27)");
    expect(markup).toContain("53 &amp; 10");
    expect(markup).toContain("63+");
  });

  it("keeps the responsive sideways-scrolling table wrapper", () => {
    const markup = renderToStaticMarkup(
      <ReportIndicatorDataTable
        title="Empty indicator"
        periods={[{ id: "total", label: "Total" }]}
      />,
    );

    expect(markup).toContain("overflow-x-auto");
    expect(markup).toContain("Scroll sideways on smaller screens.");
    expect(markup).toContain("—");
  });
});
