import FeaturesSection from "@/components/home/Feature";
import HeroSection from "@/components/home/Hero";
import HowItWorksSection from "@/components/home/Works";

export default function HomePage() {
  return (
    <main>
      <HeroSection />
      <FeaturesSection />
      <HowItWorksSection />
    </main>
  );
}