import { motion } from 'motion/react';
import { Link, useNavigate } from 'react-router-dom';
import { Lock, Mail, Shield, Phone, ArrowLeft, HelpCircle } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { Card, CardContent } from '@/app/components/ui/card';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';

export function EmrLoginPage() {
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Redirect to the actual EMR login
    navigate('/emr/login');
  };

  return (
    <div className="min-h-screen pt-20 bg-gradient-to-br from-primary/5 via-white to-secondary/5">
      {/* Back Link */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl pt-8">
        <Link to="/" className="inline-flex items-center text-primary hover:underline">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Home
        </Link>
      </div>

      {/* Main Content */}
      <section className="py-16 flex items-center justify-center min-h-[calc(100vh-200px)]">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-md">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            {/* Logo/Header */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-primary rounded-2xl mb-4">
                <Lock className="h-10 w-10 text-white" />
              </div>
              <h1 className="text-3xl md:text-4xl font-bold mb-2">EMR Portal</h1>
              <p className="text-muted-foreground">
                Electronic Medical Records System
              </p>
            </div>

            {/* Login Card */}
            <Card className="shadow-2xl border-t-4 border-primary">
              <CardContent className="p-8">
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Email/Username */}
                  <div className="space-y-2">
                    <Label htmlFor="email">Email / Username</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                      <Input
                        id="email"
                        type="text"
                        placeholder="Enter your email or username"
                        className="pl-10 h-12"
                      />
                    </div>
                  </div>

                  {/* Password */}
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                      <Input
                        id="password"
                        type="password"
                        placeholder="Enter your password"
                        className="pl-10 h-12"
                      />
                    </div>
                  </div>

                  {/* Forgot Password Link */}
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() => navigate('/emr/forgot-password')}
                      className="text-sm text-primary hover:underline"
                    >
                      Forgot password?
                    </button>
                  </div>

                  {/* Login Button */}
                  <Button
                    type="submit"
                    size="lg"
                    className="w-full hover:scale-105 transition-transform text-lg py-6"
                  >
                    Sign In
                  </Button>
                </form>

                {/* Info Notice */}
                <div className="mt-6 p-4 bg-muted/50 rounded-lg">
                  <p className="text-sm text-muted-foreground text-center">
                    This portal is for authorized medical staff and administrators only.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Security Notice */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="mt-8"
            >
              <Card className="bg-white/80 backdrop-blur-sm">
                <CardContent className="p-6">
                  <div className="flex items-start gap-3">
                    <Shield className="h-6 w-6 text-secondary flex-shrink-0 mt-1" />
                    <div>
                      <h3 className="font-semibold mb-2">Security Notice</h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        All access to this system is monitored and logged. Patient data is protected under medical confidentiality and data protection regulations.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Help Section */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="mt-8 text-center"
            >
              <Card className="bg-muted/30">
                <CardContent className="p-6">
                  <HelpCircle className="h-8 w-8 text-primary mx-auto mb-4" />
                  <h3 className="font-semibold mb-2">Need Help Accessing the Portal?</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Contact our IT support team for login credentials or technical assistance.
                  </p>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-center gap-2 text-sm">
                      <Phone className="h-4 w-4 text-primary" />
                      <a href="tel:07066694965" className="text-primary hover:underline font-medium">
                        0706 669 4965
                      </a>
                    </div>
                    <div className="flex items-center justify-center gap-2 text-sm">
                      <Mail className="h-4 w-4 text-primary" />
                      <a href="mailto:support@godiyahospital.com" className="text-primary hover:underline font-medium">
                        support@godiyahospital.com
                      </a>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Footer Info */}
      <section className="py-8 border-t border-border bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl">
          <div className="grid md:grid-cols-3 gap-6 text-center text-sm text-muted-foreground">
            <div>
              <p className="font-semibold mb-1">Authorized Access Only</p>
              <p>Staff & Administrators</p>
            </div>
            <div>
              <p className="font-semibold mb-1">Data Security</p>
              <p>HIPAA Compliant System</p>
            </div>
            <div>
              <p className="font-semibold mb-1">Support Available</p>
              <p>24/7 Technical Support</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}