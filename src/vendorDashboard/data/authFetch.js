import { API_URL } from './apiPath';

// Session helper: the access token is short-lived; a long-lived refresh token silently renews it.
// authFetch() behaves like fetch() + adds the login token. If the server says the access token
// expired, it refreshes once (shared by all in-flight requests) and retries the original request.

export const saveSession = ({ token, refreshToken }) => {
  if (token) localStorage.setItem('loginToken', token);
  if (refreshToken) localStorage.setItem('refreshToken', refreshToken);
};

export const clearSession = () => {
  ['loginToken', 'refreshToken', 'firmId', 'firmName'].forEach((k) => localStorage.removeItem(k));
};

let refreshing = null;

// true = renewed, false = could not renew (network error), 'expired' = server rejected the session
const renewSession = () => {
  if (!refreshing) {
    refreshing = (async () => {
      const refreshToken = localStorage.getItem('refreshToken');
      if (!refreshToken) return 'expired';
      try {
        const res = await fetch(`${API_URL}/vendor/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken }),
        });
        if (res.ok) {
          saveSession(await res.json());
          return true;
        }
        return res.status === 401 || res.status === 400 ? 'expired' : false;
      } catch {
        return false; // offline etc.: keep the session, try again on the next request
      }
    })().finally(() => {
      refreshing = null;
    });
  }
  return refreshing;
};

export const authFetch = async (url, options = {}) => {
  const send = () =>
    fetch(url, {
      ...options,
      headers: { ...(options.headers || {}), Authorization: `Bearer ${localStorage.getItem('loginToken')}` },
    });

  let res = await send();
  if (res.status === 401) {
    const body = await res.clone().json().catch(() => ({}));
    if (body.code === 'TOKEN_EXPIRED') {
      const renewed = await renewSession();
      if (renewed === true) {
        res = await send();
      } else if (renewed === 'expired') {
        clearSession();
        alert('Your session has expired. Please log in again.');
        window.location.reload();
      }
    }
  }
  return res;
};

// Ends this browser's session on the server too (best effort), then clears local data.
export const endSession = async () => {
  const refreshToken = localStorage.getItem('refreshToken');
  clearSession();
  if (!refreshToken) return;
  try {
    await fetch(`${API_URL}/vendor/logout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });
  } catch {
    /* ignore: the token still expires on its own */
  }
};
