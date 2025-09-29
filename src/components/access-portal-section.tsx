import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Shield, GraduationCap, BookOpen } from "lucide-react";
import LoginForm from "@/components/auth/LoginForm";
import AdminRegisterForm from "@/components/auth/AdminRegisterForm";
import TeacherRegisterForm from "@/components/auth/TeacherRegisterForm";
import StudentRegisterForm from "@/components/auth/StudentRegisterForm";
import { useState } from "react";

const AccessPortalSection = () => {
  const [openDialog, setOpenDialog] = useState<string | null>(null);

  const portals = [
    {
      role: "Admin",
      title: "Admin Login/Register",
      icon: Shield,
      gradient: "from-red-500 to-orange-500",
      bgGlow: "bg-red-500/20",
      description: "Complete system oversight and management"
    },
    {
      role: "Teacher",
      title: "Teacher Login/Register",
      icon: GraduationCap,
      gradient: "from-blue-500 to-indigo-500",
      bgGlow: "bg-blue-500/20",
      description: "Attendance tracking and class management"
    },
    {
      role: "Student",
      title: "Student Login/Register",
      icon: BookOpen,
      gradient: "from-green-500 to-emerald-500",
      bgGlow: "bg-green-500/20",
      description: "QR scanning and schedule access"
    }
  ];

  return (
    <section className="py-20 bg-gradient-hero relative">
      {/* Background Elements */}
      <div className="absolute inset-0 bg-grid-white/5 opacity-30"></div>
      
      <div className="container mx-auto px-4 relative z-10">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4 animate-slide-in">
            Choose Your Access Portal
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto animate-fade-in-delayed">
            Select your role to access the SmartPresence system
          </p>
        </div>

        {/* Portal Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {portals.map((portal, index) => (
            <Dialog key={portal.role} open={openDialog === portal.role} onOpenChange={(open) => setOpenDialog(open ? portal.role : null)}>
              <DialogTrigger asChild>
                <Button
                  size="lg"
                  className={`group relative h-40 w-full bg-gradient-to-br ${portal.gradient} hover:scale-105 transition-all duration-300 shadow-xl hover:shadow-2xl text-white font-bold text-xl overflow-hidden animate-fade-in`}
                  style={{ animationDelay: `${index * 0.2}s` }}
                >
                  {/* Background Glow */}
                  <div className={`absolute inset-0 ${portal.bgGlow} opacity-0 group-hover:opacity-30 transition-opacity duration-300`}></div>
                  
                  {/* Content */}
                  <div className="relative flex flex-col items-center gap-4 p-6">
                    <portal.icon className="w-16 h-16" />
                    <div className="text-center">
                      <span className="block text-xl font-bold">{portal.title}</span>
                      <span className="block text-sm text-white/80 mt-2">{portal.description}</span>
                    </div>
                  </div>
                  
                  {/* Animated Border */}
                  <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogTitle className="sr-only">{portal.role} Access Portal</DialogTitle>
                <DialogDescription className="sr-only">Login or register for {portal.role} access</DialogDescription>
                <Tabs defaultValue="login" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="login">Login</TabsTrigger>
                    <TabsTrigger value="register">Register</TabsTrigger>
                  </TabsList>
                  <TabsContent value="login">
                    <LoginForm 
                      role={portal.role.toLowerCase() as 'admin' | 'teacher' | 'student'} 
                      onClose={() => setOpenDialog(null)} 
                    />
                  </TabsContent>
                  <TabsContent value="register">
                    {portal.role === 'Admin' && <AdminRegisterForm onClose={() => setOpenDialog(null)} />}
                    {portal.role === 'Teacher' && <TeacherRegisterForm onClose={() => setOpenDialog(null)} />}
                    {portal.role === 'Student' && <StudentRegisterForm onClose={() => setOpenDialog(null)} />}
                  </TabsContent>
                </Tabs>
              </DialogContent>
            </Dialog>
          ))}
        </div>

        {/* Watch Demo Video Button */}
        <div className="text-center mt-12">
          <Button
            size="lg"
            variant="outline"
            className="group h-16 px-8 bg-gradient-glassmorphism backdrop-blur-glass border-white/20 hover:border-white/40 transition-all duration-300 text-lg font-semibold animate-fade-in-delayed"
            onClick={() => window.open('https://youtu.be/4-xrig8Z-no?si=WbUyQTy-hYSZ00hC', '_blank')}
          >
            <svg className="w-6 h-6 mr-3 group-hover:scale-110 transition-transform" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z"/>
            </svg>
            Watch Demo Video
          </Button>
        </div>
      </div>
    </section>
  );
};

export default AccessPortalSection;