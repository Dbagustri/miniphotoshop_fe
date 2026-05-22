// src/components/tools/RestorationTools.jsx

import { useState } from "react";

export default function RestorationTools() {
  const [selectedFilter, setSelectedFilter] = useState("gaussian");

  const [kernelSize, setKernelSize] = useState(3);

  const [sigma, setSigma] = useState(1.5);

  const [intensity, setIntensity] = useState(50);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
      {/* Filter Selection */}
      <div>
        <label className="text-xs text-zinc-400 font-medium uppercase tracking-wider mb-3 block">
          Filter Type
        </label>

        <div className="space-y-2">
          {[
            {
              id: "gaussian",
              label: "Gaussian Blur",
            },
            {
              id: "median",
              label: "Median Filter",
            },
            {
              id: "saltpepper",
              label: "Salt & Pepper Removal",
            },
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
          {/* Kernel Size */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-xs text-zinc-400 font-medium uppercase tracking-wider">
                Kernel Size
              </label>
              <span className="text-[10px] bg-zinc-800 px-1.5 py-0.5 rounded text-zinc-300">
                {kernelSize}
              </span>
            </div>

            <input
              type="range"
              min="1"
              max="31"
              step="2"
              value={kernelSize}
              onChange={(e) => setKernelSize(e.target.value)}
              className="w-full h-1 bg-zinc-800 appearance-none accent-blue-500 cursor-pointer"
            />
          </div>

          {/* Sigma */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-xs text-zinc-400 font-medium uppercase tracking-wider">
                Sigma
              </label>
              <span className="text-[10px] bg-zinc-800 px-1.5 py-0.5 rounded text-zinc-300">
                {sigma}
              </span>
            </div>

            <input
              type="range"
              min="0"
              max="10"
              step="0.1"
              value={sigma}
              onChange={(e) => setSigma(e.target.value)}
              className="w-full h-1 bg-zinc-800 appearance-none accent-blue-500 cursor-pointer"
            />
          </div>
        </div>
      )}

      {/* Median Filter */}
      {selectedFilter === "median" && (
        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="text-xs text-zinc-400 font-medium uppercase tracking-wider">
              Kernel Size
            </label>
            <span className="text-[10px] bg-zinc-800 px-1.5 py-0.5 rounded text-zinc-300">
              {kernelSize}
            </span>
          </div>

          <input
            type="range"
            min="1"
            max="15"
            step="2"
            value={kernelSize}
            onChange={(e) => setKernelSize(e.target.value)}
            className="w-full h-1 bg-zinc-800 appearance-none accent-blue-500 cursor-pointer"
          />
        </div>
      )}

      {/* Salt & Pepper */}
      {selectedFilter === "saltpepper" && (
        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="text-xs text-zinc-400 font-medium uppercase tracking-wider">
              Noise Reduction
            </label>
            <span className="text-[10px] bg-zinc-800 px-1.5 py-0.5 rounded text-zinc-300">
              {intensity}
            </span>
          </div>

          <input
            type="range"
            min="0"
            max="100"
            step="1"
            value={intensity}
            onChange={(e) => setIntensity(e.target.value)}
            className="w-full h-1 bg-zinc-800 appearance-none accent-blue-500 cursor-pointer"
          />
        </div>
      )}

      {/* Action Buttons */}
      <div className="pt-4 space-y-2">
        <button className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold uppercase rounded-lg transition">
          Apply
        </button>

        <button className="w-full py-2.5 bg-transparent border border-zinc-800 text-zinc-500 hover:text-zinc-300 text-xs font-bold uppercase rounded-lg transition">
          Reset
        </button>
      </div>
    </div>
  );
}
