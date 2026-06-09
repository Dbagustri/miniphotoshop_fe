// src/components/tools/ColorProcessingTools.jsx

import { useState } from "react";
import { flattenImageToBase64, buildCssFilter, resetCssFilterState } from "../../utils/imageUtils";
import { applyColorProcessing } from "../../api/imageApi";

export default function ColorProcessingTools({
  image,
  setImage,
  isProcessing,
  setIsProcessing,
  editorState,
  setEditorState,
  bakedState,
  setBakedState,
  imgRef,
}) {
  const [mode, setMode] = useState("grayscale");
  const [error, setError] = useState(null);

  const updateValue = (key, value) => {
    setEditorState((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleApply = async () => {
    if (!image) return;

    setIsProcessing(true);
    setError(null);

    try {
      // Hitung parameter selisih dibanding apa yang sudah di-bake sebelumnya
      const params = {
        mode: mode, // "grayscale" | "adjustment"
        hue: Number(editorState.hue) - (bakedState?.hue ?? 0),
        saturation: Number(editorState.saturation) - (bakedState?.saturation ?? 100) + 100,
        channel: "R" // default channel
      };

      // Kirim ke backend
      const result = await applyColorProcessing(image.preview, params);

      if (result.success) {
        // Update preview dengan hasil dari backend
        setImage((prev) => ({ ...prev, preview: result.image }));
        
        // Tandai filter saat ini sebagai filter yang sudah sukses di-bake
        setBakedState((prev) => ({
          ...prev,
          grayscale: editorState.grayscale,
          hue: editorState.hue,
          saturation: editorState.saturation,
        }));
      } else {
        setError(result.message || "Gagal memproses gambar");
      }
    } catch (err) {
      setError("Tidak dapat terhubung ke server. Pastikan backend berjalan.");
      console.error("Color Processing error:", err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReset = () => {
    // Reset local parameter ke default (Reset per bagian)
    setEditorState((prev) => ({
      ...prev,
      grayscale: false,
      hue: 0,
      saturation: 100,
    }));
    setBakedState((prev) => ({
      ...prev,
      grayscale: false,
      hue: 0,
      saturation: 100,
    }));
    setError(null);
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
      {/* Mode */}
      <div>
        <label className="text-xs text-zinc-400 font-medium uppercase tracking-wider mb-3 block">
          Mode
        </label>

        <div className="space-y-2">
          {[
            {
              id: "grayscale",
              label: "Grayscale",
            },
            {
              id: "adjustment",
              label: "Color Adjustment",
            },
          ].map((item) => (
            <label
              key={item.id}
              className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition ${
                mode === item.id
                  ? "bg-blue-600/10 border-blue-500"
                  : "bg-zinc-900/50 border-zinc-800 hover:bg-zinc-800"
              }`}
            >
              <input
                type="radio"
                checked={mode === item.id}
                onChange={() => setMode(item.id)}
                className="accent-blue-500"
              />

              <span className="text-sm text-zinc-300">{item.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Grayscale */}
      {mode === "grayscale" && (
        <label className="flex items-center justify-between p-4 rounded-lg bg-zinc-900 border border-zinc-800 cursor-pointer hover:bg-zinc-800/80 transition">
          <span className="text-sm text-zinc-300">Enable Grayscale</span>

          <input
            type="checkbox"
            checked={editorState.grayscale}
            onChange={(e) => updateValue("grayscale", e.target.checked)}
            className="w-4 h-4 accent-blue-500"
          />
        </label>
      )}

      {/* Color Adjustment */}
      {mode === "adjustment" && (
        <div className="space-y-5">
          <Slider
            label="Hue"
            value={editorState.hue}
            min={-180}
            max={180}
            onChange={(value) => updateValue("hue", value)}
          />

          <Slider
            label="Saturation"
            value={editorState.saturation}
            min={0}
            max={200}
            onChange={(value) => updateValue("saturation", value)}
          />
        </div>
      )}

      {/* Error message */}
      {error && (
        <p className="text-xs text-red-400 bg-red-900/20 border border-red-800 rounded-lg p-3">
          {error}
        </p>
      )}

      {/* Buttons */}
      <div className="pt-4 space-y-2">
        <button
          onClick={handleApply}
          disabled={!image || isProcessing}
          className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold uppercase rounded-lg transition cursor-pointer"
        >
          {isProcessing ? "Processing..." : "Apply"}
        </button>

        <button
          onClick={handleReset}
          disabled={isProcessing}
          className="w-full py-2.5 bg-transparent border border-zinc-800 text-zinc-500 hover:text-zinc-300 disabled:opacity-40 disabled:cursor-not-allowed text-xs font-bold uppercase rounded-lg transition cursor-pointer"
        >
          Reset
        </button>
      </div>
    </div>
  );
}

function Slider({ label, value, min, max, step = 1, onChange }) {
  return (
    <div>
      <div className="flex justify-between items-center mb-2">
        <label className="text-xs text-zinc-400 font-medium uppercase tracking-wider">
          {label}
        </label>

        <span className="text-[10px] bg-zinc-800 px-1.5 py-0.5 rounded text-zinc-300">
          {value}
        </span>
      </div>

      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-1 bg-zinc-800 appearance-none accent-blue-500 cursor-pointer"
      />
    </div>
  );
}
