// src/components/tools/TransformationTools.jsx

import { useState } from "react";
import {
  RotateCw,
  FlipHorizontal2,
  FlipVertical2,
  Crop as CropIcon,
  Maximize2,
  MoveHorizontal,
  MoveVertical,
  Layers,
  RefreshCw,
  CheckCheck,
  RotateCcw,
} from "lucide-react";
import { applyTransformation } from "../../api/imageApi";

// ─── Sub-komponen: slider dengan label ───────────────────────────────────────
function SliderRow({ label, value, min, max, step = 1, unit = "", accent = "blue", onChange }) {
  const colorMap = {
    blue:   "accent-blue-500",
    violet: "accent-violet-500",
    amber:  "accent-amber-500",
    teal:   "accent-teal-500",
  };
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between items-center">
        <span className="text-[10px] text-zinc-500 uppercase font-semibold tracking-wider">{label}</span>
        <span className={`text-xs font-mono text-${accent}-400`}>{value}{unit}</span>
      </div>
      <input
        type="range" min={min} max={max} step={step} value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className={`w-full h-1 bg-zinc-800 appearance-none cursor-pointer rounded-full ${colorMap[accent] ?? colorMap.blue}`}
      />
    </div>
  );
}

// ─── Sub-komponen: toggle button ─────────────────────────────────────────────
function ToggleBtn({ active, onClick, icon: Icon, label }) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border text-xs font-semibold transition-all duration-150 ${
        active
          ? "bg-blue-600/15 border-blue-500/60 text-blue-300 shadow-[0_0_12px_rgba(59,130,246,0.15)]"
          : "bg-zinc-900 border-zinc-800 text-zinc-500 hover:text-zinc-300 hover:border-zinc-700"
      }`}
    >
      <Icon size={16} />
      <span className="text-[10px]">{label}</span>
    </button>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function TransformationTools({
  editorState,
  setEditorState,
  bakedState,
  setBakedState,
  image,
  setImage,
  isProcessing,
  setIsProcessing,
  imgRef,
  // ✅ Crop state diangkat dari editor.jsx
  cropState,
  setCropState,
}) {
  const [error, setError]         = useState(null);
  const [success, setSuccess]     = useState(false);
  const [interp, setInterp]       = useState("bilinear");

  // Crop — gunakan state dari props (lifted)
  const cropActive = cropState?.active ?? false;
  const cropRect   = cropState?.rect   ?? { x: 0, y: 0, width: 0, height: 0 };

  const setCropActive = (active) =>
    setCropState((prev) => ({ ...prev, active, rect: active ? prev.rect : { x: 0, y: 0, width: 0, height: 0 } }));

  const setCropRect = (rect) =>
    setCropState((prev) => ({ ...prev, rect: typeof rect === "function" ? rect(prev.rect) : rect }));

  // Resize - hubungkan ke editorState
  const val = (key, fallback = 0) => editorState[key] ?? fallback;

  const scaleX = val("scaleX", 1.0);
  const scaleY = val("scaleY", 1.0);
  const [lockAspect, setLockAspect] = useState(true);

  const update = (key, value) =>
    setEditorState((prev) => ({ ...prev, [key]: value }));

  const updateScale = (x, y) => {
    setEditorState((prev) => ({
      ...prev,
      scaleX: x,
      scaleY: y,
    }));
  };

  // ─── Apply all → backend ─────────────────────────────────────────────────
  const handleApplyAll = async () => {
    if (!image) return;
    setIsProcessing(true);
    setError(null);
    setSuccess(false);

    try {
      // Hitung parameter selisih dibanding apa yang sudah di-bake sebelumnya
      const params = {
        rotate:           val("rotate") - (bakedState?.rotate ?? 0),
        expand_canvas:    true,
        flip_horizontal:  val("flipHorizontal", false) !== (bakedState?.flipHorizontal ?? false),
        flip_vertical:    val("flipVertical",   false) !== (bakedState?.flipVertical ?? false),
        scale_x:          val("scaleX", 1.0) / (bakedState?.scaleX ?? 1.0),
        scale_y:          val("scaleY", 1.0) / (bakedState?.scaleY ?? 1.0),
        translate_x:      val("translateX") - (bakedState?.translateX ?? 0),
        translate_y:      val("translateY") - (bakedState?.translateY ?? 0),
        crop:             (cropActive && cropRect.width > 0 && cropRect.height > 0)
                            ? cropRect
                            : null,
        interpolation:    interp,
      };

      const result = await applyTransformation(image.preview, params);

      if (result.success) {
        setImage((prev) => ({ ...prev, preview: result.image }));
        
        // Tandai transform state saat ini sebagai yang sudah sukses di-bake
        setBakedState((prev) => ({
          ...prev,
          rotate:         editorState.rotate,
          translateX:     editorState.translateX,
          translateY:     editorState.translateY,
          flipHorizontal: editorState.flipHorizontal,
          flipVertical:   editorState.flipVertical,
          scaleX:         editorState.scaleX ?? 1.0,
          scaleY:         editorState.scaleY ?? 1.0,
        }));

        setCropState({ active: false, rect: { x: 0, y: 0, width: 0, height: 0 } });
        setSuccess(true);
        setTimeout(() => setSuccess(false), 2500);
      } else {
        setError(result.message || "Gagal memproses gambar");
      }
    } catch (err) {
      setError("Tidak dapat terhubung ke server. Pastikan backend berjalan.");
      console.error("Transformation error:", err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReset = () => {
    setEditorState((prev) => ({
      ...prev,
      rotate:         0,
      translateX:     0,
      translateY:     0,
      flipHorizontal: false,
      flipVertical:   false,
      scaleX:         1.0,
      scaleY:         1.0,
    }));
    setBakedState((prev) => ({
      ...prev,
      rotate:         0,
      translateX:     0,
      translateY:     0,
      flipHorizontal: false,
      flipVertical:   false,
      scaleX:         1.0,
      scaleY:         1.0,
    }));
    setCropState({ active: false, rect: { x: 0, y: 0, width: 0, height: 0 } });
    setError(null);
  };

  return (
    <div className="space-y-7 animate-in fade-in slide-in-from-right-4 duration-300 pb-10">

      {/* ── ROTATE ── */}
      <section className="space-y-3">
        <div className="flex items-center gap-2 mb-1">
          <RotateCw size={13} className="text-blue-400" />
          <span className="text-[10px] text-zinc-400 uppercase font-bold tracking-widest">Rotate</span>
        </div>
        <SliderRow
          label="Angle" value={val("rotate")} min={0} max={360} unit="°" accent="blue"
          onChange={(v) => update("rotate", v)}
        />
        {/* Quick-step buttons */}
        <div className="grid grid-cols-4 gap-1.5">
          {[0, 90, 180, 270].map((deg) => (
            <button
              key={deg}
              onClick={() => update("rotate", deg)}
              className={`py-1.5 rounded-lg text-[10px] font-bold border transition ${
                val("rotate") === deg
                  ? "bg-blue-600/20 border-blue-500 text-blue-300"
                  : "bg-zinc-900 border-zinc-800 text-zinc-500 hover:text-zinc-300"
              }`}
            >
              {deg}°
            </button>
          ))}
        </div>
      </section>

      <div className="h-px bg-zinc-800/60" />

      {/* ── FLIP ── */}
      <section className="space-y-3">
        <div className="flex items-center gap-2 mb-1">
          <Layers size={13} className="text-violet-400" />
          <span className="text-[10px] text-zinc-400 uppercase font-bold tracking-widest">Flip</span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <ToggleBtn
            active={val("flipHorizontal", false)}
            onClick={() => update("flipHorizontal", !val("flipHorizontal", false))}
            icon={FlipHorizontal2}
            label="Horizontal"
          />
          <ToggleBtn
            active={val("flipVertical", false)}
            onClick={() => update("flipVertical", !val("flipVertical", false))}
            icon={FlipVertical2}
            label="Vertical"
          />
        </div>
      </section>

      <div className="h-px bg-zinc-800/60" />

      {/* ── RESIZE / SCALE ── */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Maximize2 size={13} className="text-teal-400" />
            <span className="text-[10px] text-zinc-400 uppercase font-bold tracking-widest">Resize</span>
          </div>
          {/* Lock aspect ratio */}
          <button
            onClick={() => setLockAspect(!lockAspect)}
            className={`flex items-center gap-1.5 text-[10px] px-2 py-1 rounded-md border transition ${
              lockAspect
                ? "border-teal-500/60 text-teal-400 bg-teal-500/10"
                : "border-zinc-700 text-zinc-500 hover:text-zinc-300"
            }`}
          >
            {lockAspect ? "🔗" : "🔓"} Aspect
          </button>
        </div>

        <SliderRow
          label="Scale X" value={scaleX} min={0.1} max={4} step={0.05} unit="×" accent="teal"
          onChange={(v) => {
            if (lockAspect) {
              updateScale(v, v);
            } else {
              updateScale(v, scaleY);
            }
          }}
        />
        <SliderRow
          label="Scale Y" value={scaleY} min={0.1} max={4} step={0.05} unit="×" accent="teal"
          onChange={(v) => {
            if (lockAspect) {
              updateScale(v, v);
            } else {
              updateScale(scaleX, v);
            }
          }}
        />

        {/* Preset scale buttons */}
        <div className="grid grid-cols-4 gap-1.5">
          {[0.25, 0.5, 1.0, 2.0].map((s) => (
            <button
              key={s}
              onClick={() => updateScale(s, s)}
              className={`py-1.5 rounded-lg text-[10px] font-bold border transition ${
                scaleX === s && scaleY === s
                  ? "bg-teal-600/20 border-teal-500 text-teal-300"
                  : "bg-zinc-900 border-zinc-800 text-zinc-500 hover:text-zinc-300"
              }`}
            >
              {s === 1.0 ? "1×" : `${s}×`}
            </button>
          ))}
        </div>
      </section>

      <div className="h-px bg-zinc-800/60" />

      {/* ── TRANSLATION ── */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 mb-1">
          <MoveHorizontal size={13} className="text-amber-400" />
          <span className="text-[10px] text-zinc-400 uppercase font-bold tracking-widest">Translation</span>
        </div>
        <SliderRow
          label="X Offset" value={val("translateX")} min={-500} max={500} unit="px" accent="amber"
          onChange={(v) => update("translateX", v)}
        />
        <SliderRow
          label="Y Offset" value={val("translateY")} min={-500} max={500} unit="px" accent="amber"
          onChange={(v) => update("translateY", v)}
        />
      </section>

      <div className="h-px bg-zinc-800/60" />

      {/* ── CROP ── */}
      <section className="space-y-3">
        <div className="flex items-center gap-2 mb-1">
          <CropIcon size={13} className="text-rose-400" />
          <span className="text-[10px] text-zinc-400 uppercase font-bold tracking-widest">Crop</span>
        </div>

        {/* Enable / disable crop mode */}
        <button
          onClick={() => {
            setCropActive(!cropActive);
            if (cropActive) setCropRect({ x: 0, y: 0, width: 0, height: 0 });
          }}
          className={`w-full flex items-center gap-3 p-3 rounded-xl border text-sm font-semibold transition-all duration-200 ${
            cropActive
              ? "bg-rose-500/10 border-rose-500/60 text-rose-300 shadow-[0_0_16px_rgba(244,63,94,0.12)]"
              : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200"
          }`}
        >
          <CropIcon size={16} />
          {cropActive ? "Drag on canvas to crop…" : "Enable Crop Mode"}
          {cropActive && cropRect.width > 0 && (
            <span className="ml-auto text-[10px] font-mono text-rose-300">
              {cropRect.width}×{cropRect.height}
            </span>
          )}
        </button>

        {/* Manual crop inputs */}
        {cropActive && (
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: "X", key: "x"      },
              { label: "Y", key: "y"      },
              { label: "W", key: "width"  },
              { label: "H", key: "height" },
            ].map(({ label, key }) => (
              <div key={key}>
                <label className="text-[10px] text-zinc-500 uppercase mb-1 block">{label}</label>
                <input
                  type="number"
                  min={0}
                  value={cropRect[key]}
                  onChange={(e) => setCropRect((prev) => ({ ...prev, [key]: Number(e.target.value) }))}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-2 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-rose-500"
                />
              </div>
            ))}
          </div>
        )}
      </section>

      <div className="h-px bg-zinc-800/60" />

      {/* ── INTERPOLATION ── */}
      <section className="space-y-2">
        <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest block">Interpolation</span>
        <div className="grid grid-cols-3 gap-1.5">
          {["nearest", "bilinear", "bicubic"].map((m) => (
            <button
              key={m}
              onClick={() => setInterp(m)}
              className={`py-2 rounded-xl border text-[10px] font-bold uppercase transition ${
                interp === m
                  ? "bg-blue-600/20 border-blue-500/60 text-blue-300"
                  : "bg-zinc-900 border-zinc-800 text-zinc-500 hover:text-zinc-300"
              }`}
            >
              {m === "nearest" ? "Near." : m === "bilinear" ? "Bilin." : "Bicub."}
            </button>
          ))}
        </div>
      </section>

      {/* ── Error / Success ── */}
      {error && (
        <p className="text-xs text-red-400 bg-red-900/20 border border-red-800/60 rounded-xl p-3">
          {error}
        </p>
      )}
      {success && (
        <div className="flex items-center gap-2 text-xs text-emerald-400 bg-emerald-900/20 border border-emerald-800/60 rounded-xl p-3">
          <CheckCheck size={14} />
          Transformation applied successfully!
        </div>
      )}

      {/* ── Actions ── */}
      <div className="pt-1 space-y-2">
        <button
          onClick={handleApplyAll}
          disabled={!image || isProcessing}
          className="w-full py-3 bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all duration-200 shadow-lg shadow-blue-900/30"
        >
          {isProcessing ? (
            <span className="flex items-center justify-center gap-2">
              <RefreshCw size={13} className="animate-spin" /> Processing…
            </span>
          ) : (
            "Apply Transformation"
          )}
        </button>

        <button
          onClick={handleReset}
          disabled={isProcessing}
          className="w-full py-2.5 bg-transparent border border-zinc-800 text-zinc-500 hover:text-zinc-300 hover:border-zinc-700 disabled:opacity-40 disabled:cursor-not-allowed text-xs font-bold uppercase rounded-xl transition"
        >
          <span className="flex items-center justify-center gap-2">
            <RotateCcw size={12} /> Reset All
          </span>
        </button>
      </div>
    </div>
  );
}
