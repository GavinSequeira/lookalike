import type {
  AdminProduct, AdminProductInput, Alternative, Category, FeedbackEntry,
  FeedbackInput, FeedbackStats, FileInfo, Product, ProductDetail, User,
} from './types';

// Production defaults stay the same; set VITE_API_URL / VITE_FLASK_URL in a
// local .env file to point at servers running on your computer.
export const API: string =
  import.meta.env.VITE_API_URL || 'https://lookalike-api-jici.onrender.com/api';
export const FLASK: string =
  import.meta.env.VITE_FLASK_URL || 'https://lookalike-flask-feedback.onrender.com';

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function request<T>(base: string, path: string, init: RequestInit = {}): Promise<T> {
  let response: Response;
  try {
    response = await fetch(base + path, {
      credentials: 'include',
      ...init,
      headers: init.body
        ? { 'Content-Type': 'application/json', ...init.headers }
        : init.headers,
    });
  } catch {
    throw new ApiError('Could not reach the server. It may be waking up — try again in a moment.', 0);
  }

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new ApiError(data.error || data.message || `Request failed (${response.status}).`, response.status);
  }
  return data as T;
}

const api = <T>(path: string, init?: RequestInit) => request<T>(API, path, init);
const flask = <T>(path: string, init?: RequestInit) => request<T>(FLASK, path, init);
const json = (method: string, body: unknown): RequestInit => ({ method, body: JSON.stringify(body) });

// ---- catalogue
export const getHealth = () => api<{ ok: boolean }>('/health');
export const getProducts = (category: Category, q = '') =>
  api<Product[]>(`/products?category=${category}&q=${encodeURIComponent(q)}`);
export const getAlternatives = (category: Category, slug: string) =>
  api<ProductDetail & { alternatives: Alternative[] }>(`/products/${category}/${slug}/alternatives`);

// ---- auth
export const getMe = () => api<{ user: User }>('/auth/me');
export const login = (email: string, password: string) =>
  api<{ user: User }>('/auth/login', json('POST', { email, password }));
export const register = (name: string, email: string, password: string) =>
  api<{ user: User }>('/auth/register', json('POST', { name, email, password }));
export const logout = () => api<{ message: string }>('/auth/logout', { method: 'POST' });

// ---- MongoDB CRUD (adminProducts)
export const listAdminProducts = () => api<AdminProduct[]>('/admin/products');
export const createAdminProduct = (p: AdminProductInput) =>
  api<AdminProduct>('/admin/products', json('POST', p));
export const updateAdminProduct = (id: string, p: Partial<AdminProductInput>) =>
  api<AdminProduct>(`/admin/products/${id}`, json('PUT', p));
export const deleteAdminProduct = (id: string) =>
  api<{ ok: boolean }>(`/admin/products/${id}`, { method: 'DELETE' });

// ---- Node.js file tools
export const listFiles = () => api<FileInfo[]>('/files');
export const backupProducts = () =>
  api<{ ok: boolean; name: string; counts: Record<string, number> }>('/files/backup-products', { method: 'POST' });
export const deleteFile = (name: string) =>
  api<{ ok: boolean }>(`/files?name=${encodeURIComponent(name)}`, { method: 'DELETE' });
export const fileDownloadUrl = (name: string) => `${API}/files/download?name=${encodeURIComponent(name)}`;
export const feedbackCsvUrl = () => `${API}/files/feedback.csv`;

// ---- Flask feedback
export const submitFeedback = (f: FeedbackInput) =>
  flask<{ message: string }>('/feedback', json('POST', f));
export const getRecentFeedback = (limit = 6) => flask<FeedbackEntry[]>(`/feedback/recent?limit=${limit}`);
export const getFeedbackStats = () => flask<FeedbackStats>('/feedback/stats');
