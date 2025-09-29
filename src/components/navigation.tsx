import { useState } from "react";
import { CheckCircle, Menu, X, Home, Users, BarChart3, Bell, User, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

const Navigation = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navItems = [
    { icon: Home, label: "Home", isActive: true },
    { icon: Users, label: "Attendance" },
    { icon: BarChart3, label: "Reports" },
    { icon: Bell, label: "Notifications" },
    { icon: User, label: "Profile" },
    { icon: HelpCircle, label: "Help" },
  ];

  return (
    <nav className="fixed top-0 w-full z-50 bg-gradient-glassmorphism backdrop-blur-glass border-b border-white/20 shadow-glass">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 bg-gradient-primary rounded-full flex items-center justify-center shadow-glass">
                <CheckCircle className="w-6 h-6 text-white" />
              </div>
              <div className="absolute inset-0 bg-gradient-primary rounded-full blur-md opacity-50 scale-110"></div>
            </div>
            <span className="text-xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              SmartPresence
            </span>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1">
            {navItems.map((item) => (
              <button
                key={item.label}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 ${
                  item.isActive
                    ? "bg-gradient-primary text-white shadow-glass"
                    : "text-muted-foreground hover:text-foreground hover:bg-white/10"
                }`}
              >
                <item.icon className="w-4 h-4" />
                <span className="text-sm font-medium">{item.label}</span>
              </button>
            ))}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 rounded-lg hover:bg-white/10 transition-colors"
          >
            {isMobileMenuOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-white/20">
            <div className="flex flex-col gap-2">
              {navItems.map((item) => (
                <button
                  key={item.label}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                    item.isActive
                      ? "bg-gradient-primary text-white shadow-glass"
                      : "text-muted-foreground hover:text-foreground hover:bg-white/10"
                  }`}
                >
                  <item.icon className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navigation;