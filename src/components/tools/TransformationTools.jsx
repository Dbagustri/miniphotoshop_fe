// src/components/tools/TransformationTools.jsx

import {
  RotateCw,
  FlipHorizontal,
  FlipVertical,
  Crop as CropIcon,
  ZoomIn,
} from "lucide-react";

export default function TransformationTools({ editorState, setEditorState }) {
  const updateValue = (key, value) => {
    setEditorState((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const resetTransform = () => {
    setEditorState((prev) => ({
      ...prev,
      rotate: 0,
      zoom: 1,
      translateX: 0,
      translateY: 0,
      flipHorizontal: false,
      flipVertical: false,
    }));
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300 pb-10">
      {/* Rotate */}
      <section className="space-y-3">
        <div className="flex justify-between items-center">
          <label className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest flex items-center gap-2">
            <RotateCw size={14} />
            Rotate
          </label>

          <span className="text-xs text-blue-400 font-mono">
            {editorState.rotate}°
          </span>
        </div>

        <input
          type="range"
          min="0"
          max="360"
          value={editorState.rotate}
          onChange={(e) => updateValue("rotate", Number(e.target.value))}
          className="w-full h-1 bg-zinc-800 appearance-none accent-blue-500 cursor-pointer"
        />
      </section>

      {/* Zoom */}
      <section className="space-y-3">
        <div className="flex justify-between items-center">
          <label className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest flex items-center gap-2">
            <ZoomIn size={14} />
            Zoom
          </label>

          <span className="text-xs text-blue-400 font-mono">
            {editorState.zoom}x
          </span>
        </div>

        <input
          type="range"
          min="0.5"
          max="3"
          step="0.1"
          value={editorState.zoom}
          onChange={(e) => updateValue("zoom", Number(e.target.value))}
          className="w-full h-1 bg-zinc-800 appearance-none accent-blue-500 cursor-pointer"
        />
      </section>

      {/* Flip */}
      <section className="space-y-3">
        <label className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest">
          Flip
        </label>

        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() =>
              updateValue("flipHorizontal", !editorState.flipHorizontal)
            }
            className={`p-3 rounded-lg border transition ${
              editorState.flipHorizontal
                ? "bg-blue-600/10 border-blue-500 text-blue-400"
                : "bg-zinc-900 border-zinc-800 text-zinc-400"
            }`}
          >
            <FlipHorizontal size={16} className="mx-auto mb-1" />
            Horizontal
          </button>

          <button
            onClick={() =>
              updateValue("flipVertical", !editorState.flipVertical)
            }
            className={`p-3 rounded-lg border transition ${
              editorState.flipVertical
                ? "bg-blue-600/10 border-blue-500 text-blue-400"
                : "bg-zinc-900 border-zinc-800 text-zinc-400"
            }`}
          >
            <FlipVertical size={16} className="mx-auto mb-1" />
            Vertical
          </button>
        </div>
      </section>

      {/* Translation */}
      <section className="space-y-4">
        <label className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest">
          Translation
        </label>

        <div>
          <div className="flex justify-between mb-1">
            <span className="text-[10px] text-zinc-400">X Offset</span>

            <span className="text-[10px] text-zinc-600 font-mono">
              {editorState.translateX || 0}
              px
            </span>
          </div>

          <input
            type="range"
            min="-300"
            max="300"
            value={editorState.translateX || 0}
            onChange={(e) => updateValue("translateX", Number(e.target.value))}
            className="w-full h-1 bg-zinc-800 appearance-none accent-zinc-500"
          />
        </div>

        <div>
          <div className="flex justify-between mb-1">
            <span className="text-[10px] text-zinc-400">Y Offset</span>

            <span className="text-[10px] text-zinc-600 font-mono">
              {editorState.translateY || 0}
              px
            </span>
          </div>

          <input
            type="range"
            min="-300"
            max="300"
            value={editorState.translateY || 0}
            onChange={(e) => updateValue("translateY", Number(e.target.value))}
            className="w-full h-1 bg-zinc-800 appearance-none accent-zinc-500"
          />
        </div>
      </section>

      {/* Crop */}
      <section className="pt-2">
        <label className="flex items-center gap-3 p-3 rounded-xl bg-blue-600/5 border border-blue-500/20 cursor-pointer hover:bg-blue-600/10 transition group">
          <div className="p-2 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-500 group-hover:text-blue-400">
            <CropIcon size={18} />
          </div>

          <div className="flex flex-col">
            <span className="text-sm font-semibold text-zinc-200">
              Enable Crop Mode
            </span>
          </div>

          <input
            type="checkbox"
            checked={editorState.cropMode || false}
            onChange={(e) => updateValue("cropMode", e.target.checked)}
            className="ml-auto w-4 h-4 accent-blue-600"
          />
        </label>
      </section>

      {/* Actions */}
      <div className="pt-6 space-y-2">
        <button
          onClick={resetTransform}
          className="w-full py-2.5 bg-transparent border border-zinc-800 text-zinc-500 hover:text-zinc-300 text-xs font-bold uppercase rounded-lg transition"
        >
          Reset
        </button>
      </div>
    </div>
  );
}
