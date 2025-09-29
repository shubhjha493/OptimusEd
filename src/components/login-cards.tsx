import { Shield, GraduationCap, BookOpen, Users, BarChart3, Settings, Calendar, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import LoginForm from "@/components/auth/LoginForm";
import AdminRegisterForm from "@/components/auth/AdminRegisterForm";
import TeacherRegisterForm from "@/components/auth/TeacherRegisterForm";
import StudentRegisterForm from "@/components/auth/StudentRegisterForm";
import { useEffect, useState } from "react";

const loginPortals = [
  {
    role: "Admin",
    title: "Administrative Portal",
    description: "Complete system oversight and institutional analytics",
    icon: Shield,
    gradient: "from-red-500 to-orange-500",
    features: [
      { icon: BarChart3, text: "System Analytics" },
      { icon: Users, text: "User Management" },
      { icon: Settings, text: "System Configuration" },
    ],
    bgPattern: "bg-gradient-to-br from-red-50 to-orange-50"
  },
  {
    role: "Teacher",
    title: "Faculty Portal",
    description: "Attendance management and student analytics",
    icon: GraduationCap,
    gradient: "from-blue-500 to-indigo-500",
    features: [
      { icon: Users, text: "Class Management" },
      { icon: BarChart3, text: "Student Reports" },
      { icon: Calendar, text: "Schedule Control" },
    ],
    bgPattern: "bg-gradient-to-br from-blue-50 to-indigo-50"
  },
  {
    role: "Student",
    title: "Student Portal",
    description: "QR scanning, notifications, and schedule access",
    icon: BookOpen,
    gradient: "from-green-500 to-emerald-500",
    features: [
      { icon: BookOpen, text: "Attendance Tracking" },
      { icon: Bell, text: "Notifications" },
      { icon: Calendar, text: "Class Schedule" },
    ],
    bgPattern: "bg-gradient-to-br from-green-50 to-emerald-50"
  }
];

const LoginCards = () => {
  const [openDialog, setOpenDialog] = useState<string | null>(null);
  const [initialTab, setInitialTab] = useState<'login' | 'register'>('login');

  useEffect(() => {
    const handleHash = () => {
      const raw = window.location.hash.replace('#', '');
      const [rolePart, actionPart] = raw.split('-');
      const role = rolePart?.toLowerCase();
      const action = actionPart?.toLowerCase();
      const roleMap: Record<string, string> = { admin: 'Admin', teacher: 'Teacher', student: 'Student' };
      if (role && roleMap[role]) {
        setOpenDialog(roleMap[role]);
        setInitialTab(action === 'register' ? 'register' : 'login');
      }
    };
    handleHash();
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, []);

  return (
    <section className="py-20 bg-secondary/20">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-4">
            Choose Your{" "}
            <span className="bg-gradient-primary bg-clip-text text-transparent">
              Access Portal
            </span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Role-specific dashboards designed for administrators, teachers, and students 
            with tailored features for optimal productivity.
          </p>
        </div>

        {/* Login Cards Grid */}
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {loginPortals.map((portal) => (
            <div
              key={portal.role}
              className="group relative bg-gradient-glassmorphism backdrop-blur-glass border border-white/20 rounded-3xl shadow-glass hover:shadow-2xl transition-all duration-500 hover:scale-105 overflow-hidden"
            >
              {/* Background Pattern */}
              <div className={`absolute inset-0 ${portal.bgPattern} opacity-0 group-hover:opacity-10 transition-opacity duration-500`}></div>
              
              {/* Gradient Glow */}
              <div className={`absolute inset-0 bg-gradient-to-br ${portal.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-500`}></div>
              
              <div className="relative p-8 text-center space-y-6">
                {/* Icon */}
                <div className="relative mx-auto w-20 h-20">
                  <div className={`w-20 h-20 bg-gradient-to-br ${portal.gradient} rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                    <portal.icon className="w-10 h-10 text-white" />
                  </div>
                  <div className={`absolute inset-0 bg-gradient-to-br ${portal.gradient} rounded-2xl blur-xl opacity-50 group-hover:opacity-70 transition-opacity duration-300`}></div>
                </div>

                {/* Content */}
                <div className="space-y-3">
                  <h3 className="text-2xl font-bold text-foreground">
                    {portal.title}
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {portal.description}
                  </p>
                </div>

                {/* Features List */}
                <div className="space-y-3">
                  {portal.features.map((feature, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-3 p-3 rounded-xl bg-white/5 group-hover:bg-white/10 transition-colors duration-300"
                    >
                      <div className={`p-2 rounded-lg bg-gradient-to-br ${portal.gradient} shadow-sm`}>
                        <feature.icon className="w-4 h-4 text-white" />
                      </div>
                      <span className="text-sm font-medium text-foreground">
                        {feature.text}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Login Button */}
                <Dialog open={openDialog === portal.role} onOpenChange={(open) => setOpenDialog(open ? portal.role : null)}>
                  <DialogTrigger asChild>
                    <Button
                      className={`w-full bg-gradient-to-r ${portal.gradient} hover:scale-105 transition-transform shadow-lg text-white font-semibold`}
                      size="lg"
                    >
                      Login as {portal.role}
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md">
                    <DialogTitle className="sr-only">{portal.role} Access Portal</DialogTitle>
                    <DialogDescription className="sr-only">Login or register for {portal.role} access</DialogDescription>
                    <Tabs key={initialTab} defaultValue={initialTab} className="w-full">
                      <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="login">Login</TabsTrigger>
                        <TabsTrigger value="register">Register</TabsTrigger>
                      </TabsList>
                      <TabsContent value="login">
                        <LoginForm 
                          role={portal.role as 'admin' | 'teacher' | 'student'} 
                          onClose={() => setOpenDialog(null)} 
                        />
                      </TabsContent>
                      <TabsContent value="register">
                        {portal.role === 'admin' && <AdminRegisterForm onClose={() => setOpenDialog(null)} />}
                        {portal.role === 'teacher' && <TeacherRegisterForm onClose={() => setOpenDialog(null)} />}
                        {portal.role === 'student' && <StudentRegisterForm onClose={() => setOpenDialog(null)} />}
                      </TabsContent>
                    </Tabs>
                  </DialogContent>
                </Dialog>

                {/* Role Badge */}
                <div className="absolute top-4 right-4">
                  <div className={`bg-gradient-to-r ${portal.gradient} text-white px-3 py-1 rounded-full text-xs font-medium shadow-lg`}>
                    {portal.role}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="text-center mt-12 space-y-6">
          <div className="bg-gradient-glassmorphism backdrop-blur-glass border border-white/20 rounded-2xl p-6 max-w-4xl mx-auto">
            <h3 className="text-xl font-bold mb-4 text-foreground">SmartPresence Demo</h3>
            <p className="text-muted-foreground mb-4">
              Watch our demo video to see how SmartPresence transforms attendance management.
            </p>
            <Button 
              onClick={() => window.open('https://youtu.be/4-xrig8Z-no?si=WbUyQTy-hYSZ00hC', '_blank')}
              className="bg-gradient-to-r from-blue-500 to-purple-500 hover:scale-105 transition-transform text-white font-semibold"
            >
              Watch Demo Video
            </Button>
          </div>
          <p className="text-muted-foreground mb-4">
            Don't have an account? Contact your institution administrator.
          </p>
          <Button variant="outline" className="backdrop-blur-glass bg-gradient-glassmorphism border-white/20">
            Request Access
          </Button>
        </div>
      </div>
    </section>
  );
};

export default LoginCards;