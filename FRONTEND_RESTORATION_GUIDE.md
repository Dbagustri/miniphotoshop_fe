# Frontend Restoration Guide
## Mini Photoshop — Hybrid State Management

> **Tujuan dokumen ini:** Menghubungkan frontend yang sudah ada (CSS filter + UI shell) ke backend FastAPI tanpa mengubah tampilan/design satu pun. Semua perubahan bersifat logika dan koneksi data.

---

## 1. Ringkasan Masalah yang Ditemukan

Setelah membaca seluruh kode sumber, berikut adalah daftar bug dan broken connection yang ada:

| # | File | Masalah |
|---|------|---------|
| 1 | `canvasEditor.jsx` | Upload menggunakan `URL.createObjectURL` → menghasilkan `blob:URL` yang tidak bisa dikirim ke backend |
| 2 | `Navbar.jsx` | Punya logic upload `FileReader` (sudah benar) tapi prop `setImage` & `setOriginalImage` **tidak pernah dikirim** dari `editor.jsx` — tombol Upload di Navbar tidak berfungsi |
| 3 | `Navbar.jsx` | `handleReset` memanggil `window.location.reload()` alih-alih prop `onReset` yang dikirim dari parent |
| 4 | `PropertiesPanel.jsx` | `RestorationTools`, `BinaryEdgeTools`, `SegmentationTools` di-render **tanpa props apapun** — tombol Apply tidak bisa berfungsi |
| 5 | `RestorationTools.jsx` | UI shell — tombol Apply tidak terhubung ke API manapun |
| 6 | `BinaryEdgeTools.jsx` | UI shell — tombol Apply tidak terhubung ke API manapun |
| 7 | `SegmentationTools.jsx` | UI shell — tombol Apply tidak terhubung ke API manapun |
| 8 | `SaveModal.jsx` | Tidak menerima prop `image` — tombol "Save Image" tidak melakukan apapun |
| 9 | `Histogram.jsx` | Menggunakan data dummy `generateDummyHistogram()` — tidak terhubung ke gambar nyata |
| 10 | `ImagePreview.jsx` | Komponen CanvasEditor versi baru yang sudah dibangun tapi **belum digunakan** — editor masih pakai `canvasEditor.jsx` lama |

---

## 2. Arsitektur Target (Hybrid Approach)

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND                                 │
│                                                                  │
│  Upload → FileReader → base64                                    │
│                  ↓                                               │
│  image state = { original: base64, preview: base64 }            │
│                  ↓                                               │
│  <img> + CSS filter (real-time preview, tidak ubah pixel)        │
│                  ↓                                               │
│  Klik "Apply" pada tool backend                                  │
│                  ↓                                               │
│  flattenImageToBase64() → bake CSS filter → base64 baru         │
│                  ↓                                               │
│  POST ke FastAPI → proses OpenCV → return base64 hasil           │
│                  ↓                                               │
│  setImage({ original: sama, preview: base64_hasil })             │
│  + reset CSS filter state (sudah ter-bake)                       │
└─────────────────────────────────────────────────────────────────┘
```

### Pembagian Track

| Track | Komponen | Cara Kerja |
|-------|----------|------------|
| **CSS Track** (real-time) | Enhancement, Transformation, Color | Ubah `editorState` → CSS filter/transform di `<img>` |
| **Backend Track** | Restoration, Binary & Edge, Segmentation | Flatten → POST API → update `image.preview` |
| **Hybrid** | Save, Histogram | Flatten dulu, lalu kirim ke backend |

---

## 3. Perubahan State `image` di `editor.jsx`

```js
// ❌ SEBELUM (dua string terpisah, blob URL)
const [image, setImage] = useState(null);         // "blob:http://..."
const [originalImage, setOriginalImage] = useState(null); // "blob:http://..."

// ✅ SESUDAH (satu objek, selalu base64)
const [image, setImage] = useState(null);
// null | { original: "data:image/png;base64,...", preview: "data:image/png;base64,..." }
// original → tidak pernah berubah, untuk tombol "Hold to View Original"
// preview  → berubah setiap kali operasi backend dijalankan
```

---

## 4. File Baru yang Perlu Dibuat

### 4.1 `src/utils/imageUtils.js`

Buat file baru ini. Berisi semua helper function yang dipakai bersama.

```js
// src/utils/imageUtils.js

/**
 * Flatten <img> element beserta CSS filter-nya ke dalam canvas,
 * lalu return sebagai base64 string.
 * Dipakai sebelum mengirim gambar ke backend agar CSS filter ter-bake.
 *
 * @param {HTMLImageElement} imgElement - ref ke element <img>
 * @param {string} cssFilter - CSS filter string, contoh: "brightness(120%) blur(2px)"
 * @returns {string} base64 data URL
 */
