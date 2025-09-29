import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Shield, GraduationCap, BookOpen, Play } from "lucide-react";
import LoginForm from "@/components/auth/LoginForm";
import AdminRegisterForm from "@/components/auth/AdminRegisterForm";
import TeacherRegisterForm from "@/components/auth/TeacherRegisterForm";
import StudentRegisterForm from "@/components/auth/StudentRegisterForm";
import { useState } from "react";

const HeroSection = () => {
  const [openDialog, setOpenDialog] = useState<string | null>(null);

  const portals = [
    {
      role: "Admin",
      title: "Admin Login",
      icon: Shield,
      gradient: "from-red-500 to-orange-500",
      bgGlow: "bg-red-500/20"
    },
    {
      role: "Teacher",
      title: "Teacher Login/Register",
      icon: GraduationCap,
      gradient: "from-blue-500 to-indigo-500",
      bgGlow: "bg-blue-500/20"
    },
    {
      role: "Student",
      title: "Student Login/Register",
      icon: BookOpen,
      gradient: "from-green-500 to-emerald-500",
      bgGlow: "bg-green-500/20"
    }
  ];

  return (
    <section className="min-h-screen bg-gradient-to-br from-background via-secondary/5 to-primary/5 flex items-center justify-center relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 bg-grid-white/10 bg-grid-pattern opacity-30"></div>
      <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-primary/10 rounded-full blur-3xl"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-secondary/10 rounded-full blur-3xl"></div>
      
      <div className="container mx-auto px-4 py-20 relative z-10">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-6xl md:text-7xl font-bold mb-6">
            Smart<span className="bg-gradient-primary bg-clip-text text-transparent">Presence</span>
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto mb-4">
            Revolutionary Smart Attendance System
          </p>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Streamline attendance management with QR codes, real-time analytics, and automated notifications.
          </p>
        </div>

        {/* Login Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto mb-12">
          {portals.map((portal) => (
            <Dialog key={portal.role} open={openDialog === portal.role} onOpenChange={(open) => setOpenDialog(open ? portal.role : null)}>
              <DialogTrigger asChild>
                <Button
                  size="lg"
                  className={`group relative h-32 w-full bg-gradient-to-br ${portal.gradient} hover:scale-105 transition-all duration-300 shadow-xl hover:shadow-2xl text-white font-bold text-xl overflow-hidden`}
                >
                  {/* Background Glow */}
                  <div className={`absolute inset-0 ${portal.bgGlow} opacity-0 group-hover:opacity-30 transition-opacity duration-300`}></div>
                  
                  {/* Icon */}
                  <div className="relative flex flex-col items-center gap-4">
                    <portal.icon className="w-12 h-12" />
                    <span>{portal.title}</span>
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

        {/* Demo Video Button */}
        <div className="text-center">
          <Button
            size="lg"
            variant="outline"
            className="group h-16 px-8 bg-gradient-glassmorphism backdrop-blur-glass border-white/20 hover:border-white/40 transition-all duration-300 text-lg font-semibold"
            onClick={() => window.open('https://youtu.be/4-xrig8Z-no?si=WbUyQTy-hYSZ00hC', '_blank')}
          >
            <Play className="w-6 h-6 mr-3 group-hover:scale-110 transition-transform" />
            Watch Demo Video
          </Button>
        </div>

        {/* Features Preview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto mt-20">
          <div className="text-center p-6 bg-gradient-glassmorphism backdrop-blur-glass rounded-2xl border border-white/20">
            <Shield className="w-12 h-12 mx-auto mb-4 text-red-500" />
            <h3 className="text-xl font-bold mb-2">Admin Control</h3>
            <p className="text-muted-foreground">Complete system oversight and management</p>
          </div>
          <div className="text-center p-6 bg-gradient-glassmorphism backdrop-blur-glass rounded-2xl border border-white/20">
            <GraduationCap className="w-12 h-12 mx-auto mb-4 text-blue-500" />
            <h3 className="text-xl font-bold mb-2">Teacher Dashboard</h3>
            <p className="text-muted-foreground">Attendance tracking and class management</p>
          </div>
          <div className="text-center p-6 bg-gradient-glassmorphism backdrop-blur-glass rounded-2xl border border-white/20">
            <BookOpen className="w-12 h-12 mx-auto mb-4 text-green-500" />
            <h3 className="text-xl font-bold mb-2">Student Portal</h3>
            <p className="text-muted-foreground">QR scanning and schedule access</p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;