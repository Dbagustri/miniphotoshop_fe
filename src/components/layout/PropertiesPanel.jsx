// src/components/layout/PropertiesPanel.jsx

import EnhancementTools from "../tools/EnhancementTools";
import TransformationTools from "../tools/TransformationTools";
import RestorationTools from "../tools/RestorationTools";
import BinaryEdgeTools from "../tools/BinaryEdgeTools";
import ColorProcessingTools from "../tools/ColorProcessingTools";
import SegmentationTools from "../tools/SegmentationTools";

function PropertiesPanel({ activeCategory, editorState, setEditorState }) {
  const toolComponents = {
    Enhancement: (
      <EnhancementTools
        editorState={editorState}
        setEditorState={setEditorState}
      />
    ),

    Transformation: (
      <TransformationTools
        editorState={editorState}
        setEditorState={setEditorState}
      />
    ),

    "Color Processing": (
      <ColorProcessingTools
        editorState={editorState}
        setEditorState={setEditorState}
      />
    ),

    Restoration: <RestorationTools />,

    "Binary & Edge": <BinaryEdgeTools />,

    Segmentation: <SegmentationTools />,
  };

  return (
    <aside className="w-80 h-full bg-zinc-950 border-l border-zinc-800 flex flex-col overflow-hidden">
      <div className="p-5 border-b border-zinc-800/50 bg-zinc-950/80 backdrop-blur-sm z-10">
        <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
          Properties
        </h2>
      </div>

      <div className="flex-1 overflow-y-auto p-5 custom-scrollbar">
        {!activeCategory ? (
          <div className="h-full flex flex-col items-center justify-center opacity-30 text-center space-y-4">
            <p className="text-xs text-zinc-500">Pick a tool to start</p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="mb-6">
              <span className="text-2xl font-bold text-white block mb-1">
                {activeCategory}
              </span>

              <div className="h-1 w-8 bg-blue-600 rounded-full"></div>
            </div>

            {toolComponents[activeCategory]}
          </div>
        )}
      </div>
    </aside>
  );
}

export default PropertiesPanel;
