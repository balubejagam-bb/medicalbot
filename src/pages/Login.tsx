import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { Heart, Shield, Stethoscope } from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const { signIn } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await signIn(email, password);
      toast({
        title: 'Welcome back!',
        description: 'Successfully signed in to MediCare-ICU Assistant.',
      });
      // Wait a moment for auth state to update, then navigate
      setTimeout(() => {
        navigate('/dashboard');
      }, 100);
    } catch (error: any) {
      setError(error.message || 'Failed to sign in');
      toast({
        title: 'Sign in failed',
        description: error.message || 'Failed to sign in',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="text-center space-y-3 sm:space-y-4">
          <div className="flex items-center justify-center space-x-2 mb-3 sm:mb-4">
            <div className="flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 bg-primary rounded-lg">
              <Heart className="w-5 h-5 sm:w-6 sm:h-6 text-primary-foreground" />
            </div>
            <div className="flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 bg-accent rounded-lg">
              <Stethoscope className="w-5 h-5 sm:w-6 sm:h-6 text-accent-foreground" />
            </div>
            <div className="flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 bg-success rounded-lg">
              <Shield className="w-5 h-5 sm:w-6 sm:h-6 text-success-foreground" />
            </div>
          </div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground">MediCare-ICU Assistant</h1>
          <p className="text-sm sm:text-base text-muted-foreground">KIMS Hospitals - Advanced Clinical Intelligence</p>
        </div>

        {/* Login Form */}
        <Card className="shadow-medical border-0">
          <CardHeader className="text-center pb-4 sm:pb-6">
            <CardTitle className="text-lg sm:text-xl">Welcome Back</CardTitle>
            <CardDescription className="text-sm sm:text-base">Sign in to access your medical assistant</CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="doctor@kims.hospital"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="h-10 sm:h-11 text-sm sm:text-base"
                />
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label htmlFor="password" className="text-sm font-medium">Password</Label>
                  <Link 
                    to="/reset-password" 
                    className="text-xs sm:text-sm text-primary hover:underline"
                  >
                    Forgot password?
                  </Link>
                </div>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="h-10 sm:h-11 text-sm sm:text-base"
                />
              </div>
              
              <Button 
                type="submit" 
                className="w-full h-10 sm:h-11 bg-gradient-to-r from-primary to-accent text-white font-medium text-sm sm:text-base"
                disabled={loading}
                size="sm"
              >
                {loading ? 'Signing In...' : 'Sign In'}
              </Button>
            </form>
            
            <div className="mt-6 text-center">
              <p className="text-sm text-muted-foreground">
                Don't have an account?{' '}
                <Link to="/register" className="text-primary hover:underline font-medium">
                  Register here
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Security Notice */}
        <div className="text-xs text-center text-muted-foreground bg-card p-3 rounded-lg border">
          <Shield className="w-4 h-4 mx-auto mb-1" />
          <p>Your medical data is protected with enterprise-grade security</p>
        </div>
      </div>
    </div>
  );
};

export default Login;