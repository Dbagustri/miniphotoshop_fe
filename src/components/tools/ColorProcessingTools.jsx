// src/components/tools/ColorProcessingTools.jsx

import { useState } from "react";

export default function ColorProcessingTools({ editorState, setEditorState }) {
  const [mode, setMode] = useState("grayscale");

  const updateValue = (key, value) => {
    setEditorState((prev) => ({
      ...prev,
      [key]: value,
    }));
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
                  : "bg-zinc-900/50 border-zinc-800"
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
        <label className="flex items-center justify-between p-4 rounded-lg bg-zinc-900 border border-zinc-800">
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
