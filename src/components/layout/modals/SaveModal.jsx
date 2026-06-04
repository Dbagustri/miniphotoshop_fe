// src/components/modals/SaveModal.jsx

import { X } from "lucide-react";
import { useState } from "react";
import { saveImage } from "../../../api/imageApi";

export default function SaveModal({ isOpen, onClose, image }) {
  const [fileName, setFileName] = useState("edited-image");

  const [format, setFormat] = useState("jpg");

  const [quality, setQuality] = useState(30);

  const [compressionMethod, setCompressionMethod] = useState("quantization");
  const [isSaving, setIsSaving] = useState(false);  // ✅ loading state
  const [resultInfo, setResultInfo] = useState(null); // ✅ info dari backend

  if (!isOpen) return null;

  // ✅ handleSave: kirim ke backend dan trigger download
  const handleSave = async () => {
    if (!image) return;

    setIsSaving(true);
    try {
      const result = await saveImage(image.preview, {
        file_name: fileName,
        format,
        quality: Number(quality),
        compression_method: compressionMethod,
      });

      if (result.success) {
        // Trigger download dari base64
        const link = document.createElement("a");
        link.href = result.image;
        link.download = `${fileName}.${format}`;
        link.click();

        // Update info display
        setResultInfo({
          estimatedSize: result.estimated_size || "—",
          compressionRatio: result.compression_ratio || "—",
        });

        onClose();
      }
    } catch (err) {
      console.error("Save error:", err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-[500px] rounded-2xl border border-zinc-800 bg-zinc-950 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-zinc-800">
          <div>
            <h2 className="text-lg font-semibold text-white">Export Image</h2>
            <p className="text-sm text-zinc-500">Configure export settings</p>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-zinc-800 transition"
          >
            <X size={18} className="text-zinc-400" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6">
          {/* File Name */}
          <div>
            <label className="text-xs text-zinc-400 uppercase tracking-wider mb-2 block">
              File Name
            </label>

            <input
              type="text"
              value={fileName}
              onChange={(e) => setFileName(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-zinc-200 outline-none focus:border-blue-500 transition"
            />
          </div>

          {/* Format */}
          <div>
            <label className="text-xs text-zinc-400 uppercase tracking-wider mb-2 block">
              Format
            </label>

            <select
              value={format}
              onChange={(e) => setFormat(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-zinc-200 outline-none focus:border-blue-500 transition"
            >
              <option value="jpg">JPG</option>
              <option value="png">PNG</option>
              <option value="bmp">BMP</option>
            </select>
          </div>

          {/* Quality Slider */}
          <div>
            <div className="flex justify-between mb-4">
              <label className="text-xs text-zinc-400 uppercase tracking-wider">
                Quality
              </label>

              <span className="text-sm text-zinc-300 font-medium">
                {quality}
              </span>
            </div>

            <div className="relative">
              <input
                type="range"
                min="0"
                max="60"
                value={quality}
                onChange={(e) => setQuality(Number(e.target.value))}
                className="
                  w-full
                  appearance-none
                  bg-transparent
                  cursor-pointer

                  [&::-webkit-slider-runnable-track]:h-[2px]
                  [&::-webkit-slider-runnable-track]:bg-zinc-700

                  [&::-webkit-slider-thumb]:appearance-none
                  [&::-webkit-slider-thumb]:h-4
                  [&::-webkit-slider-thumb]:w-4
                  [&::-webkit-slider-thumb]:rounded-full
                  [&::-webkit-slider-thumb]:bg-white
                  [&::-webkit-slider-thumb]:border
                  [&::-webkit-slider-thumb]:border-zinc-500
                  [&::-webkit-slider-thumb]:-mt-[7px]

                  [&::-moz-range-track]:h-[2px]
                  [&::-moz-range-track]:bg-zinc-700

                  [&::-moz-range-thumb]:h-4
                  [&::-moz-range-thumb]:w-4
                  [&::-moz-range-thumb]:rounded-full
                  [&::-moz-range-thumb]:bg-white
                "
              />

              {/* scale */}
              <div className="flex justify-between text-[11px] text-zinc-600 mt-2 px-1">
                <span>0</span>
                <span>15</span>
                <span>30</span>
                <span>45</span>
                <span>60</span>
              </div>
            </div>
          </div>

          {/* Compression */}
          <div>
            <label className="text-xs text-zinc-400 uppercase tracking-wider mb-2 block">
              Compression Method
            </label>

            <select
              value={compressionMethod}
              onChange={(e) => setCompressionMethod(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-zinc-200 outline-none focus:border-blue-500 transition"
            >
              <option value="quantization">JPEG Quantization</option>
              <option value="huffman">Huffman</option>
              <option value="rle">RLE</option>
              <option value="lzw">LZW</option>
              <option value="arithmetic">Arithmetic</option>
            </select>
          </div>

          {/* File Info */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
            <div className="flex justify-between text-sm">
              <span className="text-zinc-500">Estimated Size</span>
              <span className="text-zinc-300">{resultInfo?.estimatedSize ?? "~"}</span>
            </div>

            <div className="flex justify-between text-sm mt-2">
              <span className="text-zinc-500">Compression Ratio</span>
              <span className="text-green-400">{resultInfo?.compressionRatio ?? "—"}</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-zinc-800 p-5 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl border border-zinc-800 text-zinc-400 hover:text-zinc-200 transition"
          >
            Cancel
          </button>

          <button
            onClick={handleSave}
            disabled={!image || isSaving}
            className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-medium transition"
          >
            {isSaving ? "Saving..." : "Save Image"}
          </button>
        </div>
      </div>
    </div>
  );
}
