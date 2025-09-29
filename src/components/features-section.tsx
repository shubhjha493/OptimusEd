import { Cloud, Smartphone, FileText, Plug, Lock, Headphones, Globe, Zap } from "lucide-react";

const additionalFeatures = [
  {
    icon: Cloud,
    title: "Cloud Storage",
    description: "Secure cloud-based data storage with 99.9% uptime and automatic backups",
    gradient: "from-blue-500 to-cyan-500"
  },
  {
    icon: Smartphone,
    title: "Mobile App",
    description: "Native iOS and Android apps with offline capability and push notifications",
    gradient: "from-purple-500 to-pink-500"
  },
  {
    icon: FileText,
    title: "Advanced Reports",
    description: "Customizable reports with export options for Excel, PDF, and CSV formats",
    gradient: "from-green-500 to-emerald-500"
  },
  {
    icon: Plug,
    title: "Easy Integration",
    description: "Seamless integration with existing LMS, ERP, and student information systems",
    gradient: "from-orange-500 to-yellow-500"
  },
  {
    icon: Lock,
    title: "Data Security",
    description: "Enterprise-grade security with encryption, role-based access, and audit logs",
    gradient: "from-red-500 to-pink-500"
  },
  {
    icon: Headphones,
    title: "24/7 Support",
    description: "Round-the-clock technical support with dedicated account managers",
    gradient: "from-indigo-500 to-purple-500"
  },
  {
    icon: Globe,
    title: "Multi-Language",
    description: "Support for 15+ languages with localized interfaces and content",
    gradient: "from-teal-500 to-blue-500"
  },
  {
    icon: Zap,
    title: "API Access",
    description: "RESTful APIs for custom integrations and third-party application development",
    gradient: "from-yellow-500 to-orange-500"
  }
];

const FeaturesSection = () => {
  return (
    <section className="py-20 bg-gradient-to-br from-secondary/10 via-background to-accent/5">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-4">
            Complete{" "}
            <span className="bg-gradient-primary bg-clip-text text-transparent">
              Ecosystem
            </span>{" "}
            Features
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Beyond attendance tracking, SmartPresence offers a comprehensive suite of tools 
            for modern educational institutions.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
          {additionalFeatures.map((feature, index) => (
            <div
              key={index}
              className="group bg-gradient-glassmorphism backdrop-blur-glass border border-white/20 rounded-2xl p-6 shadow-glass hover:shadow-xl transition-all duration-500 hover:scale-105"
            >
              {/* Icon */}
              <div className="relative mb-6">
                <div className={`w-14 h-14 bg-gradient-to-br ${feature.gradient} rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                  <feature.icon className="w-7 h-7 text-white" />
                </div>
                <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} rounded-xl blur-lg opacity-30 group-hover:opacity-50 transition-opacity duration-300`}></div>
              </div>

              {/* Content */}
              <div className="space-y-3">
                <h3 className="text-xl font-bold text-foreground group-hover:text-primary transition-colors duration-300">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground leading-relaxed text-sm">
                  {feature.description}
                </p>
              </div>

              {/* Hover Gradient Overlay */}
              <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-500 rounded-2xl`}></div>
            </div>
          ))}
        </div>

        {/* Bottom Stats */}
        <div className="mt-16 bg-gradient-glassmorphism backdrop-blur-glass border border-white/20 rounded-3xl p-8 shadow-glass">
          <div className="grid md:grid-cols-4 gap-8 text-center">
            <div className="space-y-2">
              <div className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">99.9%</div>
              <div className="text-sm text-muted-foreground">Uptime Guarantee</div>
            </div>
            <div className="space-y-2">
              <div className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">256-bit</div>
              <div className="text-sm text-muted-foreground">Encryption</div>
            </div>
            <div className="space-y-2">
              <div className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">15+</div>
              <div className="text-sm text-muted-foreground">Languages</div>
            </div>
            <div className="space-y-2">
              <div className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">24/7</div>
              <div className="text-sm text-muted-foreground">Support</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;