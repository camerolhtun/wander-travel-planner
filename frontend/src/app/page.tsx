import { FeaturedDestinations } from "@/components/landing/FeaturedDestinations";
import { HeroPlanner } from "@/components/landing/HeroPlanner";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { TravelByInterest } from "@/components/landing/TravelByInterest";

export default function Home() {
  return (
    <main>
      <HeroPlanner />
      <HowItWorks />
      <FeaturedDestinations />
      <TravelByInterest />
    </main>
  );
}
