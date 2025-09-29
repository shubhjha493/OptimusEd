import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Eye, EyeOff, Lock, Mail } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface LoginFormProps {
  role: 'admin' | 'teacher' | 'student';
  onClose: () => void;
}

const LoginForm: React.FC<LoginFormProps> = ({ role, onClose }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const getRoleColor = () => {
    switch (role) {
      case 'admin': return 'from-red-500 to-orange-500';
      case 'teacher': return 'from-blue-500 to-indigo-500';
      case 'student': return 'from-green-500 to-emerald-500';
      default: return 'from-blue-500 to-indigo-500';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    // Handle demo credentials (frontend-only)
    const demos = {
      admin: { email: 'admin@demo.com', password: 'admin123', path: '/admin' },
      teacher: { email: 'teacher@demo.com', password: 'teacher123', path: '/teacher' },
      student: { email: 'student@demo.com', password: 'student123', path: '/student' },
    } as const;

    const match = demos[role];
    if (email.trim().toLowerCase() === match.email && password === match.password) {
      try { localStorage.setItem('demo_role', role); } catch {}
      toast({ title: "Demo Login", description: `Logged in as ${role}.` });
      onClose();
      navigate(match.path);
      return;
    }

    setLoading(true);
    const { error } = await signIn(email, password);
    
    if (error) {
      toast({
        title: "Login Failed",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Logged in successfully!",
      });
      onClose();
    }
    setLoading(false);
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className={`w-16 h-16 bg-gradient-to-br ${getRoleColor()} rounded-2xl flex items-center justify-center shadow-lg mx-auto mb-4`}>
          <Lock className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-2xl font-bold capitalize">{role} Login</h2>
        <p className="text-muted-foreground">Sign in to your {role} account</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              id="email"
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="pl-10"
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="pl-10 pr-10"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <Button
          type="submit"
          className={`w-full bg-gradient-to-r ${getRoleColor()} hover:scale-105 transition-transform text-white font-semibold`}
          disabled={loading}
        >
          {loading ? 'Signing in...' : 'Sign In'}
        </Button>
      </form>
    </div>
  );
};

export default LoginForm;