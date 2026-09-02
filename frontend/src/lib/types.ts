export type TravelStyle = "budget" | "mid" | "luxury";
export type Pace = "relaxed" | "moderate" | "packed";
export type ItemCategory = "attraction" | "food" | "activity" | "transit" | "rest";

export interface Trip {
  id: string;
  user_id: string;
  destination: string;
  start_date: string;
  end_date: string;
  budget_total: number | null;
  currency: string;
  num_travelers: number;
  interests: string[];
  travel_style: TravelStyle;
  pace: Pace;
  notes: string | null;
  local_currency: string | null;
  fx_rate: number | null;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface Photo {
  url: string;
  attribution: string | null;
}

export interface ItineraryItem {
  id: string;
  day_id: string;
  sort_order: number;
  start_time: string | null;
  end_time: string | null;
  title: string;
  category: ItemCategory;
  description: string | null;
  est_cost: number | null;
  booking_url: string | null;
  place_name: string | null;
  address: string | null;
  lat: number | null;
  lng: number | null;
  google_place_id: string | null;
  photo_url: string | null;
  photo_attribution: string | null;
  photos: Photo[];
  is_user_edited: boolean;
}

export interface ItineraryDay {
  id: string;
  trip_id: string;
  day_index: number;
  date: string | null;
  summary: string | null;
  est_budget: number | null;
  is_user_edited: boolean;
  items: ItineraryItem[];
}

export interface TripDetail extends Trip {
  days: ItineraryDay[];
}

export interface TripCreateInput {
  destination: string;
  start_date: string;
  end_date: string;
  budget_total?: number | null;
  currency?: string;
  num_travelers?: number;
  interests?: string[];
  travel_style?: TravelStyle;
  pace?: Pace;
  notes?: string | null;
}
