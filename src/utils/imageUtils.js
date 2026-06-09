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
 * Flatten <img> element beserta transformasi geometris-nya ke dalam canvas,
 * lalu return sebagai base64 string.
 * Dipakai sebelum mengirim gambar transformasi ke backend agar hasilnya ter-bake.
 *
 * @param {HTMLImageElement} imgElement - ref ke element <img>
 * @param {object} transform - { rotate, zoom, translateX, translateY, flipHorizontal, flipVertical }
 * @returns {string} base64 data URL
 */
export function flattenImageWithTransformToBase64(imgElement, transform = {}) {
  const {
    rotate = 0,
    zoom = 1,
    translateX = 0,
    translateY = 0,
    flipHorizontal = false,
    flipVertical = false,
  } = transform;

  const w = imgElement.naturalWidth;
  const h = imgElement.naturalHeight;

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;

  const ctx = canvas.getContext("2d");

  // Pindah origin ke tengah canvas
  ctx.translate(w / 2 + translateX, h / 2 + translateY);

  // Rotasi
  ctx.rotate((rotate * Math.PI) / 180);

  // Zoom (scale)
  ctx.scale(zoom, zoom);

  // Flip
  ctx.scale(flipHorizontal ? -1 : 1, flipVertical ? -1 : 1);

  // Gambar dengan origin di tengah
  ctx.drawImage(imgElement, -w / 2, -h / 2, w, h);

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
    sharpen: 0,
    histogramEq: false,
  }));
}
