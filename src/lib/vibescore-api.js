'use strict';

const { parseRetryAfterMs } = require('./upload-throttle');

async function signInWithPassword({ baseUrl, email, password }) {
  const url = new URL('/api/auth/sessions', baseUrl).toString();
  const { data } = await requestJson({
    url,
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: { email, password },
    errorPrefix: 'Sign-in failed'
  });

  const accessToken = data?.accessToken;
  if (typeof accessToken !== 'string' || accessToken.length === 0) {
    throw new Error('Sign-in failed: missing accessToken');
  }

  return accessToken;
}

async function issueDeviceToken({ baseUrl, accessToken, deviceName, platform = 'macos' }) {
  const url = new URL('/functions/vibescore-device-token-issue', baseUrl).toString();
  const { data } = await requestJson({
    url,
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: { device_name: deviceName, platform },
    errorPrefix: 'Device token issue failed'
  });

  const token = data?.token;
  const deviceId = data?.device_id;
  if (typeof token !== 'string' || token.length === 0) throw new Error('Device token issue failed: missing token');
  if (typeof deviceId !== 'string' || deviceId.length === 0) {
    throw new Error('Device token issue failed: missing device_id');
  }

  return { token, deviceId };
}

async function ingestEvents({ baseUrl, deviceToken, events }) {
  const url = new URL('/functions/vibescore-ingest', baseUrl).toString();
  const { data } = await requestJson({
    url,
    method: 'POST',
    headers: {
      Authorization: `Bearer ${deviceToken}`,
      'Content-Type': 'application/json'
    },
    body: { events },
    errorPrefix: 'Ingest failed'
  });

  return {
    inserted: Number(data?.inserted || 0),
    skipped: Number(data?.skipped || 0)
  };
}

module.exports = {
  signInWithPassword,
  issueDeviceToken,
  ingestEvents
};

async function requestJson({ url, method, headers, body, errorPrefix }) {
  const res = await fetch(url, {
    method: method || 'GET',
    headers: {
      ...(headers || {})
    },
    body: body == null ? undefined : JSON.stringify(body)
  });

  const text = await res.text();
  let data = null;
  try {
    data = JSON.parse(text);
  } catch (_e) {}

  if (!res.ok) {
    const msg = data?.error || data?.message || `HTTP ${res.status}`;
    const err = new Error(errorPrefix ? `${errorPrefix}: ${msg}` : msg);
    err.status = res.status;
    err.data = data;
    err.retryAfterMs = parseRetryAfterMs(res.headers.get('Retry-After'));
    throw err;
  }

  return { res, data };
}

