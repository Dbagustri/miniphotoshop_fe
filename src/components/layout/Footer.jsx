// src/components/layout/Footer.jsx

import { useState } from "react";
import { ChevronUp, ChevronDown, History, ImageIcon } from "lucide-react";

function Footer({ showBefore, setShowBefore, imageInfo }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <footer
      className={`
        w-full
        bg-zinc-950/90
        backdrop-blur-md
        border-t border-zinc-800

        transition-all
        duration-500
        ease-[cubic-bezier(0.4,0,0.2,1)]

        ${isOpen ? "h-56" : "h-12"}

        flex
        flex-col
        overflow-hidden
      `}
    >
      {/* HEADER */}
      <div className="h-12 min-h-[48px] px-6 flex items-center justify-between border-b border-zinc-900/30">
        {/* Toggle */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500 hover:text-white transition-colors"
        >
          {isOpen ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
          Analysis & Preview
        </button>

        {/* Hold Original */}
        <button
          onMouseDown={() => setShowBefore(true)}
          onMouseUp={() => setShowBefore(false)}
          onMouseLeave={() => setShowBefore(false)}
          onTouchStart={() => setShowBefore(true)}
          onTouchEnd={() => setShowBefore(false)}
          className={`
            flex
            items-center
            gap-2
            px-3
            py-1.5
            rounded-md
            text-xs
            transition

            ${
              showBefore
                ? "bg-blue-600 text-white"
                : "bg-zinc-800 hover:bg-zinc-700 text-zinc-300"
            }
          `}
        >
          <History size={14} />

          {showBefore ? "Viewing Original" : "Hold to View Original"}
        </button>
      </div>

      {/* CONTENT */}
      <div
        className={`
          p-6
          flex
          gap-12
          transition-opacity
          duration-300

          ${
            isOpen
              ? "opacity-100 pointer-events-auto"
              : "opacity-0 pointer-events-none"
          }
        `}
      >
        {/* Histogram */}
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-3">
            Histogram
          </h3>

          <div className="w-64 h-24 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-600 text-sm">
            Histogram Preview
          </div>
        </div>

        {/* Image Stats */}
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-3">
            Image Stats
          </h3>

          {imageInfo ? (
            <div className="space-y-2 text-sm text-zinc-400">
              <p>
                Resolution:
                <span className="text-zinc-200 ml-2">
                  {imageInfo.width} × {imageInfo.height}
                </span>
              </p>

              <p>
                Format:
                <span className="text-zinc-200 ml-2">{imageInfo.format}</span>
              </p>

              <p>
                Size:
                <span className="text-zinc-200 ml-2">{imageInfo.size} MB</span>
              </p>
            </div>
          ) : (
            <div className="h-24 w-56 rounded-xl border border-dashed border-zinc-800 flex flex-col items-center justify-center text-zinc-600">
              <ImageIcon size={22} className="mb-2 opacity-50" />

              <span className="text-xs">No image uploaded</span>
            </div>
          )}
        </div>
      </div>
    </footer>
  );
}

export default Footer;
