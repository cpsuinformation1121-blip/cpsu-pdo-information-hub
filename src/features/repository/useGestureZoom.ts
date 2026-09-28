import {
  type KeyboardEvent as ReactKeyboardEvent,
  type PointerEvent as ReactPointerEvent,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";

type Point = { x: number; y: number };
type PanGesture = Point & { scrollLeft: number; scrollTop: number };
type PinchGesture = { distance: number; zoom: number };
type ZoomFocus = Point & {
  contentX: number;
  contentY: number;
  scrollWidth: number;
  scrollHeight: number;
};

type GestureZoomOptions = {
  initialZoom?: number;
  minZoom?: number;
  maxZoom?: number;
};

export function clampPreviewZoom(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function calculatePinchZoom(
  startZoom: number,
  startDistance: number,
  currentDistance: number,
) {
  if (startDistance <= 0) return startZoom;
  return startZoom * (currentDistance / startDistance);
}

export function calculateWheelZoom(currentZoom: number, deltaY: number) {
  const normalizedDelta = Math.max(-20, Math.min(20, deltaY));
  return currentZoom * Math.exp(-normalizedDelta * 0.01);
}

export function calculateAnchoredScroll(
  contentOffset: number,
  pointerOffset: number,
  previousExtent: number,
  nextExtent: number,
) {
  if (previousExtent <= 0) return contentOffset - pointerOffset;
  return contentOffset * (nextExtent / previousExtent) - pointerOffset;
}

function distanceBetween([first, second]: Point[]) {
  return Math.hypot(second.x - first.x, second.y - first.y);
}

function midpoint([first, second]: Point[]) {
  return {
    x: (first.x + second.x) / 2,
    y: (first.y + second.y) / 2,
  };
}

export function useGestureZoom({
  initialZoom = 100,
  minZoom = 50,
  maxZoom = 300,
}: GestureZoomOptions = {}) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const pointersRef = useRef(new Map<number, Point>());
  const panRef = useRef<PanGesture | null>(null);
  const pinchRef = useRef<PinchGesture | null>(null);
  const pendingFocusRef = useRef<ZoomFocus | null>(null);
  const zoomRef = useRef(initialZoom);
  const [zoom, setZoomState] = useState(initialZoom);
  const [isInteracting, setIsInteracting] = useState(false);


  const changeZoom = useCallback(
    (requestedZoom: number, clientPoint?: Point) => {
      const nextZoom = clampPreviewZoom(requestedZoom, minZoom, maxZoom);
      if (nextZoom === zoomRef.current) return;

      const viewport = viewportRef.current;
      let focus: ZoomFocus | undefined;
      if (viewport && clientPoint) {
        const bounds = viewport.getBoundingClientRect();
        const x = clientPoint.x - bounds.left;
        const y = clientPoint.y - bounds.top;
        focus = {
          x,
          y,
          contentX: viewport.scrollLeft + x,
          contentY: viewport.scrollTop + y,
          scrollWidth: viewport.scrollWidth,
          scrollHeight: viewport.scrollHeight,
        };
      }

      pendingFocusRef.current = focus ?? null;
      zoomRef.current = nextZoom;
      setZoomState(nextZoom);
    },
    [maxZoom, minZoom],
  );

  useLayoutEffect(() => {
    const viewport = viewportRef.current;
    const focus = pendingFocusRef.current;
    if (!viewport || !focus) return;

    viewport.scrollLeft = calculateAnchoredScroll(
      focus.contentX,
      focus.x,
      focus.scrollWidth,
      viewport.scrollWidth,
    );
    viewport.scrollTop = calculateAnchoredScroll(
      focus.contentY,
      focus.y,
      focus.scrollHeight,
      viewport.scrollHeight,
    );
    pendingFocusRef.current = null;
  }, [zoom]);

  const resetZoom = useCallback(() => {
    changeZoom(initialZoom);
    requestAnimationFrame(() => {
      viewportRef.current?.scrollTo({ left: 0, top: 0 });
    });
  }, [changeZoom, initialZoom]);

  const beginPan = useCallback((point: Point) => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    panRef.current = {
      ...point,
      scrollLeft: viewport.scrollLeft,
      scrollTop: viewport.scrollTop,
    };
  }, []);

  const onPointerDown = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      if (event.pointerType === "mouse" && event.button !== 0) return;
      event.preventDefault();
      event.currentTarget.focus({ preventScroll: true });
      event.currentTarget.setPointerCapture(event.pointerId);
      pointersRef.current.set(event.pointerId, {
        x: event.clientX,
        y: event.clientY,
      });
      setIsInteracting(true);

      const points = [...pointersRef.current.values()];
      if (points.length === 1) beginPan(points[0]);
      if (points.length === 2) {
        pinchRef.current = {
          distance: Math.max(1, distanceBetween(points)),
          zoom: zoomRef.current,
        };
      }
    },
    [beginPan],
  );

  const onPointerMove = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      if (!pointersRef.current.has(event.pointerId)) return;
      event.preventDefault();
      pointersRef.current.set(event.pointerId, {
        x: event.clientX,
        y: event.clientY,
      });

      const points = [...pointersRef.current.values()];
      if (points.length >= 2 && pinchRef.current) {
        changeZoom(
          calculatePinchZoom(
            pinchRef.current.zoom,
            pinchRef.current.distance,
            distanceBetween(points),
          ),
          midpoint(points),
        );
        return;
      }

      const viewport = viewportRef.current;
      const pan = panRef.current;
      if (viewport && pan && points.length === 1) {
        viewport.scrollLeft = pan.scrollLeft - (event.clientX - pan.x);
        viewport.scrollTop = pan.scrollTop - (event.clientY - pan.y);
      }
    },
    [changeZoom],
  );

  const endPointer = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      pointersRef.current.delete(event.pointerId);
      if (event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId);
      }

      const points = [...pointersRef.current.values()];
      pinchRef.current = null;
      if (points.length === 1) beginPan(points[0]);
      else panRef.current = null;
      if (points.length === 0) setIsInteracting(false);
    },
    [beginPan],
  );

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;

    const handleWheel = (event: WheelEvent) => {
      if (!event.ctrlKey && !event.metaKey) return;
      event.preventDefault();
      event.stopPropagation();
      changeZoom(calculateWheelZoom(zoomRef.current, event.deltaY), {
        x: event.clientX,
        y: event.clientY,
      });
    };

    viewport.addEventListener("wheel", handleWheel, { passive: false });
    return () => viewport.removeEventListener("wheel", handleWheel);
  }, [changeZoom]);

  const onDoubleClick = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      changeZoom(zoomRef.current > initialZoom ? initialZoom : 200, {
        x: event.clientX,
        y: event.clientY,
      });
    },
    [changeZoom, initialZoom],
  );

  const onKeyDown = useCallback(
    (event: ReactKeyboardEvent<HTMLDivElement>) => {
      if (event.key === "+" || event.key === "=") {
        event.preventDefault();
        changeZoom(zoomRef.current + 25);
      } else if (event.key === "-") {
        event.preventDefault();
        changeZoom(zoomRef.current - 25);
      } else if (event.key === "0") {
        event.preventDefault();
        resetZoom();
      }
    },
    [changeZoom, resetZoom],
  );

  return {
    viewportRef,
    zoom,
    isInteracting,
    resetZoom,
    viewportProps: {
      onPointerDown,
      onPointerMove,
      onPointerUp: endPointer,
      onPointerCancel: endPointer,
      onLostPointerCapture: endPointer,
      onDoubleClick,
      onKeyDown,
    },
  };
}
