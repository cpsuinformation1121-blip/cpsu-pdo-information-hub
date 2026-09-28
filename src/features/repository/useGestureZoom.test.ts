import { describe, expect, it } from "vitest";
import {
  calculateAnchoredScroll,
  calculatePinchZoom,
  calculateWheelZoom,
  clampPreviewZoom,
} from "./useGestureZoom";

describe("gesture zoom calculations", () => {
  it("keeps zoom within the configured viewing range", () => {
    expect(clampPreviewZoom(20, 50, 300)).toBe(50);
    expect(clampPreviewZoom(175, 50, 300)).toBe(175);
    expect(clampPreviewZoom(500, 50, 300)).toBe(300);
  });

  it("scales naturally from the distance between two touch points", () => {
    expect(calculatePinchZoom(100, 100, 150)).toBe(150);
    expect(calculatePinchZoom(200, 200, 100)).toBe(100);
    expect(calculatePinchZoom(125, 0, 300)).toBe(125);
  });

  it("zooms in and out from trackpad pinch wheel deltas", () => {
    expect(calculateWheelZoom(100, -20)).toBeGreaterThan(100);
    expect(calculateWheelZoom(100, 20)).toBeLessThan(100);
  });

  it("limits large mouse-wheel deltas to a controlled zoom step", () => {
    expect(calculateWheelZoom(100, -100)).toBeCloseTo(
      calculateWheelZoom(100, -20),
    );
    expect(calculateWheelZoom(100, 100)).toBeCloseTo(
      calculateWheelZoom(100, 20),
    );
  });

  it("anchors each axis to its actual resized content extent", () => {
    expect(calculateAnchoredScroll(300, 200, 1000, 2000)).toBe(400);
    expect(calculateAnchoredScroll(300, 200, 600, 600)).toBe(100);
  });
});
