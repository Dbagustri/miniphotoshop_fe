// src/components/canvas/Loading.jsx

import { LoaderCircle } from "lucide-react";

function Loading({ text = "Processing Image..." }) {
  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-[280px] rounded-3xl border border-zinc-800 bg-zinc-950/90 shadow-2xl p-8 flex flex-col items-center">
        {/* Spinner */}
        <div className="relative mb-6">
          <div className="w-16 h-16 rounded-full border border-zinc-800" />

          <LoaderCircle
            size={36}
            className="absolute inset-0 m-auto text-blue-500 animate-spin"
          />
        </div>

        {/* Text */}
        <h3 className="text-white text-base font-semibold">Please Wait</h3>

        <p className="text-sm text-zinc-500 mt-2 text-center leading-relaxed">
          {text}
        </p>

        {/* Progress Bar Animation */}
        <div className="w-full h-1 bg-zinc-800 rounded-full overflow-hidden mt-6">
          <div className="h-full w-1/2 bg-blue-500 animate-pulse rounded-full" />
        </div>
      </div>
    </div>
  );
}

export default Loading;
