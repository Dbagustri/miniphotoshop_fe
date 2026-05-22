// src/components/canvas/CanvasEditor.jsx

import { Move } from "lucide-react";
import Loading from "./Loading";

function CanvasEditor({
  image,
  editorState = {},
  showBefore = false,
  isProcessing = false,
  loadingText = "Processing Image...",
  onCanvasClick,
}) {
  const {
    brightness = 100,
    contrast = 100,
    blur = 0,
    grayscale = 0,

    rotate = 0,
    zoom = 1,

    translateX = 0,
    translateY = 0,
  } = editorState;

  const imageSrc = showBefore ? image?.original : image?.preview;

  return (
    <div className="w-full h-full p-6">
      <div className="relative w-full h-full rounded-3xl overflow-hidden border border-zinc-800 bg-zinc-950 shadow-inner">
        {/* Loading Overlay */}
        {isProcessing && <Loading text={loadingText} />}

        {/* Checker Background */}
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `
              linear-gradient(45deg, #27272a 25%, transparent 25%),
              linear-gradient(-45deg, #27272a 25%, transparent 25%),
              linear-gradient(45deg, transparent 75%, #27272a 75%),
              linear-gradient(-45deg, transparent 75%, #27272a 75%)
            `,
            backgroundSize: "24px 24px",
            backgroundPosition: "0 0, 0 12px, 12px -12px, -12px 0px",
          }}
        />

        {/* Empty State */}
        {!imageSrc ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center z-10">
            <div className="w-20 h-20 rounded-full bg-zinc-800 flex items-center justify-center mb-4">
              <Move className="text-zinc-500" />
            </div>

            <h2 className="text-zinc-300 text-lg font-medium">
              Upload an image to start editing
            </h2>

            <p className="text-zinc-500 text-sm mt-2">
              Your image preview will appear here
            </p>
          </div>
        ) : (
          /* Image Preview */
          <div className="absolute inset-0 flex items-center justify-center overflow-hidden">
            <img
              src={imageSrc}
              alt="Editor Preview"
              draggable={false}
              onClick={onCanvasClick}
              className="
                max-w-full
                max-h-full
                object-contain
                select-none
                transition-transform
                transition-filter
                duration-300
                ease-out
                cursor-crosshair
              "
              style={{
                filter: `
                  brightness(${brightness}%)
                  contrast(${contrast}%)
                  blur(${blur}px)
                  grayscale(${grayscale}%)
                `,

                transform: `
                  translate(${translateX}px, ${translateY}px)
                  scale(${zoom})
                  rotate(${rotate}deg)
                `,
              }}
            />
          </div>
        )}

        {/* Status Badge */}
        {showBefore && image && (
          <div className="absolute top-4 left-4 z-30 bg-blue-600/90 backdrop-blur-md rounded-xl px-4 py-2 text-xs font-semibold text-white shadow-lg">
            Viewing Original
          </div>
        )}

        {/* Canvas Info */}
        {image && (
          <div className="absolute bottom-4 left-4 z-20 bg-zinc-900/80 backdrop-blur-md border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-400 flex items-center gap-4">
            <span>
              Zoom:
              <span className="text-zinc-200 ml-1">
                {Math.round(zoom * 100)}%
              </span>
            </span>

            <span>
              Rotation:
              <span className="text-zinc-200 ml-1">{rotate}°</span>
            </span>

            {showBefore && (
              <span className="text-blue-400 font-medium">Original</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default CanvasEditor;
