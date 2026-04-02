import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Shield, Copy, Check, Smartphone } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { toast } from 'sonner';

interface Enable2FAModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export function Enable2FAModal({ isOpen, onClose, onConfirm }: Enable2FAModalProps) {
  const [step, setStep] = useState(1);
  const [verificationCode, setVerificationCode] = useState('');
  const [copied, setCopied] = useState(false);

  // Mock 2FA secret key
  const secretKey = 'JBSWY3DPEHPK3PXP';
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=otpauth://totp/GodiyaHospital:user@example.com?secret=${secretKey}&issuer=GodiyaHospital`;

  const handleCopySecret = () => {
    navigator.clipboard.writeText(secretKey);
    setCopied(true);
    toast.success('Secret key copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleVerify = () => {
    if (verificationCode.length !== 6) {
      toast.error('Please enter a 6-digit code');
      return;
    }

    // Simulate verification
    toast.success('2FA enabled successfully');
    onConfirm();
    handleClose();
  };

  const handleClose = () => {
    setStep(1);
    setVerificationCode('');
    setCopied(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white rounded-xl shadow-xl max-w-md w-full"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-border">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Shield className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-bold">Enable 2FA</h2>
                <p className="text-sm text-muted-foreground">
                  Step {step} of 2
                </p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="p-2 hover:bg-muted rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6">
            {step === 1 ? (
              <div className="space-y-4">
                <div className="text-center">
                  <h3 className="text-lg font-semibold mb-2">
                    Scan QR Code
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Use an authenticator app like Google Authenticator or Authy to scan this QR code
                  </p>

                  {/* QR Code */}
                  <div className="flex justify-center mb-4">
                    <div className="p-4 bg-white border-2 border-border rounded-lg">
                      <img
                        src={qrCodeUrl}
                        alt="2FA QR Code"
                        className="w-48 h-48"
                      />
                    </div>
                  </div>

                  {/* Manual Entry */}
                  <div className="text-left p-4 bg-muted/30 rounded-lg">
                    <Label className="text-xs font-medium mb-2 block">
                      Can't scan? Enter this code manually:
                    </Label>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 p-2 bg-white border border-border rounded text-sm font-mono">
                        {secretKey}
                      </code>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleCopySecret}
                        className="gap-2"
                      >
                        {copied ? (
                          <Check className="w-4 h-4 text-green-600" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button variant="outline" onClick={handleClose} className="flex-1">
                    Cancel
                  </Button>
                  <Button onClick={() => setStep(2)} className="flex-1">
                    Next
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="text-center">
                  <div className="inline-flex p-3 rounded-full bg-primary/10 mb-3">
                    <Smartphone className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">
                    Enter Verification Code
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Enter the 6-digit code from your authenticator app
                  </p>
                </div>

                {/* Verification Code Input */}
                <div className="space-y-2">
                  <Label htmlFor="verificationCode">Verification Code</Label>
                  <Input
                    id="verificationCode"
                    type="text"
                    maxLength={6}
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                    placeholder="000000"
                    className="text-center text-2xl font-mono tracking-wider"
                  />
                  <p className="text-xs text-muted-foreground text-center">
                    Code expires in 30 seconds
                  </p>
                </div>

                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex gap-3">
                    <Shield className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-blue-700">
                      <p className="font-medium mb-1">Keep your backup codes safe</p>
                      <p>
                        After enabling 2FA, you'll receive backup codes. Store them securely in case you lose access to your authenticator app.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button variant="outline" onClick={() => setStep(1)} className="flex-1">
                    Back
                  </Button>
                  <Button 
                    onClick={handleVerify} 
                    className="flex-1"
                    disabled={verificationCode.length !== 6}
                  >
                    Verify & Enable
                  </Button>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
