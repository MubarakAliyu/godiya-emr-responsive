import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { Mail, ArrowLeft, Shield, Activity, Database } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { toast } from 'sonner';

export function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const validateEmail = (email: string) => {
    if (!email) return 'Email is required';
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) return 'Enter a valid email address';
    return '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setEmailError('');

    const emailValidation = validateEmail(email);
    if (emailValidation) {
      setEmailError(emailValidation);
      return;
    }

    const SUPER_ADMIN_EMAIL = 'ghaliyu@gmail.com';

    setIsLoading(true);

    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    if (email === SUPER_ADMIN_EMAIL) {
      toast.success('Reset password link sent to your email successfully.');
      
      setTimeout(() => {
        navigate('/emr/login');
      }, 1500);
    } else {
      setIsLoading(false);
      setEmailError('Invalid email address. Please contact system administrator.');
      toast.error('Invalid email address. Please contact system administrator.');
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Branding */}
      <motion.div 
        initial={{ opacity: 0, x: -50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6 }}
        className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary via-primary to-primary/90 text-white relative overflow-hidden"
      >
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }} />
        </div>

        <div className="relative z-10 flex flex-col justify-between p-12 w-full">
          <div>
            <div className="flex items-center gap-3 mb-8">
              <div className="bg-white/20 backdrop-blur-sm p-3 rounded-xl">
                <Activity className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-semibold">Godiya EMR</h1>
                <p className="text-sm text-white/80">Hospital Management System</p>
              </div>
            </div>

            <div className="space-y-8 mt-16">
              <h2 className="text-4xl font-semibold leading-tight">
                Godiya Hospital<br />EMR/HMS
              </h2>
              <p className="text-lg text-white/90 max-w-md">
                Secure hospital operations, patient records, billing, lab, and pharmacy in one system.
              </p>

              <div className="space-y-4 mt-12">
                <div className="flex items-start gap-3">
                  <div className="bg-white/20 backdrop-blur-sm p-2 rounded-lg mt-1">
                    <Shield className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-medium mb-1">Secure Access & Data Protection</h3>
                    <p className="text-sm text-white/80">Enterprise-grade security with role-based access control</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="bg-white/20 backdrop-blur-sm p-2 rounded-lg mt-1">
                    <Activity className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-medium mb-1">Real-time Patient Records & Workflow Tracking</h3>
                    <p className="text-sm text-white/80">Instant access to patient information and treatment history</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="bg-white/20 backdrop-blur-sm p-2 rounded-lg mt-1">
                    <Database className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-medium mb-1">Multi-department Integration</h3>
                    <p className="text-sm text-white/80">Seamlessly connect Lab, Pharmacy, Billing and more</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="text-sm text-white/70">
            © 2026 Godiya Hospital. All rights reserved.
          </div>
        </div>
      </motion.div>

      {/* Right Panel - Forgot Password Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-muted/30">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="w-full max-w-md"
        >
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="bg-primary/10 p-3 rounded-xl">
              <Activity className="w-8 h-8 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-primary">Godiya EMR</h1>
              <p className="text-sm text-muted-foreground">Hospital Management System</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-8 border border-border">
            <div className="mb-8">
              <h2 className="text-3xl font-semibold text-foreground mb-2">Reset Password</h2>
              <p className="text-muted-foreground">Enter your email to receive a reset link</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setEmailError('');
                    }}
                    className={`pl-10 h-12 bg-input-background border ${emailError ? 'border-destructive' : 'border-border'} focus:border-primary focus:ring-2 focus:ring-primary/20`}
                  />
                </div>
                {emailError && (
                  <p className="text-sm text-destructive">{emailError}</p>
                )}
              </div>

              <Button
                type="submit"
                className="w-full h-12 bg-primary hover:bg-primary/90 text-white shadow-md hover:shadow-lg transition-all"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Sending reset link...
                  </div>
                ) : (
                  'Send Reset Link'
                )}
              </Button>
            </form>

            <button
              onClick={() => navigate('/emr/login')}
              className="flex items-center gap-2 text-sm text-primary hover:underline font-medium mt-6"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to login
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}