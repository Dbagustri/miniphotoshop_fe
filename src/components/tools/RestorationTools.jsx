// src/components/tools/RestorationTools.jsx

import { useState, useEffect } from "react";
import {
  flattenImageToBase64,
  buildCssFilter,
  resetCssFilterState,
} from "../../utils/imageUtils";
import { applyRestoration } from "../../api/imageApi";

export default function RestorationTools({
  image,
  setImage,
  isProcessing,
  setIsProcessing,
  editorState,
  setEditorState,
  imgRef,
}) {
  const [selectedFilter, setSelectedFilter] = useState("gaussian");
  const [kernelSize, setKernelSize] = useState(3);
  const [sigma, setSigma] = useState(1.5);
  const [intensity, setIntensity] = useState(50);
  const [error, setError] = useState(null);
  const [backupImage, setBackupImage] = useState(null);
  const [lastAppliedOperation, setLastAppliedOperation] = useState(null);

  useEffect(() => {
    setBackupImage(null);
    setLastAppliedOperation(null);
  }, [image?.original]);

  const handleApply = async () => {
    if (!image || !imgRef?.current) return;

    setIsProcessing(true);
    setError(null);

    try {
      // 1. Bake CSS filter ke gambar sebelum dikirim ke backend
      const flatBase64 = flattenImageToBase64(
        imgRef.current,
        buildCssFilter(editorState),
      );
      let currentBackup = backupImage;
      if (selectedFilter !== lastAppliedOperation) {
        currentBackup = flatBase64;
        setBackupImage(flatBase64);
        setLastAppliedOperation(selectedFilter);
      }

      // 2. Kirim ke backend
      const result = await applyRestoration(currentBackup, {
        filter: selectedFilter,
        kernel_size: Number(kernelSize),
        sigma: Number(sigma),
        intensity: Number(intensity),
      });

      if (result.success) {
        // 3. Update preview dengan hasil dari backend
        setImage((prev) => ({ ...prev, preview: result.image }));
        // 4. Reset CSS filter (sudah ter-bake)
        resetCssFilterState(setEditorState);
      } else {
        setError(result.message || "Gagal memproses gambar");
      }
    } catch (err) {
      setError("Tidak dapat terhubung ke server. Pastikan backend berjalan.");
      console.error("Restoration error:", err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReset = () => {
    // Reset local parameter ke default (Reset per bagian)
    setSelectedFilter("gaussian");
    setKernelSize(3);
    setSigma(1.5);
    setIntensity(50);
    setBackupImage(null);
    setLastAppliedOperation(null);
    setError(null);
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
      {/* Filter Selection */}
      <div>
        <label className="text-xs text-zinc-400 font-medium uppercase tracking-wider mb-3 block">
          Filter Type
        </label>

        <div className="space-y-2">
          {[
            { id: "gaussian", label: "Gaussian Blur" },
            { id: "median", label: "Median Filter" },
            { id: "saltpepper", label: "Salt & Pepper Removal" },
          ].map((filter) => (
            <label
              key={filter.id}
              className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition
                ${
                  selectedFilter === filter.id
                    ? "bg-blue-600/10 border-blue-500"
                    : "bg-zinc-900/50 border-zinc-800 hover:bg-zinc-800"
                }`}
            >
              <input
                type="radio"
                name="restoration-filter"
                checked={selectedFilter === filter.id}
                onChange={() => setSelectedFilter(filter.id)}
                className="accent-blue-500"
              />
              <span className="text-sm text-zinc-300">{filter.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Gaussian Blur */}
      {selectedFilter === "gaussian" && (
        <div className="space-y-5">
          <Slider
            label="Kernel Size"
            value={kernelSize}
            min={1}
            max={31}
            step={2}
            onChange={setKernelSize}
          />
          <Slider
            label="Sigma"
            value={sigma}
            min={0}
            max={10}
            step={0.1}
            onChange={setSigma}
          />
        </div>
      )}

      {/* Median Filter */}
      {selectedFilter === "median" && (
        <Slider
          label="Kernel Size"
          value={kernelSize}
          min={1}
          max={15}
          step={2}
          onChange={setKernelSize}
        />
      )}

      {/* Salt & Pepper */}
      {selectedFilter === "saltpepper" && (
        <Slider
          label="Noise Reduction"
          value={intensity}
          min={0}
          max={100}
          onChange={setIntensity}
        />
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
          className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold uppercase rounded-lg transition"
        >
          {isProcessing ? "Processing..." : "Apply"}
        </button>

        <button
          onClick={handleReset}
          disabled={!image || isProcessing}
          className="w-full py-2.5 bg-transparent border border-zinc-800 text-zinc-500 hover:text-zinc-300 disabled:opacity-40 disabled:cursor-not-allowed text-xs font-bold uppercase rounded-lg transition"
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
