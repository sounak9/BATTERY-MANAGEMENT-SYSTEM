// Small helper to normalize the backend base URL and API URL
export function getBackendOrigin() {
  const raw = (process.env.REACT_APP_API_URL || "http://localhost:8000").trim();
  // remove trailing slash
  const noSlash = raw.replace(/\/$/, "");
  // if env includes '/api' at the end, strip it
  return noSlash.replace(/\/api$/, "");
}

export function getApiUrl() {
  const origin = getBackendOrigin();
  return `${origin}/api`;
}
