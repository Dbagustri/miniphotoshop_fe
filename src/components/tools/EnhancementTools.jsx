// src/components/tools/EnhancementTools.jsx

export default function EnhancementTools({ editorState, setEditorState }) {
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
    setEditorState((prev) => ({
      ...prev,
      brightness: 100,
      contrast: 100,
      sharpen: 0,
      blur: 0,
    }));
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

      {/* Actions */}
      <div className="pt-4 space-y-2">
        <button className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold uppercase rounded-lg transition">
          Apply All
        </button>

        <button
          onClick={resetEnhancement}
          className="w-full py-2.5 bg-transparent border border-zinc-800 text-zinc-500 hover:text-zinc-300 text-xs font-bold uppercase rounded-lg transition"
        >
          Reset
        </button>
      </div>
    </div>
  );
}
