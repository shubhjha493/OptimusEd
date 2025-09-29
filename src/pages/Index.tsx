import Navigation from "@/components/navigation";
import VideoHeroSection from "@/components/video-hero-section";
import AccessPortalSection from "@/components/access-portal-section";
import FeaturesCarousel from "@/components/features-carousel";
import ProblemSolution from "@/components/problem-solution";
import FeaturesSection from "@/components/features-section";
import CtaSection from "@/components/cta-section";
import Footer from "@/components/footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <VideoHeroSection />
      <AccessPortalSection />
      <FeaturesCarousel />
      <ProblemSolution />
      <FeaturesSection />
      <CtaSection />
      <Footer />
    </div>
  );
};

export default Index;