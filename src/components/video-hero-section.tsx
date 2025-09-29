import { useEffect, useRef } from "react";

const VideoHeroSection = () => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (video) {
      let playCount = 0;
      
      const handleVideoEnd = () => {
        playCount++;
        if (playCount < 3) {
          video.play();
        }
      };

      video.addEventListener('ended', handleVideoEnd);
      
      return () => {
        video.removeEventListener('ended', handleVideoEnd);
      };
    }
  }, []);

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Video Background */}
      <div className="absolute inset-0 z-0">
        <video
          ref={videoRef}
          autoPlay
          muted
          className="w-full h-full object-cover"
          src="/smart-presence-video.mp4"
        />
        {/* Video Overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-background/30 to-accent/20 backdrop-blur-[1px]"></div>
      </div>

      {/* Content */}
      <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
        {/* Animated Main Heading */}
        <h1 className="text-6xl md:text-8xl font-bold mb-6 animate-fade-in">
          Smart<span className="bg-gradient-primary bg-clip-text text-transparent">Presence</span>
        </h1>
        
        {/* Animated Subtext */}
        <p className="text-xl md:text-3xl text-foreground/80 font-medium animate-fade-in-delayed">
          Redefining Attendance with Smarter Solutions
        </p>

        {/* Decorative Elements */}
        <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-primary/10 rounded-full blur-2xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-48 h-48 bg-accent/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
        <div className="w-6 h-10 border-2 border-foreground/30 rounded-full flex justify-center">
          <div className="w-1 h-3 bg-foreground/30 rounded-full mt-2 animate-pulse"></div>
        </div>
      </div>
    </section>
  );
};

export default VideoHeroSection;