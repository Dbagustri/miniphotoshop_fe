import { useState, useRef, useEffect } from "react";

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

  scaleX: 1.0,
  scaleY: 1.0,

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
  const [bakedState, setBakedState] = useState(defaultEditorState);

  // ✅ loading state untuk operasi backend
  const [isProcessing, setIsProcessing] = useState(false);

  // ✅ ref ke element <img> di canvas, untuk flattenImageToBase64
  const imgRef = useRef(null);

  // ✅ Crop state diangkat ke sini agar canvas & TransformationTools berbagi data
  const [cropState, setCropState] = useState({
    active: false,
    rect: { x: 0, y: 0, width: 0, height: 0 },
  });

  const [resetTrigger, setResetTrigger] = useState(0);

  // ✅ handler upload terpusat (pakai FileReader → base64)
  const handleUpload = (file) => {
    if (!file) return;

    const reader = new FileReader();

    reader.onload = () => {
      const base64 = reader.result;

      // Baca dimensi gambar dan bake ke canvas untuk menormalisasi EXIF
      const img = new Image();
      img.onload = () => {
        const width = img.naturalWidth || img.width;
        const height = img.naturalHeight || img.height;

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);

        const format = file.type || "image/png";
        const bakedBase64 = canvas.toDataURL(format);

        setImageInfo({
          width: width,
          height: height,
          size: (file.size / 1024 / 1024).toFixed(2),
          format: format.split("/")[1]?.toUpperCase(),
        });

        // Simpan sebagai objek { original, preview } dengan base64 yang sudah dibake
        setImage({ original: bakedBase64, preview: bakedBase64 });

        // Reset state saat gambar baru di-upload
        setEditorState(defaultEditorState);
        setBakedState(defaultEditorState);
        setCropState({ active: false, rect: { x: 0, y: 0, width: 0, height: 0 } });
      };
      img.src = base64;
    };

    reader.onerror = () => console.error("Gagal membaca file gambar");
    reader.readAsDataURL(file);
  };

  // Update imageInfo ketika image.preview berubah (dari hasil pemrosesan backend atau reset)
  useEffect(() => {
    if (!image?.preview) return;

    const img = new Image();
    img.onload = () => {
      setImageInfo((prev) => {
        if (!prev) return null;

        // Hitung perkiraan ukuran file dari base64 string
        const base64Content = image.preview.split(",")[1] || "";
        const sizeInBytes = Math.floor((base64Content.length * 3) / 4);
        const sizeInMB = (sizeInBytes / 1024 / 1024).toFixed(2);

        // Hanya update jika dimensi atau ukuran berubah untuk menghindari render loop tak perlu
        if (
          prev.width === img.naturalWidth &&
          prev.height === img.naturalHeight &&
          prev.size === sizeInMB
        ) {
          return prev;
        }

        return {
          ...prev,
          width: img.naturalWidth,
          height: img.naturalHeight,
          size: sizeInMB,
        };
      });
    };
    img.src = image.preview;
  }, [image?.preview]);

  const [footerOpen, setFooterOpen] = useState(false);

  const handleResetAllEdits = () => {
    if (!image) return;
    setImage((prev) => ({ ...prev, preview: prev.original }));
    setEditorState(defaultEditorState);
    setBakedState(defaultEditorState);
    setCropState({ active: false, rect: { x: 0, y: 0, width: 0, height: 0 } });
    setResetTrigger((c) => c + 1);
  };

  const handleClearImage = () => {
    setEditorState(defaultEditorState);
    setBakedState(defaultEditorState);
    setImage(null);
    setImageInfo(null);
    setActiveCategory(null);
    setCropState({ active: false, rect: { x: 0, y: 0, width: 0, height: 0 } });
  };

  return (
    <div className="h-screen w-full bg-zinc-950 text-white flex flex-col overflow-hidden font-sans">
      {/* NAVBAR */}
      <Navbar
        onResetEdits={handleResetAllEdits}
        onClearImage={handleClearImage}
        onUpload={handleUpload}
        image={image}
      />

      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          activeCategory={activeCategory}
          setActiveCategory={setActiveCategory}
        />

        <div className="flex-1 flex flex-col relative bg-zinc-900 overflow-hidden">
          <main className={`flex-1 min-h-0 overflow-hidden flex items-center justify-center p-8 bg-[radial-gradient(#27272a_1px,transparent_1px)] bg-[size:20px_20px] transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] ${footerOpen ? "pb-[300px]" : "pb-16"}`}>
            <CanvasEditor
              image={image}
              setImage={setImage}
              imgRef={imgRef}
              editorState={editorState}
              setEditorState={setEditorState}
              bakedState={bakedState}
              setImageInfo={setImageInfo}
              imageInfo={imageInfo}
              isProcessing={isProcessing}
              onUpload={handleUpload}
              cropState={cropState}
              setCropState={setCropState}
              resetTrigger={resetTrigger}
            />
          </main>

          <div className="absolute bottom-0 left-0 right-0 z-30">
            <Footer
              imageInfo={imageInfo}
              image={image}
              isOpen={footerOpen}
              setIsOpen={setFooterOpen}
            />
          </div>
        </div>

        {/* PROPERTIES PANEL */}
        <PropertiesPanel
          activeCategory={activeCategory}
          editorState={editorState}
          setEditorState={setEditorState}
          bakedState={bakedState}
          setBakedState={setBakedState}
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
