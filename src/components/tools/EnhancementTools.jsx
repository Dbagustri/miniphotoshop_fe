// src/components/tools/EnhancementTools.jsx

import { useState, useEffect } from "react";
import {
  flattenImageToBase64,
  buildCssFilter,
  resetCssFilterState,
} from "../../utils/imageUtils";
import { applyEnhancement } from "../../api/imageApi";

export default function EnhancementTools({
  editorState,
  setEditorState,
  bakedState,
  setBakedState,
  // ✅ Props backend (dikirim dari PropertiesPanel via backendToolProps)
  image,
  setImage,
  isProcessing,
  setIsProcessing,
  imgRef,
}) {
  const [error, setError] = useState(null);
  const [backupImage, setBackupImage] = useState(null);

  useEffect(() => {
    setBackupImage(null);
  }, [image?.original]);

  const sliderConfig = [
    {
      key: "brightness",
      label: "Brightness",
      min: 0,
      max: 200,
      suffix: "%",
    },
    {
      key: "contrast",
      label: "Contrast",
      min: 0,
      max: 200,
      suffix: "%",
    },
    {
      key: "sharpen",
      label: "Sharpen",
      min: 0,
      max: 10,
      suffix: "",
    },
    {
      key: "blur",
      label: "Blur",
      min: 0,
      max: 10,
      suffix: "px",
    },
  ];

  const updateValue = (key, value) => {
    setEditorState((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const resetEnhancement = () => {
    if (backupImage) {
      setImage((prev) => ({ ...prev, preview: backupImage }));
    }
    setEditorState((prev) => ({
      ...prev,
      brightness: 100,
      contrast: 100,
      sharpen: 0,
      blur: 0,
      histogramEq: false,
    }));
    setBakedState((prev) => ({
      ...prev,
      brightness: 100,
      contrast: 100,
      sharpen: 0,
      blur: 0,
      histogramEq: false,
    }));
    setBackupImage(null);
    setError(null);
  };

  // ✅ Handler Apply All: send absolute parameters based on cached backup image to prevent clipping loss
  const handleApplyAll = async () => {
    if (!image) return;

    setIsProcessing(true);
    setError(null);

    try {
      let currentBackup = backupImage;
      if (!currentBackup) {
        currentBackup = image.preview;
        setBackupImage(image.preview);
      }

      // Kirim absolute parameters ke backend
      const params = {
        brightness: editorState.brightness,
        contrast: editorState.contrast,
        sharpen: editorState.sharpen,
        blur: editorState.blur,
        histogram_eq: editorState.histogramEq,
      };

      // Kirim ke backend menggunakan currentBackup sebagai source
      const result = await applyEnhancement(currentBackup, params);

      if (result.success) {
        // Update preview dengan hasil dari backend
        setImage((prev) => ({ ...prev, preview: result.image }));

        // Tandai filter saat ini sebagai filter yang sudah sukses di-bake
        setBakedState((prev) => ({
          ...prev,
          brightness: editorState.brightness,
          contrast: editorState.contrast,
          sharpen: editorState.sharpen,
          blur: editorState.blur,
          histogramEq: editorState.histogramEq,
        }));
      } else {
        setError(result.message || "Gagal memproses gambar");
      }
    } catch (err) {
      setError("Tidak dapat terhubung ke server. Pastikan backend berjalan.");
      console.error("Enhancement error:", err);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
      {sliderConfig.map(({ key, label, min, max, suffix }) => (
        <div key={key}>
          <div className="flex justify-between items-center mb-2">
            <label className="text-xs text-zinc-400 font-medium uppercase tracking-wider">
              {label}
            </label>

            <span className="text-[10px] bg-zinc-800 px-1.5 py-0.5 rounded text-zinc-300">
              {editorState[key]}
              {suffix}
            </span>
          </div>

          <input
            type="range"
            min={min}
            max={max}
            value={editorState[key]}
            onChange={(e) => updateValue(key, Number(e.target.value))}
            className="w-full h-1 bg-zinc-800 appearance-none accent-blue-500 cursor-pointer"
          />
        </div>
      ))}

      {/* Histogram Equalization */}
      <label className="flex items-center gap-3 p-3 rounded-lg bg-zinc-900/50 border border-zinc-800 cursor-pointer hover:bg-zinc-800 transition">
        <input
          type="checkbox"
          checked={editorState.histogramEq || false}
          onChange={(e) => updateValue("histogramEq", e.target.checked)}
          className="w-4 h-4 rounded border-zinc-700 bg-zinc-800 text-blue-600"
        />

        <span className="text-sm text-zinc-300">Histogram Equalization</span>
      </label>

      {/* Error message */}
      {error && (
        <p className="text-xs text-red-400 bg-red-900/20 border border-red-800 rounded-lg p-3">
          {error}
        </p>
      )}

      {/* Actions */}
      <div className="pt-4 space-y-2">
        {/* ✅ Apply All sekarang terhubung ke handleApplyAll */}
        <button
          onClick={handleApplyAll}
          disabled={!image || isProcessing}
          className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold uppercase rounded-lg transition"
        >
          {isProcessing ? "Processing..." : "Apply All"}
        </button>

        <button
          onClick={resetEnhancement}
          disabled={isProcessing}
          className="w-full py-2.5 bg-transparent border border-zinc-800 text-zinc-500 hover:text-zinc-300 disabled:opacity-40 disabled:cursor-not-allowed text-xs font-bold uppercase rounded-lg transition"
        >
          Reset
        </button>
      </div>
    </div>
  );
}
