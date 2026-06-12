const defaultApiHost = window.location.hostname || 'localhost';
const API_URL = process.env.REACT_APP_API_URL || `http://${defaultApiHost}:8080/api`;

export async function api(path, options = {}) {
  const token = localStorage.getItem('llc_token');
  const headers = { ...(options.headers || {}) };
  if (token) headers.Authorization = `Bearer ${token}`;
  if (options.body && !(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  let response;
  try {
    response = await fetch(`${API_URL}${path}`, { ...options, headers });
  } catch (error) {
    throw new Error(`Cannot reach the LLC backend at ${API_URL}. Check that Spring Boot is running and restart it after configuration changes.`);
  }
  const contentType = response.headers.get('content-type') || '';
  const data = contentType.includes('application/json') ? await response.json() : await response.text();
  if (!response.ok) {
    if (response.status === 401) window.dispatchEvent(new Event('llc:unauthorized'));
    const message = typeof data === 'string' ? data : data.message;
    throw new Error(message || 'Something went wrong');
  }
  return data;
}

export const jsonBody = (value) => JSON.stringify(value);
