import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, QrCode, Bell, Calendar, BookOpen, Monitor, BarChart3, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import qrScanningImage from "@/assets/qr-scanning.jpg";
import notificationsImage from "@/assets/notifications.jpg";
import examCalendarImage from "@/assets/exam-calendar.jpg";
import hybridLearningImage from "@/assets/hybrid-learning.jpg";
import analyticsDashboardImage from "@/assets/analytics-dashboard.jpg";
import parentAlertsImage from "@/assets/parent-alerts.jpg";

const featuresData = [
  {
    id: 1,
    icon: QrCode,
    title: "QR-based Attendance",
    description: "Students scan QR codes in class to mark attendance instantly with 99.8% accuracy",
    benefit: "10+ Min Saved",
    stats: "2.3s avg scan time",
    image: qrScanningImage,
    gradient: "from-blue-500 to-cyan-500"
  },
  {
    id: 2,
    icon: Bell,
    title: "Real-time Notifications",
    description: "Instant alerts for attendance shortage, class updates, and important reminders",
    benefit: "Zero Missed Updates",
    stats: "98% delivery rate",
    image: notificationsImage,
    gradient: "from-purple-500 to-pink-500"
  },
  {
    id: 3,
    icon: BookOpen,
    title: "Extra Class Notifications", 
    description: "Students get notified about rescheduled, extra classes, and venue changes",
    benefit: "100% Informed",
    stats: "5min advance notice",
    image: notificationsImage,
    gradient: "from-green-500 to-emerald-500"
  },
  {
    id: 4,
    icon: Calendar,
    title: "Exam Schedules",
    description: "Interactive calendar with upcoming exam dates, room assignments, and preparation time",
    benefit: "Never Miss Exams",
    stats: "30-day preview",
    image: examCalendarImage,
    gradient: "from-orange-500 to-red-500"
  },
  {
    id: 5,
    icon: Monitor,
    title: "Offline & Online Class Switch",
    description: "Seamless transition between classroom and online mode with unified tracking",
    benefit: "Hybrid Ready",
    stats: "1-click switch",
    image: hybridLearningImage,
    gradient: "from-indigo-500 to-blue-500"
  },
  {
    id: 6,
    icon: BarChart3,
    title: "Analytics Dashboard",
    description: "Teachers and admins access detailed graphs, reports, and engagement trends",
    benefit: "Data-Driven Insights",
    stats: "15+ metrics tracked",
    image: analyticsDashboardImage,
    gradient: "from-teal-500 to-cyan-500"
  },
  {
    id: 7,
    icon: Smartphone,
    title: "Parent Alerts",
    description: "Parents receive attendance shortage and progress updates directly on their phones",
    benefit: "Family Engaged",
    stats: "Real-time updates",
    image: parentAlertsImage,
    gradient: "from-rose-500 to-pink-500"
  }
];

const FeaturesCarousel = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  useEffect(() => {
    if (isAutoPlaying) {
      const interval = setInterval(() => {
        setCurrentSlide((prev) => (prev + 1) % featuresData.length);
      }, 4000);
      return () => clearInterval(interval);
    }
  }, [isAutoPlaying]);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % featuresData.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + featuresData.length) % featuresData.length);
  };

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
  };

  const currentFeature = featuresData[currentSlide];

  return (
    <section className="py-20 bg-gradient-to-br from-background to-secondary/20">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-4">
            Powerful Features for{" "}
            <span className="bg-gradient-primary bg-clip-text text-transparent">
              Modern Education
            </span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Discover how SmartPresence transforms attendance management with cutting-edge features 
            designed for students, teachers, and administrators.
          </p>
        </div>

        {/* Carousel */}
        <div 
          className="relative max-w-6xl mx-auto"
          onMouseEnter={() => setIsAutoPlaying(false)}
          onMouseLeave={() => setIsAutoPlaying(true)}
        >
          <div className="bg-gradient-glassmorphism backdrop-blur-glass border border-white/20 rounded-3xl shadow-glass overflow-hidden">
            <div className="grid md:grid-cols-2 gap-0">
              {/* Content Side */}
              <div className="p-8 md:p-12 flex flex-col justify-center">
                <div className="space-y-6">
                  {/* Icon and Badge */}
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-2xl bg-gradient-to-br ${currentFeature.gradient} shadow-lg`}>
                      <currentFeature.icon className="w-8 h-8 text-white" />
                    </div>
                    <div className="bg-success/10 text-success px-3 py-1 rounded-full text-sm font-medium border border-success/20">
                      {currentFeature.benefit}
                    </div>
                  </div>

                  {/* Title and Description */}
                  <div className="space-y-3">
                    <h3 className="text-3xl font-bold text-foreground">
                      {currentFeature.title}
                    </h3>
                    <p className="text-lg text-muted-foreground leading-relaxed">
                      {currentFeature.description}
                    </p>
                  </div>

                  {/* Stats */}
                  <div className="flex items-center gap-4 pt-4">
                    <div className="bg-primary/10 text-primary px-4 py-2 rounded-lg border border-primary/20">
                      <div className="text-sm font-medium">{currentFeature.stats}</div>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Feature #{currentFeature.id} of {featuresData.length}
                    </div>
                  </div>
                </div>
              </div>

              {/* Image Side */}
              <div className="relative h-64 md:h-auto">
                <img
                  src={currentFeature.image}
                  alt={currentFeature.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
              </div>
            </div>
          </div>

          {/* Navigation Arrows */}
          <Button
            variant="outline"
            size="icon"
            onClick={prevSlide}
            className="absolute left-4 top-1/2 -translate-y-1/2 bg-gradient-glassmorphism backdrop-blur-glass border-white/20 hover:bg-white/20 shadow-glass"
          >
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={nextSlide}
            className="absolute right-4 top-1/2 -translate-y-1/2 bg-gradient-glassmorphism backdrop-blur-glass border-white/20 hover:bg-white/20 shadow-glass"
          >
            <ChevronRight className="w-5 h-5" />
          </Button>
        </div>

        {/* Dots Navigation */}
        <div className="flex justify-center gap-2 mt-8">
          {featuresData.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`w-3 h-3 rounded-full transition-all duration-300 ${
                index === currentSlide
                  ? "bg-primary scale-125"
                  : "bg-muted-foreground/30 hover:bg-muted-foreground/50"
              }`}
            />
          ))}
        </div>

        {/* Feature Grid Preview */}
        <div className="grid grid-cols-2 md:grid-cols-7 gap-4 mt-12 max-w-4xl mx-auto">
          {featuresData.map((feature, index) => (
            <button
              key={feature.id}
              onClick={() => goToSlide(index)}
              className={`p-4 rounded-xl text-center transition-all duration-300 ${
                index === currentSlide
                  ? "bg-gradient-primary text-white shadow-glass scale-105"
                  : "bg-gradient-glassmorphism backdrop-blur-glass border border-white/20 hover:bg-white/10"
              }`}
            >
              <feature.icon className="w-6 h-6 mx-auto mb-2" />
              <div className="text-xs font-medium">{feature.title}</div>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesCarousel;