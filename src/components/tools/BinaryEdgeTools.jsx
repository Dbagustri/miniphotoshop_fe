// src/components/tools/BinaryEdgeTools.jsx

import { useState } from "react";

export default function BinaryEdgeTools() {
  const [operation, setOperation] = useState("threshold");

  const [edgeMethod, setEdgeMethod] = useState("canny");

  const [morphologyType, setMorphologyType] = useState("erosion");

  const [thresholdValue, setThresholdValue] = useState(127);

  const [thresholdType, setThresholdType] = useState("binary");

  const [lowerThreshold, setLowerThreshold] = useState(50);

  const [upperThreshold, setUpperThreshold] = useState(150);

  const [kernelSize, setKernelSize] = useState(3);

  const [sigma, setSigma] = useState(1.5);

  const [direction, setDirection] = useState("both");

  const [iterations, setIterations] = useState(1);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
      {/* Operation Type */}
      <div>
        <label className="text-xs text-zinc-400 font-medium uppercase tracking-wider mb-3 block">
          Operation Type
        </label>

        <div className="space-y-2">
          {[
            {
              id: "threshold",
              label: "Thresholding",
            },
            {
              id: "edge",
              label: "Edge Detection",
            },
            {
              id: "morphology",
              label: "Morphology",
            },
          ].map((item) => (
            <label
              key={item.id}
              className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition
              ${
                operation === item.id
                  ? "bg-blue-600/10 border-blue-500"
                  : "bg-zinc-900/50 border-zinc-800 hover:bg-zinc-800"
              }`}
            >
              <input
                type="radio"
                name="operation"
                checked={operation === item.id}
                onChange={() => setOperation(item.id)}
                className="accent-blue-500"
              />
              <span className="text-sm text-zinc-300">{item.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* THRESHOLDING */}
      {operation === "threshold" && (
        <div className="space-y-5">
          {/* Threshold Value */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-xs text-zinc-400 font-medium uppercase tracking-wider">
                Threshold Value
              </label>
              <span className="text-[10px] bg-zinc-800 px-1.5 py-0.5 rounded text-zinc-300">
                {thresholdValue}
              </span>
            </div>

            <input
              type="range"
              min="0"
              max="255"
              value={thresholdValue}
              onChange={(e) => setThresholdValue(e.target.value)}
              className="w-full h-1 bg-zinc-800 appearance-none accent-blue-500 cursor-pointer"
            />
          </div>

          {/* Threshold Type */}
          <div>
            <label className="text-xs text-zinc-400 font-medium uppercase tracking-wider mb-3 block">
              Threshold Type
            </label>

            <div className="space-y-2">
              {["binary", "binary_inverse"].map((type) => (
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
                    {type.replace("_", " ")}
                  </span>
                </label>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* EDGE DETECTION */}
      {operation === "edge" && (
        <div className="space-y-5">
          {/* Edge Method */}
          <div>
            <label className="text-xs text-zinc-400 font-medium uppercase tracking-wider mb-3 block">
              Edge Method
            </label>

            <select
              value={edgeMethod}
              onChange={(e) => setEdgeMethod(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-3 text-sm text-zinc-300 outline-none focus:border-blue-500"
            >
              <option value="canny">Canny</option>
              <option value="sobel">Sobel</option>
              <option value="prewitt">Prewitt</option>
              <option value="robert">Robert</option>
              <option value="laplacian">Laplacian</option>
              <option value="log">Laplacian of Gaussian</option>
            </select>
          </div>

          {/* Canny */}
          {edgeMethod === "canny" && (
            <>
              <Slider
                label="Lower Threshold"
                value={lowerThreshold}
                min={0}
                max={255}
                onChange={setLowerThreshold}
              />

              <Slider
                label="Upper Threshold"
                value={upperThreshold}
                min={0}
                max={255}
                onChange={setUpperThreshold}
              />
            </>
          )}

          {/* Sobel/Prewitt/Robert */}
          {["sobel", "prewitt", "robert"].includes(edgeMethod) && (
            <>
              <Slider
                label="Kernel Size"
                value={kernelSize}
                min={1}
                max={9}
                step={2}
                onChange={setKernelSize}
              />

              <div>
                <label className="text-xs text-zinc-400 font-medium uppercase tracking-wider mb-3 block">
                  Direction
                </label>

                <div className="space-y-2">
                  {["x", "y", "both"].map((dir) => (
                    <label
                      key={dir}
                      className="flex items-center gap-3 p-3 rounded-lg bg-zinc-900/50 border border-zinc-800 hover:bg-zinc-800 transition cursor-pointer"
                    >
                      <input
                        type="radio"
                        checked={direction === dir}
                        onChange={() => setDirection(dir)}
                        className="accent-blue-500"
                      />
                      <span className="text-sm text-zinc-300 uppercase">
                        {dir}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Laplacian */}
          {edgeMethod === "laplacian" && (
            <Slider
              label="Kernel Size"
              value={kernelSize}
              min={1}
              max={9}
              step={2}
              onChange={setKernelSize}
            />
          )}

          {/* LoG */}
          {edgeMethod === "log" && (
            <>
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
            </>
          )}
        </div>
      )}

      {/* MORPHOLOGY */}
      {operation === "morphology" && (
        <div className="space-y-5">
          {/* Type */}
          <div>
            <label className="text-xs text-zinc-400 font-medium uppercase tracking-wider mb-3 block">
              Morphology Type
            </label>

            <div className="space-y-2">
              {["erosion", "dilation"].map((item) => (
                <label
                  key={item}
                  className="flex items-center gap-3 p-3 rounded-lg bg-zinc-900/50 border border-zinc-800 hover:bg-zinc-800 transition cursor-pointer"
                >
                  <input
                    type="radio"
                    checked={morphologyType === item}
                    onChange={() => setMorphologyType(item)}
                    className="accent-blue-500"
                  />

                  <span className="text-sm text-zinc-300 capitalize">
                    {item}
                  </span>
                </label>
              ))}
            </div>
          </div>

          <Slider
            label="Kernel Size"
            value={kernelSize}
            min={1}
            max={15}
            step={2}
            onChange={setKernelSize}
          />

          <Slider
            label="Iterations"
            value={iterations}
            min={1}
            max={10}
            onChange={setIterations}
          />
        </div>
      )}

      {/* Buttons */}
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
        onChange={(e) => onChange(e.target.value)}
        className="w-full h-1 bg-zinc-800 appearance-none accent-blue-500 cursor-pointer"
      />
    </div>
  );
}
