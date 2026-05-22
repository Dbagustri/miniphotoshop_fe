// src/components/layout/Sidebar.jsx
import {
  Sparkles,
  Maximize,
  RotateCcw,
  Zap,
  Palette,
  Scissors,
} from "lucide-react"; // Opsional: install lucide-react atau gunakan SVG

const categories = [
  { name: "Enhancement", icon: <Sparkles size={18} /> },
  { name: "Transformation", icon: <Maximize size={18} /> },
  { name: "Restoration", icon: <RotateCcw size={18} /> },
  { name: "Binary & Edge", icon: <Zap size={18} /> },
  { name: "Color Processing", icon: <Palette size={18} /> },
  { name: "Segmentation", icon: <Scissors size={18} /> },
];

function Sidebar({ activeCategory, setActiveCategory }) {
  return (
    <aside className="w-64 h-full bg-zinc-950 border-r border-zinc-800 p-5 flex flex-col">
      <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500 mb-6 px-2">
        Tools
      </h2>
      <nav className="flex flex-col gap-1.5">
        {categories.map((category) => (
          <button
            key={category.name}
            onClick={() => setActiveCategory(category.name)}
            className={`
              group flex items-center gap-3 w-full px-3 py-2.5 rounded-xl transition-all duration-200
              ${
                activeCategory === category.name
                  ? "bg-blue-600/10 text-blue-400 border border-blue-600/20"
                  : "text-zinc-400 hover:text-white hover:bg-zinc-900 border border-transparent"
              }
            `}
          >
            <span
              className={`${activeCategory === category.name ? "text-blue-500" : "text-zinc-500 group-hover:text-blue-500"}`}
            >
              {category.icon}
            </span>
            <span className="text-sm font-medium">{category.name}</span>
          </button>
        ))}
      </nav>
    </aside>
  );
}

export default Sidebar;
