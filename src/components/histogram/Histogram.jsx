// src/components/histogram/Histogram.jsx

import { ResponsiveContainer, AreaChart, Area, XAxis, Tooltip } from "recharts";

function generateDummyHistogram() {
  return Array.from({ length: 256 }, (_, i) => ({
    intensity: i,

    red: Math.exp(-Math.pow(i - 180, 2) / 1800) * 100,

    green: Math.exp(-Math.pow(i - 120, 2) / 1400) * 90,

    blue: Math.exp(-Math.pow(i - 70, 2) / 1200) * 80,

    gray: Math.exp(-Math.pow(i - 128, 2) / 2000) * 95,
  }));
}

const DEFAULT_DATA = generateDummyHistogram();

function Histogram({ type = "rgb", data }) {
  const histogramData = data || DEFAULT_DATA;

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500">
          Histogram
        </h3>

        <span className="text-[10px] uppercase text-zinc-600 bg-zinc-900 px-2 py-1 rounded-md border border-zinc-800">
          {type}
        </span>
      </div>

      <div className="h-32 w-full rounded-xl bg-zinc-900 border border-zinc-800 p-2">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={histogramData}>
            <XAxis dataKey="intensity" hide />

            <Tooltip
              contentStyle={{
                background: "#18181b",
                border: "1px solid #27272a",
                borderRadius: 12,
                color: "#fff",
              }}
              labelStyle={{
                color: "#a1a1aa",
              }}
            />

            {/* RGB */}
            {type === "rgb" && (
              <>
                <Area
                  type="monotone"
                  dataKey="red"
                  stroke="#ef4444"
                  fill="#ef4444"
                  fillOpacity={0.25}
                  strokeWidth={1.5}
                />

                <Area
                  type="monotone"
                  dataKey="green"
                  stroke="#22c55e"
                  fill="#22c55e"
                  fillOpacity={0.25}
                  strokeWidth={1.5}
                />

                <Area
                  type="monotone"
                  dataKey="blue"
                  stroke="#3b82f6"
                  fill="#3b82f6"
                  fillOpacity={0.25}
                  strokeWidth={1.5}
                />
              </>
            )}

            {/* Grayscale */}
            {type === "grayscale" && (
              <Area
                type="monotone"
                dataKey="gray"
                stroke="#d4d4d8"
                fill="#a1a1aa"
                fillOpacity={0.3}
                strokeWidth={1.5}
              />
            )}
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export default Histogram;
