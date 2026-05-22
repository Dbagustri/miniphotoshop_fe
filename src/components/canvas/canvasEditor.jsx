// src/components/canvas/CanvasEditor.jsx

import {
  UploadCloud,
  ImageIcon,
  MousePointer2,
  Minus,
  Plus,
} from "lucide-react";

import { useRef, useState } from "react";

function CanvasEditor({
  image,
  originalImage,
  setImage,
  setOriginalImage,
  showBefore,
  editorState,
  setEditorState,
  setImageInfo,
}) {
  const containerRef = useRef(null);

  const [isDragging, setIsDragging] = useState(false);

  const [dragStart, setDragStart] = useState({
    x: 0,
    y: 0,
  });

  const currentImage = showBefore ? originalImage : image;

  const canDrag = editorState.zoom > 1;

  // ======================
  // IMAGE UPLOAD
  // ======================

  const handleUpload = (e) => {
    const file = e.target.files?.[0];

    if (!file) return;

    const imageURL = URL.createObjectURL(file);

    const img = new Image();

    img.onload = () => {
      setImageInfo({
        width: img.width,
        height: img.height,

        size: (file.size / 1024 / 1024).toFixed(2),

        format: file.type.split("/")[1]?.toUpperCase(),
      });
    };

    img.src = imageURL;

    setImage(imageURL);
    setOriginalImage(imageURL);
  };

  // ======================
  // DRAG IMAGE
  // ======================

  const handleMouseDown = (e) => {
    if (!canDrag || editorState.cropMode) return;

    setIsDragging(true);

    setDragStart({
      x: e.clientX - editorState.translateX,

      y: e.clientY - editorState.translateY,
    });
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;

    setEditorState((prev) => ({
      ...prev,

      translateX: e.clientX - dragStart.x,

      translateY: e.clientY - dragStart.y,
    }));
  };

  const stopDragging = () => {
    setIsDragging(false);
  };

  // ======================
  // WHEEL ZOOM
  // ======================

  const handleWheel = (e) => {
    e.preventDefault();

    const zoomSpeed = 0.1;

    setEditorState((prev) => {
      let nextZoom = prev.zoom + (e.deltaY < 0 ? zoomSpeed : -zoomSpeed);

      nextZoom = Math.min(Math.max(nextZoom, 0.5), 5);

      return {
        ...prev,

        zoom: Number(nextZoom.toFixed(2)),
      };
    });
  };

  // ======================
  // BUTTON ZOOM
  // ======================

  const zoomIn = () => {
    setEditorState((prev) => ({
      ...prev,
      zoom: Math.min(prev.zoom + 0.1, 5),
    }));
  };

  const zoomOut = () => {
    setEditorState((prev) => ({
      ...prev,
      zoom: Math.max(prev.zoom - 0.1, 0.5),
    }));
  };

  const resetZoom = () => {
    setEditorState((prev) => ({
      ...prev,
      zoom: 1,
      translateX: 0,
      translateY: 0,
    }));
  };

  // ======================
  // SEED POINT
  // ======================

  const handleSeedPoint = (e) => {
    if (!editorState.cropMode) return;

    const rect = e.currentTarget.getBoundingClientRect();

    const x = e.clientX - rect.left;

    const y = e.clientY - rect.top;

    setEditorState((prev) => ({
      ...prev,

      segmentation: {
        ...prev.segmentation,

        seedPoint: {
          x: Math.round(x),

          y: Math.round(y),
        },
      },
    }));
  };

  return (
    <div
      ref={containerRef}
      onWheel={handleWheel}
      onMouseMove={handleMouseMove}
      onMouseUp={stopDragging}
      onMouseLeave={stopDragging}
      className="w-full h-full flex items-center justify-center relative overflow-hidden"
    >
      {!image ? (
        <label
          className="
            group
            w-[520px]
            h-[340px]
            border-2
            border-dashed
            border-zinc-700
            hover:border-blue-500
            rounded-[2rem]
            bg-zinc-950/50
            backdrop-blur-md
            flex
            flex-col
            items-center
            justify-center
            cursor-pointer
            transition-all
            duration-300
            hover:bg-zinc-900/80
          "
        >
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleUpload}
          />

          <div className="mb-5 p-5 rounded-full bg-zinc-900 border border-zinc-800">
            <UploadCloud size={42} className="text-zinc-500" />
          </div>

          <h2 className="text-xl font-semibold text-white mb-2">
            Upload Image
          </h2>

          <p className="text-sm text-zinc-500 text-center">
            Click to upload image
          </p>

          <div className="mt-4 flex items-center gap-2 text-xs text-zinc-600">
            <ImageIcon size={14} />
            JPG, PNG, WEBP
          </div>
        </label>
      ) : (
        <div className="w-full h-full flex items-center justify-center">
          {/* Workspace */}
          <div className="relative w-full h-full  bg-zinc-950 shadow-[0_0_80px_rgba(0,0,0,0.4)] overflow-hidden flex items-center justify-center">
            <img
              src={currentImage}
              alt="preview"
              draggable={false}
              onMouseDown={handleMouseDown}
              onClick={handleSeedPoint}
              className={`
                object-contain
                max-w-full
                max-h-full
                select-none
                transition-transform
                duration-100
                ease-out
                ${
                  editorState.cropMode
                    ? "cursor-crosshair"
                    : canDrag
                      ? "cursor-grab"
                      : "cursor-default"
                }
              `}
              style={{
                filter: `
                  brightness(${editorState.brightness}%)
                  contrast(${editorState.contrast}%)
                  blur(${editorState.blur}px)
                  grayscale(${editorState.grayscale ? 100 : 0}%)
                  saturate(${editorState.saturation}%)
                  hue-rotate(${editorState.hue}deg)
                `,

                transform: `
                  translate(${editorState.translateX}px, ${editorState.translateY}px)
                  scaleX(${editorState.flipHorizontal ? -1 : 1})
                  scaleY(${editorState.flipVertical ? -1 : 1})
                  scale(${editorState.zoom})
                  rotate(${editorState.rotate}deg)
                `,
              }}
            />

            {/* Zoom Controls */}
            <div className="absolute bottom-5 right-5 flex items-center gap-2 px-3 py-2 rounded-2xl bg-zinc-950/90 border border-zinc-800 backdrop-blur-md shadow-xl">
              <button
                onClick={zoomOut}
                className="w-8 h-8 rounded-lg bg-zinc-900 hover:bg-zinc-800 flex items-center justify-center"
              >
                <Minus size={16} />
              </button>

              <button
                onClick={resetZoom}
                className="min-w-[60px] text-sm text-zinc-300 hover:text-white"
              >
                {Math.round(editorState.zoom * 100)}%
              </button>

              <button
                onClick={zoomIn}
                className="w-8 h-8 rounded-lg bg-zinc-900 hover:bg-zinc-800 flex items-center justify-center"
              >
                <Plus size={16} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CanvasEditor;
