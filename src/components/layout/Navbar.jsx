// src/components/layout/Navbar.jsx

import { useRef, useState } from "react";
import { Upload, RotateCcw, Save } from "lucide-react";
import SaveModal from "./modals/SaveModal";

export default function Navbar({ onReset, onUpload, image }) {
  const [openSave, setOpenSave] = useState(false);
  const fileInputRef = useRef(null);

  // ✅ Delegasikan ke onUpload dari editor.jsx
  const handleUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    onUpload(file);
    // Reset input agar file yang sama bisa di-upload ulang
    e.target.value = "";
  };

  return (
    <>
      <nav className="w-full bg-zinc-900 border-b border-zinc-800 px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-wide">
            MiniPhotoshop
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <input
            type="file"
            accept="image/*"
            ref={fileInputRef}
            onChange={handleUpload}
            className="hidden"
          />

          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 px-5 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white font-medium transition duration-200"
          >
            <Upload size={16} />
            Upload
          </button>

          {/* ✅ Gunakan prop onReset, bukan window.location.reload() */}
          <button
            onClick={onReset}
            className="flex items-center gap-2 px-5 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white font-medium transition duration-200"
          >
            <RotateCcw size={16} />
            Reset
          </button>

          <button
            onClick={() => setOpenSave(true)}
            className="flex items-center gap-2 px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium transition duration-200"
          >
            <Save size={16} />
            Save
          </button>
        </div>
      </nav>

      {/* ✅ Kirim image ke SaveModal */}
      <SaveModal
        isOpen={openSave}
        onClose={() => setOpenSave(false)}
        image={image}
      />
    </>
  );
}
