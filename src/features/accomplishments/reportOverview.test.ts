import { describe, expect, it } from "vitest";
import { buildAccomplishmentOverviewGroups } from "./reportOverview";

const nodes = [
  {
    id: "performance",
    parentId: null,
    type: "section" as const,
    title: "Performance",
  },
  {
    id: "education",
    parentId: "performance",
    type: "group" as const,
    title: "Education",
  },
  {
    id: "completion",
    parentId: "education",
    type: "indicator" as const,
    title: "Completion rate",
  },
];

const period = { q1: "80", q2: "80", q3: "80", q4: "80", total: "80" };
const entries = {
  completion: {
    results: { target: period, accomplishment: { ...period, total: "70" } },
    rawData: { target: period, accomplishment: period },
  },
};

describe("accomplishment overview groups", () => {
  it("builds the annual overview and per-indicator charts with color keys", () => {
    const groups = buildAccomplishmentOverviewGroups(nodes, entries);

    expect(groups[0].title).toBe("Annual performance by indicator");
    expect(groups[0].charts[0].data[0].colorKey).toBe("completion:total");

    const indicatorGroup = groups.find((group) => group.id === "education");
    expect(indicatorGroup?.charts).toHaveLength(2);
    expect(indicatorGroup?.charts[0].data[0].colorKey).toBe("completion:total");
    expect(indicatorGroup?.charts[1].data[0].colorKey).toBe("completion:q1");
  });
});
