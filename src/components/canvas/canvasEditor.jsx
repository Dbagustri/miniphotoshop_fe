// src/components/canvas/CanvasEditor.jsx

import {
  UploadCloud,
  ImageIcon,
  MousePointer2,
  Minus,
  Plus,
  SplitSquareHorizontal,
  X,
} from "lucide-react";

import { useRef, useState, useCallback } from "react";

// ============================================================
// BEFORE / AFTER PANEL — ditampilkan di samping canvas
// ============================================================
function BeforeAfterPanel({ image, onClose }) {
  const [sliderX, setSliderX] = useState(50);
  const containerRef = useRef(null);
  const isDragging = useRef(false);

  const handleMouseMove = (e) => {
    if (!isDragging.current || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    setSliderX(Math.min(Math.max(x, 2), 98));
  };

  const handleTouchMove = (e) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = ((e.touches[0].clientX - rect.left) / rect.width) * 100;
    setSliderX(Math.min(Math.max(x, 2), 98));
  };

  const isSame = image?.original === image?.preview;

  return (
    <div
      className="flex flex-col h-full border-l border-zinc-800 bg-zinc-950"
      style={{ width: "320px", minWidth: "280px", maxWidth: "360px" }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800 shrink-0">
        <div className="flex items-center gap-2">
          <SplitSquareHorizontal size={14} className="text-blue-400" />
          <span className="text-[11px] font-bold uppercase tracking-[0.15em] text-zinc-300">
            Before / After
          </span>
        </div>
        <button
          onClick={onClose}
          className="w-6 h-6 rounded-md flex items-center justify-center text-zinc-600 hover:text-zinc-300 hover:bg-zinc-800 transition"
        >
          <X size={13} />
        </button>
      </div>

      {/* Preview Area */}
      <div className="flex-1 min-h-0 p-3">
        {!image?.original || !image?.preview ? (
          <div className="w-full h-full flex flex-col items-center justify-center text-zinc-700 gap-2 border border-dashed border-zinc-800 rounded-xl">
            <ImageIcon size={22} className="opacity-40" />
            <span className="text-[10px] uppercase tracking-wider text-center px-4">
              Upload gambar untuk preview
            </span>
          </div>
        ) : isSame ? (
          <div className="w-full h-full flex flex-col items-center justify-center text-zinc-700 gap-3 border border-dashed border-zinc-800 rounded-xl">
            <SplitSquareHorizontal size={22} className="opacity-40" />
            <span className="text-[10px] uppercase tracking-wider text-center px-4 leading-relaxed">
              Apply operasi ke gambar<br />untuk melihat perbandingan
            </span>
          </div>
        ) : (
          <div
            ref={containerRef}
            className="relative w-full h-full rounded-xl overflow-hidden select-none cursor-col-resize border border-zinc-800 bg-zinc-900"
            onMouseMove={handleMouseMove}
            onMouseUp={() => (isDragging.current = false)}
            onMouseLeave={() => (isDragging.current = false)}
            onTouchMove={handleTouchMove}
            onTouchEnd={() => (isDragging.current = false)}
          >
            {/* AFTER (full width, background) */}
            <img
              src={image.preview}
              alt="after"
              className="absolute inset-0 w-full h-full object-contain"
              draggable={false}
            />

            {/* BEFORE (clipped to left of slider) */}
            <div
              className="absolute inset-0 overflow-hidden"
              style={{ width: `${sliderX}%` }}
            >
              <img
                src={image.original}
                alt="before"
                className="absolute inset-0 h-full object-contain"
                style={{ width: `${100 / (sliderX / 100)}%`, maxWidth: "none" }}
                draggable={false}
              />
            </div>

            {/* Divider line */}
            <div
              className="absolute top-0 bottom-0 w-0.5 bg-white shadow-[0_0_8px_rgba(255,255,255,0.8)] z-20"
              style={{ left: `${sliderX}%` }}
            />

            {/* Drag handle */}
            <div
              className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 z-30 w-7 h-7 rounded-full bg-white shadow-xl flex items-center justify-center cursor-col-resize"
              style={{ left: `${sliderX}%` }}
              onMouseDown={() => (isDragging.current = true)}
              onTouchStart={() => (isDragging.current = true)}
            >
              <SplitSquareHorizontal size={14} className="text-zinc-800" />
            </div>

            {/* Labels */}
            <div className="absolute top-2 left-2 z-10 px-2 py-0.5 rounded-md bg-black/60 backdrop-blur-sm text-[10px] text-zinc-300 font-semibold uppercase tracking-wider">
              Before
            </div>
            <div className="absolute top-2 right-2 z-10 px-2 py-0.5 rounded-md bg-black/60 backdrop-blur-sm text-[10px] text-zinc-300 font-semibold uppercase tracking-wider">
              After
            </div>
          </div>
        )}
      </div>

      {/* Footer hint */}
      {!isSame && image?.original && image?.preview && (
        <div className="px-4 py-2 border-t border-zinc-800 shrink-0">
          <p className="text-[10px] text-zinc-600 text-center">Drag slider untuk membandingkan</p>
        </div>
      )}
    </div>
  );
}

// ============================================================
// CANVAS EDITOR
// ============================================================
function CanvasEditor({
  image,
  setImage,
  imgRef,
  showBefore,
  editorState,
  setEditorState,
  setImageInfo,
  isProcessing,
  onUpload,
  // ✅ Crop state diangkat dari editor.jsx agar berbagi dengan TransformationTools
  cropState,
  setCropState,
}) {
  const containerRef = useRef(null);

  const [isDragging, setIsDragging] = useState(false);
  const [showBeforeAfterPanel, setShowBeforeAfterPanel] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // Ref untuk origin drag crop (dalam koordinat layar, relative ke container)
  const cropDragOrigin = useRef(null);

  const cropActive = cropState?.active ?? false;
  const cropRect   = cropState?.rect   ?? { x: 0, y: 0, width: 0, height: 0 };

  const currentImage = showBefore ? image?.original : image?.preview;

  const canDrag = editorState.zoom > 1;

  // ======================
  // IMAGE UPLOAD
  // ======================

  const handleUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    onUpload(file);   // ✅ delegasikan ke handler di editor.jsx
  };

  // ======================
  // DRAG IMAGE / CROP DRAG
  // ======================

  // Helper: konversi koordinat layar → koordinat pixel gambar asli
  const screenToImageCoords = useCallback((clientX, clientY) => {
    if (!imgRef?.current) return null;
    const imgEl  = imgRef.current;
    const rect   = imgEl.getBoundingClientRect();
    const scaleW = imgEl.naturalWidth  / rect.width;
    const scaleH = imgEl.naturalHeight / rect.height;
    const relX   = Math.max(0, Math.min(clientX - rect.left, rect.width));
    const relY   = Math.max(0, Math.min(clientY - rect.top,  rect.height));
    return {
      imgX: Math.round(relX * scaleW),
      imgY: Math.round(relY * scaleH),
      // Juga simpan koordinat layar untuk overlay visual
      screenX: clientX - rect.left,
      screenY: clientY - rect.top,
    };
  }, [imgRef]);

  const handleMouseDown = (e) => {
    if (cropActive) {
      // Mulai crop drag — simpan titik awal dalam koordinat gambar
      const coords = screenToImageCoords(e.clientX, e.clientY);
      if (!coords) return;
      cropDragOrigin.current = coords;
      setCropState({ active: true, rect: { x: coords.imgX, y: coords.imgY, width: 0, height: 0 } });
      e.preventDefault();
      return;
    }
    if (!canDrag) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - editorState.translateX, y: e.clientY - editorState.translateY });
  };

  const handleMouseMove = (e) => {
    if (cropActive && cropDragOrigin.current) {
      const coords = screenToImageCoords(e.clientX, e.clientY);
      if (!coords) return;
      const ox = cropDragOrigin.current.imgX;
      const oy = cropDragOrigin.current.imgY;
      setCropState({
        active: true,
        rect: {
          x:      Math.min(coords.imgX, ox),
          y:      Math.min(coords.imgY, oy),
          width:  Math.abs(coords.imgX - ox),
          height: Math.abs(coords.imgY - oy),
        },
      });
      e.preventDefault();
      return;
    }
    if (!isDragging) return;
    setEditorState((prev) => ({
      ...prev,
      translateX: e.clientX - dragStart.x,
      translateY: e.clientY - dragStart.y,
    }));
  };

  const stopDragging = () => {
    setIsDragging(false);
    cropDragOrigin.current = null;
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
      return { ...prev, zoom: Number(nextZoom.toFixed(2)) };
    });
  };

  // ======================
  // BUTTON ZOOM
  // ======================

  const zoomIn = () => {
    setEditorState((prev) => ({ ...prev, zoom: Math.min(prev.zoom + 0.1, 5) }));
  };

  const zoomOut = () => {
    setEditorState((prev) => ({ ...prev, zoom: Math.max(prev.zoom - 0.1, 0.5) }));
  };

  const resetZoom = () => {
    setEditorState((prev) => ({ ...prev, zoom: 1, translateX: 0, translateY: 0 }));
  };

  // ======================
  // SEED POINT (Segmentation)
  // ======================

  const handleClick = (e) => {
    // Seed point untuk segmentation (hanya saat crop tidak aktif)
    if (!cropActive) {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      setEditorState((prev) => ({
        ...prev,
        segmentation: {
          ...prev.segmentation,
          seedPoint: { x: Math.round(x), y: Math.round(y) },
        },
      }));
    }
  };

  // ── Hitung posisi + ukuran overlay crop dalam koordinat layar ──────────────
  const computeCropOverlay = () => {
    if (!imgRef?.current || !cropActive || cropRect.width < 2 || cropRect.height < 2) return null;
    const imgEl  = imgRef.current;
    const rect   = imgEl.getBoundingClientRect();
    const scaleW = rect.width  / imgEl.naturalWidth;
    const scaleH = rect.height / imgEl.naturalHeight;
    // Posisi relatif terhadap container (bukan imgEl)
    const containerRect = containerRef.current?.getBoundingClientRect();
    if (!containerRect) return null;
    const offsetX = rect.left - containerRect.left;
    const offsetY = rect.top  - containerRect.top;
    return {
      left:   offsetX + cropRect.x * scaleW,
      top:    offsetY + cropRect.y * scaleH,
      width:  cropRect.width  * scaleW,
      height: cropRect.height * scaleH,
    };
  };
  const cropOverlay = computeCropOverlay();

  return (
    <div className="w-full h-full flex overflow-hidden">
      {/* ── MAIN CANVAS AREA ── */}
      <div
        ref={containerRef}
        onWheel={handleWheel}
        onMouseMove={handleMouseMove}
        onMouseUp={stopDragging}
        onMouseLeave={stopDragging}
        className="flex-1 flex items-center justify-center relative overflow-hidden"
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
            <div className="relative w-full h-full bg-zinc-950 shadow-[0_0_80px_rgba(0,0,0,0.4)] overflow-hidden flex items-center justify-center">
              <img
                ref={imgRef}
                src={currentImage}
                alt="preview"
                draggable={false}
                onMouseDown={handleMouseDown}
                onClick={handleClick}
                className={`
                  object-contain
                  max-w-full
                  max-h-full
                  select-none
                  transition-transform
                  duration-100
                  ease-out
                  ${
                    cropActive
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

              {/* ── Crop overlay visual — ditampilkan saat crop aktif ── */}
              {cropOverlay && (
                <>
                  {/* Dim area di luar crop */}
                  <div
                    className="absolute inset-0 pointer-events-none z-20"
                    style={{ background: "rgba(0,0,0,0.45)" }}
                  />
                  {/* Kotak crop — "cut out" dari dim menggunakan outline/box-shadow */}
                  <div
                    className="absolute pointer-events-none z-20"
                    style={{
                      left:      cropOverlay.left,
                      top:       cropOverlay.top,
                      width:     cropOverlay.width,
                      height:    cropOverlay.height,
                      background: "transparent",
                      boxShadow:  "0 0 0 9999px rgba(0,0,0,0.45)",
                      border:     "2px solid rgba(244,63,94,0.95)",
                      outline:    "1px solid rgba(255,255,255,0.15)",
                    }}
                  >
                    {/* Corner handles */}
                    {[["top-0 left-0","-translate-x-1/2 -translate-y-1/2"],["top-0 right-0","translate-x-1/2 -translate-y-1/2"],["bottom-0 left-0","-translate-x-1/2 translate-y-1/2"],["bottom-0 right-0","translate-x-1/2 translate-y-1/2"]].map(([pos, tr], i) => (
                      <div key={i} className={`absolute ${pos} w-3 h-3 bg-rose-400 rounded-sm border border-white/50 transform ${tr}`} />
                    ))}
                    {/* Rule-of-thirds lines */}
                    <div className="absolute inset-0 pointer-events-none" style={{ borderLeft: "1px solid rgba(255,255,255,0.15)", borderRight: "1px solid rgba(255,255,255,0.15)", left: "33.3%", right: "33.3%" }} />
                    <div className="absolute inset-0 pointer-events-none" style={{ borderTop: "1px solid rgba(255,255,255,0.15)", borderBottom: "1px solid rgba(255,255,255,0.15)", top: "33.3%", bottom: "33.3%" }} />
                    {/* Size badge */}
                    <div className="absolute bottom-1 right-1 bg-black/70 text-rose-300 text-[9px] font-mono px-1.5 py-0.5 rounded">
                      {cropRect.width}×{cropRect.height}
                    </div>
                  </div>
                </>
              )}

              {/* Badge crop mode aktif */}
              {cropActive && (
                <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2 bg-rose-600/90 backdrop-blur-md text-white text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-full shadow-lg">
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                  Crop Mode — Drag to select area
                </div>
              )}

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

              {/* Before/After Toggle Button */}
              <button
                onClick={() => setShowBeforeAfterPanel((v) => !v)}
                className={`
                  absolute bottom-5 left-5 flex items-center gap-2 px-3 py-2 rounded-2xl
                  border backdrop-blur-md shadow-xl text-xs font-semibold transition-all duration-200
                  ${showBeforeAfterPanel
                    ? "bg-blue-600/20 border-blue-500 text-blue-400 shadow-blue-900/40"
                    : "bg-zinc-950/90 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700"
                  }
                `}
              >
                <SplitSquareHorizontal size={14} />
                Before / After
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── BEFORE / AFTER SIDE PANEL ── */}
      {image && showBeforeAfterPanel && (
        <BeforeAfterPanel
          image={image}
          onClose={() => setShowBeforeAfterPanel(false)}
        />
      )}
    </div>
  );
}

export default CanvasEditor;