export function flattenImageToBase64(imgElement, cssFilter = "") {
  const canvas = document.createElement("canvas");
  canvas.width = imgElement.naturalWidth;
  canvas.height = imgElement.naturalHeight;

  const ctx = canvas.getContext("2d");

  if (cssFilter && cssFilter.trim()) {
    ctx.filter = cssFilter;
  }

  ctx.drawImage(imgElement, 0, 0, canvas.width, canvas.height);

  return canvas.toDataURL("image/png");
}

/**
 * Build CSS filter string dari editorState.
 * Dipakai sebagai argumen flattenImageToBase64 dan juga di style <img>.
 *
 * @param {object} editorState
 * @returns {string} CSS filter string
 */
export function buildCssFilter(editorState) {
  return `
    brightness(${editorState.brightness ?? 100}%)
    contrast(${editorState.contrast ?? 100}%)
    blur(${editorState.blur ?? 0}px)
    grayscale(${editorState.grayscale ? 100 : 0}%)
    saturate(${editorState.saturation ?? 100}%)
    hue-rotate(${editorState.hue ?? 0}deg)
  `
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Reset nilai CSS filter di editorState ke default.
 * Dipanggil setelah backend berhasil memproses gambar
 * (karena CSS filter sudah ter-bake ke gambar baru).
 *
 * @param {function} setEditorState
 */
export function resetCssFilterState(setEditorState) {
  setEditorState((prev) => ({
    ...prev,
    brightness: 100,
    contrast: 100,
    blur: 0,
    grayscale: false,
    saturation: 100,
    hue: 0,
  }));
}
```

---

### 4.2 `src/api/imageApi.js`

Buat file baru ini. Berisi semua fungsi fetch ke backend FastAPI.

```js
// src/api/imageApi.js

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

/**
 * Helper internal: POST JSON ke endpoint backend.
 */
async function postToApi(endpoint, payload) {
  const response = await fetch(`${BASE_URL}${endpoint}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `HTTP error: ${response.status}`);
  }

  return response.json();
}

// ============================================================
// ENHANCEMENT
// Kirim: image (base64), params { brightness, contrast, sharpen, blur, histogram_eq }
// Terima: { success, image, message }
// ============================================================
export const applyEnhancement = (image, params) =>
  postToApi("/enhancement/apply", { image, params });

// ============================================================
// RESTORATION (Noise Reduction)
// Kirim: image (base64), params { filter, kernel_size, sigma, intensity }
//   filter: "gaussian" | "median" | "saltpepper"
// Terima: { success, image, message }
// ============================================================
export const applyRestoration = (image, params) =>
  postToApi("/restoration/apply", { image, params });

// ============================================================
// BINARY & EDGE
// Kirim: image (base64), params { operation, ... }
//   operation: "threshold" | "edge" | "morphology"
//   - threshold: { threshold_value, threshold_type }
//   - edge: { edge_method, lower_threshold, upper_threshold, kernel_size, sigma, direction }
//   - morphology: { morphology_type, kernel_size, iterations }
// Terima: { success, image, message }
// ============================================================
export const applyBinaryEdge = (image, params) =>
  postToApi("/edge/apply", { image, params });

// ============================================================
// SEGMENTATION
// Kirim: image (base64), params { segmentation_type, ... }
//   segmentation_type: "threshold" | "edge" | "region"
//   - threshold: { threshold, threshold_type }
//   - edge: { edge_method, edge_threshold, sensitivity }
//   - region: { seed_point: {x, y}, tolerance }
// Terima: { success, image, message }
// ============================================================
export const applySegmentation = (image, params) =>
  postToApi("/segmentation/apply", { image, params });

// ============================================================
// COLOR PROCESSING
// Kirim: image (base64), params { mode, ... }
//   mode: "grayscale" | "channel_split" | "adjustment"
// Terima: { success, image, message }
// ============================================================
export const applyColorProcessing = (image, params) =>
  postToApi("/color/apply", { image, params });

// ============================================================
// SAVE / COMPRESSION
// Kirim: image (base64), params { format, quality, compression_method, file_name }
// Terima: { success, image, file_name, estimated_size, compression_ratio, message }
// ============================================================
export const saveImage = (image, params) =>
  postToApi("/compression/save", { image, params });

// ============================================================
// HISTOGRAM ANALYSIS
// Kirim: image (base64)
// Terima: { success, histogram: { red[], green[], blue[], gray[] }, message }
// ============================================================
export const getHistogram = (image) =>
  postToApi("/histogram/analyze", { image });
```

---

## 5. Perubahan Per File (Urutan Pengerjaan)

---

### 5.1 `src/pages/editor.jsx`

**Masalah:** State gambar masih string terpisah, tidak ada `imgRef`, tidak ada `isProcessing`, props ke Navbar salah, props ke PropertiesPanel kurang.

**Ganti seluruh isi file dengan:**

```jsx
// src/pages/editor.jsx

import { useState, useRef } from "react";

import Navbar from "../components/layout/Navbar";
import Sidebar from "../components/layout/Sidebar";
import PropertiesPanel from "../components/layout/PropertiesPanel";
import Footer from "../components/layout/Footer";
import CanvasEditor from "../components/canvas/CanvasEditor";

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
  const [activeCategory, setActiveCategory] = useState(null);
  const [showBefore, setShowBefore] = useState(false);

  // ✅ BARU: image sebagai objek { original, preview }
  const [image, setImage] = useState(null);

  const [imageInfo, setImageInfo] = useState(null);
  const [editorState, setEditorState] = useState(defaultEditorState);

  // ✅ BARU: loading state untuk operasi backend
  const [isProcessing, setIsProcessing] = useState(false);

  // ✅ BARU: ref ke element <img> di canvas, untuk flattenImageToBase64
  const imgRef = useRef(null);

  // ✅ BARU: handler upload terpusat (pakai FileReader → base64)
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

      // Reset editor state ke default saat gambar baru di-upload
      setEditorState(defaultEditorState);
    };

    reader.onerror = () => console.error("Gagal membaca file gambar");
    reader.readAsDataURL(file);
  };

  const handleResetAll = () => {
    setEditorState(defaultEditorState);
    setImage(null);
    setImageInfo(null);
    setShowBefore(false);
    setActiveCategory(null);
  };

  return (
    <div className="h-screen w-full bg-zinc-950 text-white flex flex-col overflow-hidden font-sans">
      {/* NAVBAR — kirim onUpload dan onReset */}
      <Navbar onReset={handleResetAll} onUpload={handleUpload} image={image} />

      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          activeCategory={activeCategory}
          setActiveCategory={setActiveCategory}
        />

        <div className="flex-1 flex flex-col relative bg-zinc-900 overflow-hidden">
          <main className="flex-1 flex items-center justify-center p-8 pb-20 bg-[radial-gradient(#27272a_1px,transparent_1px)] bg-[size:20px_20px]">
            {/* ✅ BARU: kirim imgRef, isProcessing, onUpload */}
            <CanvasEditor
              image={image}
              setImage={setImage}
              imgRef={imgRef}
              showBefore={showBefore}
              editorState={editorState}
              setEditorState={setEditorState}
              setImageInfo={setImageInfo}
              isProcessing={isProcessing}
              onUpload={handleUpload}
            />
          </main>

          <div className="absolute bottom-0 left-0 right-0 z-30">
            <Footer
              showBefore={showBefore}
              setShowBefore={setShowBefore}
              imageInfo={imageInfo}
              image={image}
            />
          </div>
        </div>

        {/* PROPERTIES PANEL — kirim semua yang dibutuhkan tool backend */}
        <PropertiesPanel
          activeCategory={activeCategory}
          editorState={editorState}
          setEditorState={setEditorState}
          image={image}
          setImage={setImage}
          isProcessing={isProcessing}
          setIsProcessing={setIsProcessing}
          imgRef={imgRef}
        />
      </div>
    </div>
  );
}

export default Editor;
```

---

### 5.2 `src/components/canvas/canvasEditor.jsx`

**Masalah:** Upload menggunakan `URL.createObjectURL` (blob URL). Perlu diubah ke `onUpload` prop, dan `imgRef` perlu di-attach ke element `<img>`.

**Ubah dua bagian:**

**Bagian 1 — Ganti signature props dan handleUpload:**

```jsx
// ❌ SEBELUM
function CanvasEditor({
  image,
  originalImage,
  setImage,
  setOriginalImage,
  showBefore,
  editorState,
  setEditorState,
  setImageInfo,
}) {
  // ...
  const handleUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const imageURL = URL.createObjectURL(file);  // ❌ blob URL
    const img = new Image();
    img.onload = () => {
      setImageInfo({ ... });
    };
    img.src = imageURL;
    setImage(imageURL);
    setOriginalImage(imageURL);
  };
```

```jsx
// ✅ SESUDAH
function CanvasEditor({
  image,
  setImage,
  imgRef,           // ✅ tambahan
  showBefore,
  editorState,
  setEditorState,
  setImageInfo,     // boleh tetap ada untuk imageInfo dari upload zone
  isProcessing,     // ✅ tambahan (untuk overlay loading jika diperlukan)
  onUpload,         // ✅ tambahan: callback upload terpusat dari editor.jsx
}) {
  // ...
  const handleUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    onUpload(file);   // ✅ delegasikan ke handler di editor.jsx
  };
```

**Bagian 2 — Attach `imgRef` ke element `<img>`:**

```jsx
// ❌ SEBELUM
<img
  src={currentImage}
  alt="preview"
  draggable={false}
  onMouseDown={handleMouseDown}
  onClick={handleSeedPoint}
  className={`...`}
  style={{ filter: `...`, transform: `...` }}
/>
```

```jsx
// ✅ SESUDAH — tambahkan ref={imgRef}
<img
  ref={imgRef}          // ✅ tambahkan ini
  src={currentImage}
  alt="preview"
  draggable={false}
  onMouseDown={handleMouseDown}
  onClick={handleSeedPoint}
  className={`...`}
  style={{ filter: `...`, transform: `...` }}
/>
```

**Bagian 3 — Sesuaikan `currentImage` karena image sekarang objek:**

```jsx
// ❌ SEBELUM
const currentImage = showBefore ? originalImage : image;

// ✅ SESUDAH
const currentImage = showBefore ? image?.original : image?.preview;
```

---

### 5.3 `src/components/layout/Navbar.jsx`

**Masalah:** (1) Props `setImage` & `setOriginalImage` tidak pernah dikirim dari `editor.jsx`, (2) `handleReset` memanggil `window.location.reload()` bukan prop `onReset`.

**Ganti seluruh isi file dengan:**

```jsx
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
```

---

### 5.4 `src/components/layout/PropertiesPanel.jsx`

**Masalah:** `RestorationTools`, `BinaryEdgeTools`, `SegmentationTools` tidak menerima props apapun — mereka tidak tahu gambar apa yang sedang diedit dan tidak bisa memanggil API.

**Ganti seluruh isi file dengan:**

```jsx
// src/components/layout/PropertiesPanel.jsx

import EnhancementTools from "../tools/EnhancementTools";
import TransformationTools from "../tools/TransformationTools";
import RestorationTools from "../tools/RestorationTools";
import BinaryEdgeTools from "../tools/BinaryEdgeTools";
import ColorProcessingTools from "../tools/ColorProcessingTools";
import SegmentationTools from "../tools/SegmentationTools";

function PropertiesPanel({
  activeCategory,
  editorState,
  setEditorState,
  // ✅ Props baru untuk tool backend
  image,
  setImage,
  isProcessing,
  setIsProcessing,
  imgRef,
}) {
  // Props yang dipakai semua tool backend
  const backendToolProps = {
    image,
    setImage,
    isProcessing,
    setIsProcessing,
    editorState,
    setEditorState,
    imgRef,
  };

  const toolComponents = {
    Enhancement: (
      <EnhancementTools
        editorState={editorState}
        setEditorState={setEditorState}
        // ✅ Enhancement juga bisa pakai backend untuk histogramEq dan sharpen
        {...backendToolProps}
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

    // ✅ PERBAIKAN: Restoration sekarang menerima semua props yang dibutuhkan
    Restoration: <RestorationTools {...backendToolProps} />,

    // ✅ PERBAIKAN: BinaryEdge sekarang menerima semua props yang dibutuhkan
    "Binary & Edge": <BinaryEdgeTools {...backendToolProps} />,

    // ✅ PERBAIKAN: Segmentation sekarang menerima semua props yang dibutuhkan
    Segmentation: <SegmentationTools {...backendToolProps} />,
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
```

---

### 5.5 `src/components/tools/RestorationTools.jsx`

**Masalah:** Tombol Apply tidak terhubung ke apapun.

**Ganti seluruh isi file dengan:**

```jsx
// src/components/tools/RestorationTools.jsx

import { useState } from "react";
import { flattenImageToBase64, buildCssFilter, resetCssFilterState } from "../../utils/imageUtils";
import { applyRestoration } from "../../api/imageApi";

export default function RestorationTools({
  image,
  setImage,
  isProcessing,
  setIsProcessing,
  editorState,
  setEditorState,
  imgRef,
}) {
  const [selectedFilter, setSelectedFilter] = useState("gaussian");
  const [kernelSize, setKernelSize] = useState(3);
  const [sigma, setSigma] = useState(1.5);
  const [intensity, setIntensity] = useState(50);
  const [error, setError] = useState(null);

  const handleApply = async () => {
    if (!image || !imgRef?.current) return;

    setIsProcessing(true);
    setError(null);

    try {
      // 1. Bake CSS filter ke gambar sebelum dikirim ke backend
      const flatBase64 = flattenImageToBase64(
        imgRef.current,
        buildCssFilter(editorState)
      );

      // 2. Kirim ke backend
      const result = await applyRestoration(flatBase64, {
        filter: selectedFilter,
        kernel_size: Number(kernelSize),
        sigma: Number(sigma),
        intensity: Number(intensity),
      });

      if (result.success) {
        // 3. Update preview dengan hasil dari backend
        setImage((prev) => ({ ...prev, preview: result.image }));
        // 4. Reset CSS filter (sudah ter-bake)
        resetCssFilterState(setEditorState);
      } else {
        setError(result.message || "Gagal memproses gambar");
      }
    } catch (err) {
      setError("Tidak dapat terhubung ke server. Pastikan backend berjalan.");
      console.error("Restoration error:", err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReset = () => {
    if (!image) return;
    // Kembalikan preview ke original
    setImage((prev) => ({ ...prev, preview: prev.original }));
    resetCssFilterState(setEditorState);
    setError(null);
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
      {/* Filter Selection */}
      <div>
        <label className="text-xs text-zinc-400 font-medium uppercase tracking-wider mb-3 block">
          Filter Type
        </label>

        <div className="space-y-2">
          {[
            { id: "gaussian", label: "Gaussian Blur" },
            { id: "median", label: "Median Filter" },
            { id: "saltpepper", label: "Salt & Pepper Removal" },
          ].map((filter) => (
            <label
              key={filter.id}
              className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition
                ${
                  selectedFilter === filter.id
                    ? "bg-blue-600/10 border-blue-500"
                    : "bg-zinc-900/50 border-zinc-800 hover:bg-zinc-800"
                }`}
            >
              <input
                type="radio"
                name="restoration-filter"
                checked={selectedFilter === filter.id}
                onChange={() => setSelectedFilter(filter.id)}
                className="accent-blue-500"
              />
              <span className="text-sm text-zinc-300">{filter.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Gaussian Blur */}
      {selectedFilter === "gaussian" && (
        <div className="space-y-5">
          <Slider label="Kernel Size" value={kernelSize} min={1} max={31} step={2} onChange={setKernelSize} />
          <Slider label="Sigma" value={sigma} min={0} max={10} step={0.1} onChange={setSigma} />
        </div>
      )}

      {/* Median Filter */}
      {selectedFilter === "median" && (
        <Slider label="Kernel Size" value={kernelSize} min={1} max={15} step={2} onChange={setKernelSize} />
      )}

      {/* Salt & Pepper */}
      {selectedFilter === "saltpepper" && (
        <Slider label="Noise Reduction" value={intensity} min={0} max={100} onChange={setIntensity} />
      )}

      {/* Error message */}
      {error && (
        <p className="text-xs text-red-400 bg-red-900/20 border border-red-800 rounded-lg p-3">
          {error}
        </p>
      )}

      {/* Buttons */}
      <div className="pt-4 space-y-2">
        <button
          onClick={handleApply}
          disabled={!image || isProcessing}
          className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold uppercase rounded-lg transition"
        >
          {isProcessing ? "Processing..." : "Apply"}
        </button>

        <button
          onClick={handleReset}
          disabled={!image || isProcessing}
          className="w-full py-2.5 bg-transparent border border-zinc-800 text-zinc-500 hover:text-zinc-300 disabled:opacity-40 disabled:cursor-not-allowed text-xs font-bold uppercase rounded-lg transition"
        >
          Reset
        </button>
      </div>
    </div>
  );
}

