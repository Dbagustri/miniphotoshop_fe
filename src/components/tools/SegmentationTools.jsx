// src/components/tools/SegmentationTools.jsx

import { useState } from "react";
import { MousePointerClick } from "lucide-react";
import { flattenImageToBase64, buildCssFilter, resetCssFilterState } from "../../utils/imageUtils";
import { applySegmentation } from "../../api/imageApi";

export default function SegmentationTools({
  image,
  setImage,
  isProcessing,
  setIsProcessing,
  editorState,   // ✅ seedPoint ada di editorState.segmentation.seedPoint
  setEditorState,
  imgRef,
}) {
  const [segmentationType, setSegmentationType] = useState("threshold");

  const [threshold, setThreshold] = useState(127);

  const [thresholdType, setThresholdType] = useState("binary");

  const [edgeMethod, setEdgeMethod] = useState("canny");

  const [edgeThreshold, setEdgeThreshold] = useState(100);

  const [sensitivity, setSensitivity] = useState(50);

  const [tolerance, setTolerance] = useState(25);

  const [seedSelectionEnabled, setSeedSelectionEnabled] = useState(false);

  const [error, setError] = useState(null); // ✅ error state

  // ✅ handleApply: flatten CSS filter lalu kirim ke backend
  const handleApply = async () => {
    if (!image || !imgRef?.current) return;

    setIsProcessing(true);
    setError(null);

    try {
      const flatBase64 = flattenImageToBase64(
        imgRef.current,
        buildCssFilter(editorState)
      );

      const params = {
        segmentation_type: segmentationType,
        // threshold params
        threshold: Number(threshold),
        threshold_type: thresholdType,
        // edge params
        edge_method: edgeMethod,
        edge_threshold: Number(edgeThreshold),
        sensitivity: Number(sensitivity),
        // region params
        seed_point: editorState.segmentation?.seedPoint || null,
        tolerance: Number(tolerance),
      };

      const result = await applySegmentation(flatBase64, params);

      if (result.success) {
        setImage((prev) => ({ ...prev, preview: result.image }));
        resetCssFilterState(setEditorState);
        // Reset local parameter ke default
        setThreshold(127);
        setThresholdType("binary");
        setEdgeMethod("canny");
        setEdgeThreshold(100);
        setSensitivity(50);
        setTolerance(25);
        setSeedSelectionEnabled(false);
        setEditorState((prev) => ({
          ...prev,
          segmentation: {
            seedPoint: null,
            tolerance: 25,
          },
        }));
      } else {
        setError(result.message || "Gagal memproses gambar");
      }
    } catch (err) {
      setError("Tidak dapat terhubung ke server.");
      console.error("Segmentation error:", err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReset = () => {
    // Reset local parameter ke default (Reset per bagian)
    setSegmentationType("threshold");
    setThreshold(127);
    setThresholdType("binary");
    setEdgeMethod("canny");
    setEdgeThreshold(100);
    setSensitivity(50);
    setTolerance(25);
    setSeedSelectionEnabled(false);
    setEditorState((prev) => ({
      ...prev,
      segmentation: {
        seedPoint: null,
        tolerance: 25,
      },
    }));
    setError(null);
  };

  const handleSeedSelection = () => {
    setSeedSelectionEnabled(!seedSelectionEnabled);
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
      {/* Segmentation Type */}
      <div>
        <label className="text-xs text-zinc-400 font-medium uppercase tracking-wider mb-3 block">
          Segmentation Type
        </label>

        <div className="space-y-2">
          {[
            {
              id: "threshold",
              label: "Threshold-Based",
            },
            {
              id: "edge",
              label: "Edge-Based",
            },
            {
              id: "region",
              label: "Region-Based",
            },
          ].map((item) => (
            <label
              key={item.id}
              className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition
              ${segmentationType === item.id
                  ? "bg-blue-600/10 border-blue-500"
                  : "bg-zinc-900/50 border-zinc-800 hover:bg-zinc-800"
                }`}
            >
              <input
                type="radio"
                name="segmentation"
                checked={segmentationType === item.id}
                onChange={() => setSegmentationType(item.id)}
                className="accent-blue-500"
              />

              <span className="text-sm text-zinc-300">{item.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* THRESHOLD BASED */}
      {segmentationType === "threshold" && (
        <div className="space-y-5">
          <Slider
            label="Threshold"
            value={threshold}
            min={0}
            max={255}
            onChange={setThreshold}
          />

          <div>
            <label className="text-xs text-zinc-400 font-medium uppercase tracking-wider mb-3 block">
              Threshold Type
            </label>

            <div className="space-y-2">
              {["binary", "inverse"].map((type) => (
                <label
                  key={type}
                  className="flex items-center gap-3 p-3 rounded-lg bg-zinc-900/50 border border-zinc-800 hover:bg-zinc-800 transition cursor-pointer"
                >
                  <input
                    type="radio"
                    checked={thresholdType === type}
                    onChange={() => setThresholdType(type)}
                    className="accent-blue-500"
                  />

                  <span className="text-sm text-zinc-300 capitalize">
                    {type}
                  </span>
                </label>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* EDGE BASED */}
      {segmentationType === "edge" && (
        <div className="space-y-5">
          <div>
            <label className="text-xs text-zinc-400 font-medium uppercase tracking-wider mb-3 block">
              Detection Method
            </label>

            <select
              value={edgeMethod}
              onChange={(e) => setEdgeMethod(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-3 text-sm text-zinc-300 outline-none focus:border-blue-500"
            >
              <option value="canny">Canny</option>
              <option value="sobel">Sobel</option>
            </select>
          </div>

          <Slider
            label="Edge Threshold"
            value={edgeThreshold}
            min={0}
            max={255}
            onChange={setEdgeThreshold}
          />

          <Slider
            label="Sensitivity"
            value={sensitivity}
            min={0}
            max={100}
            onChange={setSensitivity}
          />
        </div>
      )}

      {/* REGION BASED — show editorState.segmentation.seedPoint */}
      {segmentationType === "region" && (
        <div className="space-y-5">
          {/* Seed Selection */}
          <div>
            <label className="text-xs text-zinc-400 font-medium uppercase tracking-wider mb-3 block">
              Seed Point
            </label>

            <button
              onClick={handleSeedSelection}
              className={`w-full flex items-center justify-center gap-2 p-3 rounded-lg border transition text-sm font-medium
              ${seedSelectionEnabled
                  ? "bg-blue-600/10 border-blue-500 text-blue-400"
                  : "bg-zinc-900/50 border-zinc-800 text-zinc-300 hover:bg-zinc-800"
                }`}
            >
              <MousePointerClick size={18} />
              {seedSelectionEnabled
                ? "Click Image to Select Seed"
                : "Enable Seed Selection"}
            </button>

            {editorState.segmentation?.seedPoint && (
              <div className="mt-3 p-3 rounded-lg bg-zinc-900/50 border border-zinc-800 text-sm text-zinc-400">
                Seed Point:
                <span className="text-zinc-200 ml-2">
                  X:
                  {editorState.segmentation.seedPoint.x} | Y:
                  {editorState.segmentation.seedPoint.y}
                </span>
              </div>
            )}
          </div>

          {/* Tolerance */}
          <Slider
            label="Tolerance"
            value={tolerance}
            min={0}
            max={100}
            onChange={setTolerance}
          />

          <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-3 text-xs text-zinc-500 leading-relaxed">
            Click an area on the image to define the seed point for region
            extraction.
          </div>
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

/* Reusable Slider */
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
