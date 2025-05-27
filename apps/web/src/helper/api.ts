/** @format */

import { api_url } from './config';
import { jwtDecode } from 'jwt-decode';
import { refreshToken } from './auth/auth';

export const api = async (
  path: string,
  method: 'POST' | 'GET' | 'DELETE' | 'PATCH',
  data?: {
    body?: Record<string, unknown> | FormData;
    contentType?: 'application/json' | 'application/x-www-form-urlencoded';
  },
  token?: string,
) => {
  const headers: HeadersInit = {};

  if (data?.contentType && !(data?.body instanceof FormData)) {
    headers['Content-Type'] = data.contentType;
  }

  if (token) {
    try {
      const decoded = jwtDecode(token);
      if (decoded.exp && new Date().valueOf() >= decoded.exp * 1000) {
        const { access_token } = await refreshToken();
        headers['Authorization'] = `Bearer ${access_token}`;
      } else {
        headers['Authorization'] = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('Token error:', error);
    }
  }

  try {
    const response = await fetch(api_url + path, {
      method,
      body:
        data?.body instanceof FormData ? data.body : JSON.stringify(data?.body),
      headers,
    });

    const contentType = response.headers.get('content-type');
    if (!contentType?.includes('application/json')) {
      const text = await response.text();
      throw new Error(text || 'Invalid server response');
    }

    const json = await response.json();

    if (!response.ok) {
      throw new Error(
        JSON.stringify({
          message: json.message || 'Authentication failed',
          code: response.status,
        }),
      );
    }

    return json;
  } catch (error) {
    console.error(`API call to ${path} failed:`, error);
    throw error instanceof Error ? error : new Error('Network request failed');
  }
};