function Slider({ label, value, min, max, step = 1, onChange }) {
  return (
    <div>
      <div className="flex justify-between items-center mb-2">
        <label className="text-xs text-zinc-400 font-medium uppercase tracking-wider">
          {label}
        </label>
        <span className="text-[10px] bg-zinc-800 px-1.5 py-0.5 rounded text-zinc-300">
          {value}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-1 bg-zinc-800 appearance-none accent-blue-500 cursor-pointer"
      />
    </div>
  );
}
```

---

### 5.6 `src/components/tools/BinaryEdgeTools.jsx`

**Masalah:** Tombol Apply tidak terhubung ke apapun.

**Tambahkan props dan logic berikut** (pola yang sama persis dengan RestorationTools):

**Ubah baris pertama** (import + signature) dan **tombol Apply/Reset**:

```jsx
// ✅ Tambahkan import di bagian atas
import { flattenImageToBase64, buildCssFilter, resetCssFilterState } from "../../utils/imageUtils";
import { applyBinaryEdge } from "../../api/imageApi";

// ✅ Ganti signature fungsi
export default function BinaryEdgeTools({
  image,
  setImage,
  isProcessing,
  setIsProcessing,
  editorState,
  setEditorState,
  imgRef,
}) {
  // ... semua useState yang sudah ada, tetap tidak diubah ...
  const [error, setError] = useState(null); // ✅ tambahkan ini

  // ✅ Tambahkan fungsi handleApply
  const handleApply = async () => {
    if (!image || !imgRef?.current) return;

    setIsProcessing(true);
    setError(null);

    try {
      const flatBase64 = flattenImageToBase64(
        imgRef.current,
        buildCssFilter(editorState)
      );

      // Bangun params berdasarkan operation yang aktif
      const params = {
        operation,
        // threshold params
        threshold_value: Number(thresholdValue),
        threshold_type: thresholdType,
        // edge params
        edge_method: edgeMethod,
        lower_threshold: Number(lowerThreshold),
        upper_threshold: Number(upperThreshold),
        kernel_size: Number(kernelSize),
        sigma: Number(sigma),
        direction,
        // morphology params
        morphology_type: morphologyType,
        iterations: Number(iterations),
      };

      const result = await applyBinaryEdge(flatBase64, params);

      if (result.success) {
        setImage((prev) => ({ ...prev, preview: result.image }));
        resetCssFilterState(setEditorState);
      } else {
        setError(result.message || "Gagal memproses gambar");
      }
    } catch (err) {
      setError("Tidak dapat terhubung ke server.");
      console.error("BinaryEdge error:", err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReset = () => {
    if (!image) return;
    setImage((prev) => ({ ...prev, preview: prev.original }));
    resetCssFilterState(setEditorState);
    setError(null);
  };
```

**Ganti blok tombol** (di bagian bawah JSX, bagian `{/* Buttons */}`):

```jsx
{/* Error message */}
{error && (
  <p className="text-xs text-red-400 bg-red-900/20 border border-red-800 rounded-lg p-3">
    {error}
  </p>
)}

{/* Buttons */}
<div className="pt-4 space-y-2">
  <button
    onClick={handleApply}
    disabled={!image || isProcessing}
    className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold uppercase rounded-lg transition"
  >
    {isProcessing ? "Processing..." : "Apply"}
  </button>

  <button
    onClick={handleReset}
    disabled={!image || isProcessing}
    className="w-full py-2.5 bg-transparent border border-zinc-800 text-zinc-500 hover:text-zinc-300 disabled:opacity-40 disabled:cursor-not-allowed text-xs font-bold uppercase rounded-lg transition"
  >
    Reset
  </button>
</div>
```

---

### 5.7 `src/components/tools/SegmentationTools.jsx`

**Masalah:** Tombol Apply tidak terhubung ke apapun. State `seedPoint` di komponen ini tidak sinkron dengan `editorState.segmentation.seedPoint` di `canvasEditor.jsx`.

**Tambahkan import dan ubah signature:**

```jsx
// ✅ Tambahkan import di bagian atas
import { flattenImageToBase64, buildCssFilter, resetCssFilterState } from "../../utils/imageUtils";
import { applySegmentation } from "../../api/imageApi";

// ✅ Ganti signature fungsi
export default function SegmentationTools({
  image,
  setImage,
  isProcessing,
  setIsProcessing,
  editorState,   // ✅ seedPoint ada di editorState.segmentation.seedPoint
  setEditorState,
  imgRef,
}) {
  // ... semua useState yang sudah ada tetap ada ...
  const [error, setError] = useState(null); // ✅ tambahkan ini

  // ✅ Tambahkan handleApply
  const handleApply = async () => {
    if (!image || !imgRef?.current) return;

    setIsProcessing(true);
    setError(null);

    try {
      const flatBase64 = flattenImageToBase64(
        imgRef.current,
        buildCssFilter(editorState)
      );

      const params = {
        segmentation_type: segmentationType,
        // threshold params
        threshold: Number(threshold),
        threshold_type: thresholdType,
        // edge params
        edge_method: edgeMethod,
        edge_threshold: Number(edgeThreshold),
        sensitivity: Number(sensitivity),
        // region params
        seed_point: editorState.segmentation?.seedPoint || null,
        tolerance: Number(tolerance),
      };

      const result = await applySegmentation(flatBase64, params);

      if (result.success) {
        setImage((prev) => ({ ...prev, preview: result.image }));
        resetCssFilterState(setEditorState);
      } else {
        setError(result.message || "Gagal memproses gambar");
      }
    } catch (err) {
      setError("Tidak dapat terhubung ke server.");
      console.error("Segmentation error:", err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReset = () => {
    if (!image) return;
    setImage((prev) => ({ ...prev, preview: prev.original }));
    resetCssFilterState(setEditorState);
    setError(null);
  };
```

**Ganti blok tombol** (sama persis dengan BinaryEdgeTools di atas):

```jsx
{/* Error message */}
{error && (
  <p className="text-xs text-red-400 bg-red-900/20 border border-red-800 rounded-lg p-3">
    {error}
  </p>
)}

{/* Buttons */}
<div className="pt-4 space-y-2">
  <button
    onClick={handleApply}
    disabled={!image || isProcessing}
    className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold uppercase rounded-lg transition"
  >
    {isProcessing ? "Processing..." : "Apply"}
  </button>

  <button
    onClick={handleReset}
    disabled={!image || isProcessing}
    className="w-full py-2.5 bg-transparent border border-zinc-800 text-zinc-500 hover:text-zinc-300 disabled:opacity-40 disabled:cursor-not-allowed text-xs font-bold uppercase rounded-lg transition"
  >
    Reset
  </button>
</div>
```

---

### 5.8 `src/components/layout/modals/SaveModal.jsx`

**Masalah:** Tidak menerima `image` prop → tombol "Save Image" tidak melakukan apapun.

**Ubah signature dan tambahkan handleSave:**

```jsx
// ✅ Tambahkan import
import { saveImage } from "../../../api/imageApi";

// ✅ Ganti signature
export default function SaveModal({ isOpen, onClose, image }) {
  const [fileName, setFileName] = useState("edited-image");
  const [format, setFormat] = useState("jpg");
  const [quality, setQuality] = useState(30);
  const [compressionMethod, setCompressionMethod] = useState("quantization");
  const [isSaving, setIsSaving] = useState(false);  // ✅ tambahkan
  const [resultInfo, setResultInfo] = useState(null); // ✅ untuk estimated size & ratio dari backend

  if (!isOpen) return null;

  // ✅ Tambahkan handleSave
  const handleSave = async () => {
    if (!image) return;

    setIsSaving(true);
    try {
      const result = await saveImage(image.preview, {
        file_name: fileName,
        format,
        quality: Number(quality),
        compression_method: compressionMethod,
      });

      if (result.success) {
        // Trigger download dari base64
        const link = document.createElement("a");
        link.href = result.image;
        link.download = `${fileName}.${format}`;
        link.click();

        // Update info display
        setResultInfo({
          estimatedSize: result.estimated_size || "—",
          compressionRatio: result.compression_ratio || "—",
        });

        onClose();
      }
    } catch (err) {
      console.error("Save error:", err);
    } finally {
      setIsSaving(false);
    }
  };
```

**Ubah tombol "Save Image":**

```jsx
// ❌ SEBELUM
<button className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium transition">
  Save Image
</button>

// ✅ SESUDAH
<button
  onClick={handleSave}
  disabled={!image || isSaving}
  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-medium transition"
>
  {isSaving ? "Saving..." : "Save Image"}
</button>
```

---

### 5.9 `src/components/histogram/Histogram.jsx`

**Masalah:** Menggunakan data dummy. Perlu dihubungkan ke backend.

Komponen `Histogram` sudah menerima prop `data`. Yang perlu ditambahkan adalah **pemanggil API-nya di komponen parent** (`Footer.jsx`).

**Ubah `src/components/layout/Footer.jsx`** — tambahkan pemanggilan histogram:

```jsx
// ✅ Tambahkan import di Footer.jsx
import { useState, useEffect } from "react";
import { getHistogram } from "../../api/imageApi";
import Histogram from "../histogram/Histogram";

// ✅ Footer menerima prop image (sudah dikirim dari editor.jsx di langkah 5.1)
function Footer({ showBefore, setShowBefore, imageInfo, image }) {
  const [isOpen, setIsOpen] = useState(false);
  const [histogramData, setHistogramData] = useState(null);
  const [histogramType, setHistogramType] = useState("rgb");

  // ✅ Fetch histogram setiap kali image.preview berubah dan panel terbuka
  useEffect(() => {
    if (!isOpen || !image?.preview) return;

    getHistogram(image.preview)
      .then((result) => {
        if (result.success) {
          // Backend mengembalikan { red[], green[], blue[], gray[] }
          // Format ke struktur yang dipakai recharts di Histogram.jsx
          const formatted = Array.from({ length: 256 }, (_, i) => ({
            intensity: i,
            red: result.histogram.red?.[i] ?? 0,
            green: result.histogram.green?.[i] ?? 0,
            blue: result.histogram.blue?.[i] ?? 0,
            gray: result.histogram.gray?.[i] ?? 0,
          }));
          setHistogramData(formatted);
        }
      })
      .catch((err) => console.error("Histogram error:", err));
  }, [image?.preview, isOpen]);
```

**Di dalam JSX Footer, ganti placeholder histogram:**

```jsx
// ❌ SEBELUM
<div className="w-64 h-24 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-600 text-sm">
  Histogram Preview
</div>

// ✅ SESUDAH
<div className="w-64">
  <div className="flex gap-2 mb-2">
    {["rgb", "grayscale"].map((t) => (
      <button
        key={t}
        onClick={() => setHistogramType(t)}
        className={`text-[10px] uppercase px-2 py-1 rounded-md border transition ${
          histogramType === t
            ? "bg-blue-600/20 border-blue-500 text-blue-400"
            : "bg-zinc-900 border-zinc-800 text-zinc-500"
        }`}
      >
        {t}
      </button>
    ))}
  </div>
  <Histogram type={histogramType} data={histogramData} />
</div>
```

---

## 6. Variabel Environment

Buat file `.env` di root folder frontend:

```env
# .env
VITE_API_URL=http://localhost:8000
```

---

## 7. Checklist Pengerjaan

Kerjakan **berurutan** karena ada dependency antar file:

- [ ] **Step 1** — Buat `src/utils/imageUtils.js`
- [ ] **Step 2** — Buat `src/api/imageApi.js`
- [ ] **Step 3** — Update `src/pages/editor.jsx`
- [ ] **Step 4** — Update `src/components/canvas/canvasEditor.jsx`
- [ ] **Step 5** — Update `src/components/layout/Navbar.jsx`
- [ ] **Step 6** — Update `src/components/layout/PropertiesPanel.jsx`
- [ ] **Step 7** — Update `src/components/tools/RestorationTools.jsx`
- [ ] **Step 8** — Update `src/components/tools/BinaryEdgeTools.jsx`
- [ ] **Step 9** — Update `src/components/tools/SegmentationTools.jsx`
- [ ] **Step 10** — Update `src/components/layout/modals/SaveModal.jsx`
- [ ] **Step 11** — Update `src/components/layout/Footer.jsx` (histogram)
- [ ] **Step 12** — Buat `.env` di root frontend

---

## 8. Cara Verifikasi Setelah Perubahan

### Test Upload
1. Buka aplikasi → klik Upload (di Navbar atau drag-drop area)
2. Pilih gambar → gambar harus tampil di canvas
3. Buka DevTools → Console: tidak boleh ada error `blob:` URL

### Test CSS Filter (Enhancement)
1. Upload gambar → klik Enhancement di sidebar
2. Geser slider Brightness → gambar langsung berubah real-time ✅
3. Ini tidak memanggil backend — normal

### Test Backend Tool (Restoration)
1. Upload gambar
2. Klik Restoration di sidebar
3. Pilih Gaussian Blur → klik Apply
4. DevTools → Network tab: harus ada POST ke `localhost:8000/restoration/apply`
5. Gambar di canvas harus berubah dengan hasil dari backend

### Test Before/After
1. Upload gambar → apply beberapa operasi
2. Tahan tombol "Hold to View Original" di footer
3. Harus tampil gambar original (sebelum diedit) ✅

### Test Save
1. Upload gambar → apply operasi
2. Klik Save di Navbar → isi form → klik "Save Image"
3. File harus terdownload ke komputer

---

## 9. Catatan Tambahan

### Tentang `ImagePreview.jsx`
File `src/components/canvas/ImagePreview.jsx` yang ada di project adalah versi CanvasEditor yang sudah dirancang untuk state `{ original, preview }`. File ini **tidak digunakan** saat ini karena `editor.jsx` masih mengimport dari `canvasEditor.jsx`. Setelah restorasi ini selesai, `canvasEditor.jsx` yang sudah dimodifikasi sudah kompatibel dan `ImagePreview.jsx` bisa dijadikan referensi atau pengganti di masa depan.

### EnhancementTools & ColorProcessingTools
Dua komponen ini sudah terhubung ke `editorState` dan bekerja via CSS filter. Tidak perlu diubah untuk fungsionalitas dasar. Namun **Histogram Equalization** (`histogramEq: true`) dan **Sharpen** yang ada di `editorState` belum terhubung ke backend — keduanya perlu di-handle di endpoint `/enhancement/apply` dan dipanggil saat tombol "Apply All" diklik.

### EnhancementTools Apply All
Untuk menghubungkan tombol "Apply All" di EnhancementTools ke backend (opsional, untuk histogramEq dan sharpen):
```jsx
// Pola yang sama dengan tool lain, tambahkan ke EnhancementTools.jsx
const handleApplyAll = async () => {
  // flatten → POST ke /enhancement/apply dengan params brightness, contrast, sharpen, histogram_eq
  // update image.preview → reset CSS filter state
};
```
