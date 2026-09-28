import { useState } from "react";
import { GestureZoomViewport } from "./GestureZoomViewport";

type ImageSize = { width: number; height: number };

export function ZoomableImagePreview({
  url,
  title,
}: {
  url: string;
  title: string;
}) {
  const [naturalSize, setNaturalSize] = useState<ImageSize | null>(null);

  return (
    <GestureZoomViewport
      label={`Gesture-enabled image preview of ${title}`}
      maxZoom={400}
    >
      {({ zoom, viewportWidth, viewportHeight }) => {
        const availableWidth = Math.max(1, viewportWidth - 32);
        const availableHeight = Math.max(1, viewportHeight - 32);
        const fitScale = naturalSize
          ? Math.min(
              1,
              availableWidth / naturalSize.width,
              availableHeight / naturalSize.height,
            )
          : 1;
        const width = naturalSize
          ? naturalSize.width * fitScale * (zoom / 100)
          : undefined;
        const height = naturalSize
          ? naturalSize.height * fitScale * (zoom / 100)
          : undefined;

        return (
          <div
            className="flex items-center justify-center"
            style={{
              width: width ? Math.max(availableWidth, width) : availableWidth,
              height: height
                ? Math.max(availableHeight, height)
                : availableHeight,
            }}
          >
            <img
              src={url}
              alt={`Preview of ${title}`}
              referrerPolicy="no-referrer"
              draggable={false}
              onLoad={(event) => {
                setNaturalSize({
                  width: event.currentTarget.naturalWidth,
                  height: event.currentTarget.naturalHeight,
                });
              }}
              className="max-w-none shrink-0 border border-strong-border bg-white object-contain"
              style={{ width, height }}
            />
          </div>
        );
      }}
    </GestureZoomViewport>
  );
}
