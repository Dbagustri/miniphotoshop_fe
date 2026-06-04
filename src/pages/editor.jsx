// src/pages/editor.jsx

import { useState, useRef } from "react";

import Navbar from "../components/layout/Navbar";
import Sidebar from "../components/layout/Sidebar";
import PropertiesPanel from "../components/layout/PropertiesPanel";
import Footer from "../components/layout/Footer";
import CanvasEditor from "../components/canvas/canvasEditor";

const defaultEditorState = {
  brightness: 100,
  contrast: 100,
  sharpen: 0,
  blur: 0,

  rotate: 0,
  zoom: 1,

  translateX: 0,
  translateY: 0,

  flipHorizontal: false,
  flipVertical: false,

  grayscale: false,

  hue: 0,
  saturation: 100,

  histogramEq: false,

  segmentation: {
    seedPoint: null,
    tolerance: 25,
  },
};

function Editor() {
  const [activeCategory, setActiveCategory] = useState(null);

  // ✅ image sebagai objek { original, preview }
  const [image, setImage] = useState(null);

  const [imageInfo, setImageInfo] = useState(null);
  const [editorState, setEditorState] = useState(defaultEditorState);

  // ✅ loading state untuk operasi backend
  const [isProcessing, setIsProcessing] = useState(false);

  // ✅ ref ke element <img> di canvas, untuk flattenImageToBase64
  const imgRef = useRef(null);

  // ✅ Crop state diangkat ke sini agar canvas & TransformationTools berbagi data
  const [cropState, setCropState] = useState({
    active: false,
    rect: { x: 0, y: 0, width: 0, height: 0 },
  });

  // ✅ handler upload terpusat (pakai FileReader → base64)
  const handleUpload = (file) => {
    if (!file) return;

    const reader = new FileReader();

    reader.onload = () => {
      const base64 = reader.result;

      // Baca dimensi gambar
      const img = new Image();
      img.onload = () => {
        setImageInfo({
          width: img.width,
          height: img.height,
          size: (file.size / 1024 / 1024).toFixed(2),
          format: file.type.split("/")[1]?.toUpperCase(),
        });
      };
      img.src = base64;

      // Simpan sebagai objek { original, preview }
      setImage({ original: base64, preview: base64 });

      // Reset state saat gambar baru di-upload
      setEditorState(defaultEditorState);
      setCropState({ active: false, rect: { x: 0, y: 0, width: 0, height: 0 } });
    };

    reader.onerror = () => console.error("Gagal membaca file gambar");
    reader.readAsDataURL(file);
  };

  const handleResetAll = () => {
    setEditorState(defaultEditorState);
    setImage(null);
    setImageInfo(null);
    setActiveCategory(null);
    setCropState({ active: false, rect: { x: 0, y: 0, width: 0, height: 0 } });
  };

  return (
    <div className="h-screen w-full bg-zinc-950 text-white flex flex-col overflow-hidden font-sans">
      {/* NAVBAR */}
      <Navbar onReset={handleResetAll} onUpload={handleUpload} image={image} />

      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          activeCategory={activeCategory}
          setActiveCategory={setActiveCategory}
        />

        <div className="flex-1 flex flex-col relative bg-zinc-900 overflow-hidden">
          <main className="flex-1 flex items-center justify-center p-8 pb-[300px] bg-[radial-gradient(#27272a_1px,transparent_1px)] bg-[size:20px_20px]">
            <CanvasEditor
              image={image}
              setImage={setImage}
              imgRef={imgRef}
              editorState={editorState}
              setEditorState={setEditorState}
              setImageInfo={setImageInfo}
              isProcessing={isProcessing}
              onUpload={handleUpload}
              cropState={cropState}
              setCropState={setCropState}
            />
          </main>

          <div className="absolute bottom-0 left-0 right-0 z-30">
            <Footer
              imageInfo={imageInfo}
              image={image}
            />
          </div>
        </div>

        {/* PROPERTIES PANEL */}
        <PropertiesPanel
          activeCategory={activeCategory}
          editorState={editorState}
          setEditorState={setEditorState}
          image={image}
          setImage={setImage}
          isProcessing={isProcessing}
          setIsProcessing={setIsProcessing}
          imgRef={imgRef}
          cropState={cropState}
          setCropState={setCropState}
        />
      </div>
    </div>
  );
}

export default Editor;
