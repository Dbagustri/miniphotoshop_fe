
const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

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
export const applyEnhancement = (image, params) =>
  postToApi("/enhancement/apply", { image, params });

export const applyTransformation = (image, params) =>
  postToApi("/transformation/apply", { image, params });

export const applyRestoration = (image, params) =>
  postToApi("/restoration/apply", { image, params });

export const applyBinaryEdge = (image, params) =>
  postToApi("/edge/apply", { image, params });

export const applySegmentation = (image, params) =>
  postToApi("/segmentation/apply", { image, params });

export const applyColorProcessing = (image, params) =>
  postToApi("/color/apply", { image, params });

export const saveImage = (image, params) =>
  postToApi("/compression/save", { image, params });

export const getHistogram = (image) =>
  postToApi("/histogram/analyze", { image });
