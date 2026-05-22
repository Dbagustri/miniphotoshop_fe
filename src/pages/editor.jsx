// src/pages/editor.jsx

import { useState } from "react";

import Navbar from "../components/layout/Navbar";
import Sidebar from "../components/layout/Sidebar";
import PropertiesPanel from "../components/layout/PropertiesPanel";
import Footer from "../components/layout/Footer";
import CanvasEditor from "../components/canvas/CanvasEditor";

// DEFAULT STATE
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

  cropMode: false,

  segmentation: {
    seedPoint: null,
    tolerance: 25,
  },
};

function Editor() {
  // TOOL CATEGORY
  const [activeCategory, setActiveCategory] = useState(null);

  // BEFORE / AFTER
  const [showBefore, setShowBefore] = useState(false);

  // IMAGE
  const [image, setImage] = useState(null);

  const [originalImage, setOriginalImage] = useState(null);

  const [imageInfo, setImageInfo] = useState(null);

  // EDITOR STATE
  const [editorState, setEditorState] = useState(defaultEditorState);

  // RESET ALL
  const handleResetAll = () => {
    setEditorState(defaultEditorState);

    setImage(null);
    setOriginalImage(null);
    setImageInfo(null);

    setShowBefore(false);
    setActiveCategory(null);
  };

  return (
    <div className="h-screen w-full bg-zinc-950 text-white flex flex-col overflow-hidden font-sans">
      {/* NAVBAR */}
      <Navbar onReset={handleResetAll} />

      <div className="flex flex-1 overflow-hidden">
        {/* SIDEBAR */}
        <Sidebar
          activeCategory={activeCategory}
          setActiveCategory={setActiveCategory}
        />

        {/* MAIN CANVAS */}
        <div className="flex-1 flex flex-col relative bg-zinc-900 overflow-hidden">
          <main className="flex-1 flex items-center justify-center p-8 pb-20 bg-[radial-gradient(#27272a_1px,transparent_1px)] bg-[size:20px_20px]">
            <CanvasEditor
              image={image}
              originalImage={originalImage}
              setImage={setImage}
              setOriginalImage={setOriginalImage}
              showBefore={showBefore}
              editorState={editorState}
              setEditorState={setEditorState}
              setImageInfo={setImageInfo}
            />
          </main>

          {/* FOOTER */}
          <div className="absolute bottom-0 left-0 right-0 z-30">
            <Footer
              showBefore={showBefore}
              setShowBefore={setShowBefore}
              imageInfo={imageInfo}
            />
          </div>
        </div>

        {/* PROPERTIES */}
        <PropertiesPanel
          activeCategory={activeCategory}
          editorState={editorState}
          setEditorState={setEditorState}
        />
      </div>
    </div>
  );
}

export default Editor;
