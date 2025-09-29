import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import Index from "./pages/Index";
import AdminDashboard from "./pages/AdminDashboard";
import TeacherDashboard from "./pages/TeacherDashboard";
import StudentDashboard from "./pages/StudentDashboard";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const ProtectedRoute = ({ children, allowedRoles }: { children: React.ReactNode; allowedRoles: string[] }) => {
  const { user, userRole, userStatus, loading } = useAuth();
  const demoRole = typeof window !== 'undefined' ? localStorage.getItem('demo_role') : null;
  
  // Allow demo access (demo users don't have a real user object)
  if (demoRole && allowedRoles.includes(demoRole)) {
    return <>{children}</>;
  }
  
  if (loading) return <div>Loading...</div>;
  if (!user) return <Navigate to="/" replace />;
  if (userStatus !== 'approved') return <Navigate to="/" replace />;
  if (!allowedRoles.includes(userRole || '')) return <Navigate to="/" replace />;
  
  return <>{children}</>;
};

const AppRoutes = () => {
  const { user, userRole, userStatus } = useAuth();
  const location = useLocation();
  const demoRole = typeof window !== 'undefined' ? localStorage.getItem('demo_role') : null;
  
  // Redirect demo users to their dashboard only from home
  if (demoRole && location.pathname === '/') {
    if (demoRole === 'admin') return <Navigate to="/admin" replace />;
    if (demoRole === 'teacher') return <Navigate to="/teacher" replace />;
    if (demoRole === 'student') return <Navigate to="/student" replace />;
  }
  
  // Redirect authenticated users to their dashboard only from home
  if (user && userStatus === 'approved' && userRole && location.pathname === '/') {
    if (userRole === 'admin') return <Navigate to="/admin" replace />;
    if (userRole === 'teacher') return <Navigate to="/teacher" replace />;
    if (userRole === 'student') return <Navigate to="/student" replace />;
  }
  
  return (
    <Routes>
      <Route path="/" element={<Index />} />
      <Route path="/admin" element={
        <ProtectedRoute allowedRoles={['admin']}>
          <AdminDashboard />
        </ProtectedRoute>
      } />
      <Route path="/teacher" element={
        <ProtectedRoute allowedRoles={['teacher']}>
          <TeacherDashboard />
        </ProtectedRoute>
      } />
      <Route path="/student" element={
        <ProtectedRoute allowedRoles={['student']}>
          <StudentDashboard />
        </ProtectedRoute>
      } />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
