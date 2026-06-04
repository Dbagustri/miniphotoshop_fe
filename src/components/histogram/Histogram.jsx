// src/components/histogram/Histogram.jsx

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

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

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 shadow-xl text-xs">
      <p className="text-zinc-400 mb-1">Intensity: <span className="text-white font-semibold">{label}</span></p>
      {payload.map((p) => (
        <p key={p.dataKey} style={{ color: p.stroke }} className="font-medium">
          {p.dataKey.charAt(0).toUpperCase() + p.dataKey.slice(1)}: {Math.round(p.value)}
        </p>
      ))}
    </div>
  );
};

function Histogram({ type = "rgb", data }) {
  const histogramData = data || DEFAULT_DATA;
  const isDummy = !data;

  return (
    <div className="w-full h-full flex flex-col">
      {/* Y-axis label + chart */}
      <div className="flex-1 min-h-0 relative">
        {isDummy && (
          <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
            <span className="text-[10px] text-zinc-600 bg-zinc-950/80 px-2 py-1 rounded-md border border-zinc-800">
              preview dummy — upload gambar
            </span>
          </div>
        )}
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={histogramData}
            margin={{ top: 4, right: 4, left: -8, bottom: 0 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#27272a"
              vertical={false}
            />
            <XAxis
              dataKey="intensity"
              tick={{ fill: "#52525b", fontSize: 9 }}
              tickLine={false}
              axisLine={{ stroke: "#3f3f46" }}
              ticks={[0, 64, 128, 192, 255]}
            />
            <YAxis
              tick={{ fill: "#52525b", fontSize: 9 }}
              tickLine={false}
              axisLine={false}
              width={28}
            />
            <Tooltip content={<CustomTooltip />} />

            {/* RGB mode */}
            {type === "rgb" && (
              <>
                <Area
                  type="monotone"
                  dataKey="red"
                  stroke="#ef4444"
                  fill="#ef4444"
                  fillOpacity={0.2}
                  strokeWidth={1.5}
                  dot={false}
                  isAnimationActive={false}
                />
                <Area
                  type="monotone"
                  dataKey="green"
                  stroke="#22c55e"
                  fill="#22c55e"
                  fillOpacity={0.2}
                  strokeWidth={1.5}
                  dot={false}
                  isAnimationActive={false}
                />
                <Area
                  type="monotone"
                  dataKey="blue"
                  stroke="#3b82f6"
                  fill="#3b82f6"
                  fillOpacity={0.2}
                  strokeWidth={1.5}
                  dot={false}
                  isAnimationActive={false}
                />
              </>
            )}

            {/* Grayscale mode */}
            {type === "grayscale" && (
              <Area
                type="monotone"
                dataKey="gray"
                stroke="#a1a1aa"
                fill="url(#grayGradient)"
                fillOpacity={1}
                strokeWidth={1.5}
                dot={false}
                isAnimationActive={false}
              />
            )}

            <defs>
              <linearGradient id="grayGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#a1a1aa" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#a1a1aa" stopOpacity={0.02} />
              </linearGradient>
            </defs>
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* X-axis description */}
      <div className="flex justify-between mt-1 px-7">
        <span className="text-[9px] text-zinc-600">Dark</span>
        <span className="text-[9px] text-zinc-600">Midtones</span>
        <span className="text-[9px] text-zinc-600">Bright</span>
      </div>
    </div>
  );
}

export default Histogram;
