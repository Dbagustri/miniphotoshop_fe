// src/components/layout/Footer.jsx

import { useState, useEffect } from "react";
import {
  ChevronUp,
  ChevronDown,
  ImageIcon,
  BarChart2,
  Info,
} from "lucide-react";
import { getHistogram } from "../../api/imageApi";
import Histogram from "../histogram/Histogram";

// ============================================================
// MAIN FOOTER
// ============================================================
function Footer({ imageInfo, image }) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("histogram"); // "histogram" | "info"
  const [histogramData, setHistogramData] = useState(null);
  const [histogramType, setHistogramType] = useState("rgb");
  const [isLoadingHistogram, setIsLoadingHistogram] = useState(false);

  // Fetch histogram saat tab histogram dibuka atau image.preview berubah
  useEffect(() => {
    if (!isOpen || activeTab !== "histogram" || !image?.preview) return;

    setIsLoadingHistogram(true);
    getHistogram(image.preview)
      .then((result) => {
        if (result.success) {
          const formatted = Array.from({ length: 256 }, (_, i) => ({
            intensity: i,
            red: result.histogram.red?.[i] ?? 0,
            green: result.histogram.green?.[i] ?? 0,
            blue: result.histogram.blue?.[i] ?? 0,
            gray: result.histogram.gray?.[i] ?? 0,
          }));
          setHistogramData(formatted);
        }
      })
      .catch((err) => console.error("Histogram error:", err))
      .finally(() => setIsLoadingHistogram(false));
  }, [image?.preview, isOpen, activeTab]);

  const tabs = [
    { id: "histogram", label: "Histogram", icon: BarChart2 },
    { id: "info", label: "Image Info", icon: Info },
  ];

  return (
    <footer
      className={`
        w-full
        bg-zinc-950/95
        backdrop-blur-md
        border-t border-zinc-800
        transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)]
        ${isOpen ? "h-72" : "h-12"}
        flex flex-col overflow-hidden
      `}
    >
      {/* ── HEADER BAR ── */}
      <div className="h-12 min-h-[48px] px-4 flex items-center justify-between shrink-0">
        {/* Toggle + Tabs */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => setIsOpen((v) => !v)}
            className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500 hover:text-white transition-colors pr-3 border-r border-zinc-800 mr-2"
          >
            {isOpen ? <ChevronDown size={13} /> : <ChevronUp size={13} />}
            Analysis & Preview
          </button>

          {isOpen &&
            tabs.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[10px] font-semibold uppercase tracking-wider transition ${
                  activeTab === id
                    ? "bg-zinc-800 text-white"
                    : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900"
                }`}
              >
                <Icon size={12} />
                {label}
              </button>
            ))}
        </div>


      </div>

      {/* ── PANEL CONTENT ── */}
      <div
        className={`flex-1 min-h-0 transition-opacity duration-300 ${
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      >
        {/* ── TAB: HISTOGRAM ── */}
        {activeTab === "histogram" && (
          <div className="h-full px-4 pb-4 flex flex-col gap-3">
            {/* Controls */}
            <div className="flex items-center gap-2 pt-1">
              <span className="text-[10px] text-zinc-500 uppercase tracking-wider mr-1">Channel:</span>
              {["rgb", "grayscale"].map((t) => (
                <button
                  key={t}
                  onClick={() => setHistogramType(t)}
                  className={`text-[10px] uppercase px-3 py-1 rounded-md border font-semibold transition ${
                    histogramType === t
                      ? "bg-blue-600/20 border-blue-500 text-blue-400"
                      : "bg-zinc-900 border-zinc-800 text-zinc-500 hover:text-zinc-300"
                  }`}
                >
                  {t}
                </button>
              ))}

              {/* Channel color legend */}
              {histogramType === "rgb" && (
                <div className="flex items-center gap-3 ml-3">
                  {[
                    { color: "#ef4444", label: "R" },
                    { color: "#22c55e", label: "G" },
                    { color: "#3b82f6", label: "B" },
                  ].map(({ color, label }) => (
                    <div key={label} className="flex items-center gap-1">
                      <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: color }} />
                      <span className="text-[10px] text-zinc-400">{label}</span>
                    </div>
                  ))}
                </div>
              )}

              {isLoadingHistogram && (
                <span className="ml-auto text-[10px] text-zinc-500 animate-pulse">
                  Fetching...
                </span>
              )}
              {!image?.preview && (
                <span className="ml-auto text-[10px] text-zinc-600">
                  Upload gambar untuk histogram nyata
                </span>
              )}
            </div>

            {/* Chart — takes remaining height */}
            <div className="flex-1 min-h-0 rounded-xl bg-zinc-900/80 border border-zinc-800 p-3">
              <Histogram type={histogramType} data={histogramData} />
            </div>
          </div>
        )}

        {/* ── TAB: IMAGE INFO ── */}
        {activeTab === "info" && (
          <div className="h-full px-6 pt-3 pb-4 flex items-start gap-10">
            {imageInfo ? (
              <>
                {/* Stats grid */}
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-zinc-500 mb-3 font-semibold">
                    File Properties
                  </p>
                  <div className="grid grid-cols-2 gap-x-8 gap-y-2.5 text-sm">
                    {[
                      { label: "Width", value: `${imageInfo.width} px` },
                      { label: "Height", value: `${imageInfo.height} px` },
                      { label: "Format", value: imageInfo.format },
                      { label: "File Size", value: `${imageInfo.size} MB` },
                      {
                        label: "Aspect Ratio",
                        value: (() => {
                          const gcd = (a, b) => (b === 0 ? a : gcd(b, a % b));
                          const d = gcd(imageInfo.width, imageInfo.height);
                          return `${imageInfo.width / d}:${imageInfo.height / d}`;
                        })(),
                      },
                      {
                        label: "Megapixels",
                        value: `${((imageInfo.width * imageInfo.height) / 1_000_000).toFixed(2)} MP`,
                      },
                    ].map(({ label, value }) => (
                      <div key={label}>
                        <span className="text-zinc-500 text-xs">{label}</span>
                        <p className="text-zinc-200 font-semibold text-sm">{value}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Before / After thumbnails */}
                {image?.original && image?.preview && image.original !== image.preview && (
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-zinc-500 mb-3 font-semibold">
                      Quick Compare
                    </p>
                    <div className="flex gap-3">
                      <div className="text-center">
                        <img
                          src={image.original}
                          alt="original"
                          className="w-20 h-16 object-contain rounded-lg border border-zinc-800 bg-zinc-900"
                        />
                        <p className="text-[9px] text-zinc-600 mt-1 uppercase tracking-wider">Original</p>
                      </div>
                      <div className="flex items-center text-zinc-700 text-lg">→</div>
                      <div className="text-center">
                        <img
                          src={image.preview}
                          alt="edited"
                          className="w-20 h-16 object-contain rounded-lg border border-zinc-700 bg-zinc-900"
                        />
                        <p className="text-[9px] text-blue-500 mt-1 uppercase tracking-wider">Edited</p>
                      </div>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="h-full w-full flex flex-col items-center justify-center text-zinc-700 gap-2">
                <ImageIcon size={24} className="opacity-40" />
                <span className="text-xs">Belum ada gambar yang di-upload</span>
              </div>
            )}
          </div>
        )}
      </div>
    </footer>
  );
}

export default Footer;
