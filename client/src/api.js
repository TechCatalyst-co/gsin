// Minimal fetch wrapper. Auth is carried by an HttpOnly cookie the server sets.
// Pass a FormData body (e.g. a file upload) to send multipart — the browser
// sets the Content-Type (with boundary) itself, so we must not force JSON.

// Versioned API prefix. The server also serves the unversioned `/api/*` for
// older clients; new builds pin to a version so future changes can ship as v2.
const API_PREFIX = '/api/v1';

export async function api(path, { method = 'GET', body } = {}) {
  const isForm = typeof FormData !== 'undefined' && body instanceof FormData;
  const headers = isForm ? {} : { 'Content-Type': 'application/json' };

  const res = await fetch(`${API_PREFIX}${path}`, {
    method,
    headers,
    credentials: 'include',
    body: body ? (isForm ? body : JSON.stringify(body)) : undefined,
  });

  let data = null;
  try {
    data = await res.json();
  } catch {
    /* no body */
  }

  if (!res.ok) {
    const err = new Error((data && data.error) || `Request failed (${res.status})`);
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}
