"use client";

import { use } from "react";
import { ItineraryEditor } from "@/components/itinerary/ItineraryEditor";

export default function TripDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  return <ItineraryEditor tripId={id} />;
}
