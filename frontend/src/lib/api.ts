import { createClient } from "@/lib/supabase/client";
import type {
  Article,
  ItineraryDay,
  ItineraryItem,
  Trip,
  TripCreateInput,
  TripDetail,
} from "@/lib/types";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

async function authHeaders(): Promise<Record<string, string>> {
  try {
    const supabase = createClient();
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    if (token) return { Authorization: `Bearer ${token}` };
  } catch {
    // Supabase env not configured yet — fall through.
  }
  // Local dev before Supabase exists: NEXT_PUBLIC_DEV_USER_ID lets the backend
  // (ENVIRONMENT=development) accept requests via its X-Dev-User bypass.
  const devUser = process.env.NEXT_PUBLIC_DEV_USER_ID;
  if (devUser) return { "X-Dev-User": devUser };
  return {};
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(await authHeaders()),
      ...(init.headers ?? {}),
    },
  });
  if (!res.ok) {
    throw new Error(`${res.status} ${res.statusText}: ${await res.text()}`);
  }
  return res.status === 204 ? (undefined as T) : ((await res.json()) as T);
}

export const api = {
  listTrips: () => request<Trip[]>("/trips"),
  getTrip: (id: string) => request<TripDetail>(`/trips/${id}`),
  createTrip: (body: TripCreateInput) =>
    request<Trip>("/trips", { method: "POST", body: JSON.stringify(body) }),
  updateTrip: (id: string, body: Partial<TripCreateInput> & { status?: string }) =>
    request<Trip>(`/trips/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
  deleteTrip: (id: string) =>
    request<void>(`/trips/${id}`, { method: "DELETE" }),
  generate: (id: string) =>
    request<TripDetail>(`/trips/${id}/generate`, { method: "POST" }),

  // Week 2 — editable itinerary
  updateDay: (dayId: string, body: Partial<Pick<ItineraryDay, "summary" | "est_budget">>) =>
    request<ItineraryDay>(`/days/${dayId}`, { method: "PATCH", body: JSON.stringify(body) }),
  addItem: (dayId: string, body: Partial<ItineraryItem> & { title: string }) =>
    request<ItineraryItem>(`/days/${dayId}/items`, {
      method: "POST",
      body: JSON.stringify(body),
    }),
  updateItem: (itemId: string, body: Partial<ItineraryItem>) =>
    request<ItineraryItem>(`/items/${itemId}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    }),
  deleteItem: (itemId: string) =>
    request<void>(`/items/${itemId}`, { method: "DELETE" }),
  reorderItems: (items: { id: string; day_id: string; sort_order: number }[]) =>
    request<{ updated: number }>("/items/reorder", {
      method: "POST",
      body: JSON.stringify({ items }),
    }),

  // Landing — travel-blog inspiration by interest
  listInspiration: (interest: string) =>
    request<Article[]>(`/inspiration/${encodeURIComponent(interest)}`),
};
