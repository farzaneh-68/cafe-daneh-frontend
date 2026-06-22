// src/api.js
// The ONLY file allowed to know about the backend's URL shape. Every component
// calls functions from here instead of using fetch() directly — same separation
// principle as the backend's repository layer.

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";
const TOKEN_KEY = "daneh-token";

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}
export function setToken(token) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

async function request(path, { method = "GET", body, auth = false } = {}) {
  const headers = { "Content-Type": "application/json" };
  if (auth) {
    const token = getToken();
    if (token) headers["Authorization"] = `Bearer ${token}`;
  }
  let res;
  try {
    res = await fetch(`${BASE_URL}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch (e) {
    throw new ApiError(0, "اتصال به سرور برقرار نشد. مطمئن شو بک‌اند روی " + BASE_URL + " در حال اجراست.");
  }
  let data = null;
  try {
    data = await res.json();
  } catch {
    /* empty body, fine for some endpoints */
  }
  if (!res.ok) {
    throw new ApiError(res.status, (data && data.error) || "خطای ناشناخته");
  }
  return data;
}

export class ApiError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

export const api = {
  register: (body) => request("/api/auth/register", { method: "POST", body }),
  login: (body) => request("/api/auth/login", { method: "POST", body }),
  me: () => request("/api/auth/me", { auth: true }),

  menu: () => request("/api/menu"),

  placeOrder: (body) => request("/api/orders", { method: "POST", body, auth: true }),
  myOrders: () => request("/api/orders/mine", { auth: true }),

  loyalty: () => request("/api/loyalty/me", { auth: true }),
  claimWeekly: () => request("/api/loyalty/claim-weekly", { method: "POST", auth: true }),

  myReferral: () => request("/api/referrals/me", { auth: true }),
  claimReferral: () => request("/api/referrals/claim", { method: "POST", auth: true }),

  adminSetPrice: (id, price) =>
    request(`/api/admin/menu/${id}/price`, { method: "PUT", body: { price }, auth: true }),
  adminAuditLog: () => request("/api/admin/audit-log", { auth: true }),
};
