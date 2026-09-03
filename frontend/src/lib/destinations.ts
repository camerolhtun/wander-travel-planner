export type Destination = {
  slug: string;
  name: string; // "Kyoto, Japan" — used as the trip destination
  city: string; // "Kyoto"
  img: string;
  tag: string;
  days: number;
  region: string;
  blurb: string;
};

export const DESTINATIONS: Destination[] = [
  {
    slug: "kyoto",
    name: "Kyoto, Japan",
    city: "Kyoto",
    img: "/kyoto.jpg",
    tag: "Culture",
    days: 10,
    region: "Kansai Region",
    blurb: "Ancient temples, zen gardens, and machiya streets that slow the day down.",
  },
  {
    slug: "bali",
    name: "Bali, Indonesia",
    city: "Bali",
    img: "/bali.jpg",
    tag: "Nature",
    days: 14,
    region: "Southeast Asia",
    blurb: "Lake temples, rice terraces, and warungs between the surf breaks.",
  },
  {
    slug: "santorini",
    name: "Santorini, Greece",
    city: "Santorini",
    img: "/santorini.jpg",
    tag: "Coast",
    days: 7,
    region: "Cyclades Islands",
    blurb: "White-washed villages stacked on the caldera, best at golden hour.",
  },
];

export const getDestination = (slug: string): Destination | undefined =>
  DESTINATIONS.find((d) => d.slug === slug);
