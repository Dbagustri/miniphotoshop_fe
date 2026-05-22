// src/components/layout/Navbar.jsx

import { useRef, useState } from "react";
import { Upload, RotateCcw, Save } from "lucide-react";

import SaveModal from "./modals/SaveModal";

export default function Navbar({ setImage, setOriginalImage }) {
  const [openSave, setOpenSave] = useState(false);

  const fileInputRef = useRef(null);

  // Upload Image
  const handleUpload = (e) => {
    const file = e.target.files?.[0];

    if (!file) return;

    const reader = new FileReader();

    reader.onload = () => {
      const imageData = reader.result;

      console.log("IMAGE:", imageData);

      setImage(imageData);
      setOriginalImage(imageData);
    };

    reader.onerror = () => {
      console.error("Failed to read image");
    };

    reader.readAsDataURL(file);
  };

  // Reset App
  const handleReset = () => {
    window.location.reload();
  };

  return (
    <>
      <nav className="w-full bg-zinc-900 border-b border-zinc-800 px-6 py-4 flex items-center justify-between">
        {/* Left */}
        <div>
          <h1 className="text-2xl font-bold text-white tracking-wide">
            MiniPhotoshop
          </h1>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-3">
          {/* Hidden Input */}
          <input
            type="file"
            accept="image/*"
            ref={fileInputRef}
            onChange={handleUpload}
            className="hidden"
          />

          {/* Upload */}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="
              flex items-center gap-2
              px-5 py-2
              rounded-lg
              bg-zinc-800
              hover:bg-zinc-700
              text-white
              font-medium
              transition duration-200
            "
          >
            <Upload size={16} />
            Upload
          </button>

          {/* Reset */}
          <button
            onClick={handleReset}
            className="
              flex items-center gap-2
              px-5 py-2
              rounded-lg
              bg-zinc-800
              hover:bg-zinc-700
              text-white
              font-medium
              transition duration-200
            "
          >
            <RotateCcw size={16} />
            Reset
          </button>

          {/* Save */}
          <button
            onClick={() => setOpenSave(true)}
            className="
              flex items-center gap-2
              px-5 py-2
              rounded-lg
              bg-blue-600
              hover:bg-blue-500
              text-white
              font-medium
              transition duration-200
            "
          >
            <Save size={16} />
            Save
          </button>
        </div>
      </nav>

      <SaveModal isOpen={openSave} onClose={() => setOpenSave(false)} />
    </>
  );
}
