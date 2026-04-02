import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Save, User, Phone, Mail, Shield, Building } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { toast } from 'sonner';
import { getAuthState, validateSession } from '@/app/emr/utils/auth';

interface UserAccountProps {
    onUpdate: () => void;
}

export function UserAccount({ onUpdate }: UserAccountProps) {
    const authState = getAuthState();
    const user = authState?.user;

    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        phone_number: '',
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (user) {
            const names = (user.name || '').split(' ');
            setFormData({
                firstName: names[0] || '',
                lastName: names.slice(1).join(' ') || '',
                phone_number: user.phone_number || '',
            });
        }
    }, [user]);

    const handleChange = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        onUpdate();
    };

    const handleSave = async () => {
        if (!formData.firstName || !formData.lastName) {
            toast.error('First name and last name are required');
            return;
        }

        setIsSubmitting(true);
        try {
            const response = await fetch('/api/auth.php?action=update_profile', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
                credentials: 'include',
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to update profile');
            }

            toast.success('Profile updated successfully');

            // Refresh session to get updated name/details locally
            await validateSession();

        } catch (error: any) {
            toast.error('Update Failed', {
                description: error.message,
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="space-y-8"
        >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Profile Details Section */}
                <div className="space-y-6">
                    <div className="flex items-center gap-2 pb-2 border-b border-border">
                        <User className="w-5 h-5 text-primary" />
                        <h2 className="text-lg font-semibold">Personal Information</h2>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="firstName">First Name</Label>
                            <Input
                                id="firstName"
                                value={formData.firstName}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange('firstName', e.target.value)}
                                placeholder="First Name"
                                disabled={isSubmitting}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="lastName">Last Name</Label>
                            <Input
                                id="lastName"
                                value={formData.lastName}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange('lastName', e.target.value)}
                                placeholder="Last Name"
                                disabled={isSubmitting}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="phone">Phone Number</Label>
                        <div className="relative">
                            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input
                                id="phone"
                                value={formData.phone_number}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange('phone_number', e.target.value)}
                                placeholder="Phone Number"
                                className="pl-9"
                                disabled={isSubmitting}
                            />
                        </div>
                    </div>
                </div>

                {/* Account Info (Read-only) Section */}
                <div className="space-y-6">
                    <div className="flex items-center gap-2 pb-2 border-b border-border">
                        <Shield className="w-5 h-5 text-primary" />
                        <h2 className="text-lg font-semibold">Account Details</h2>
                    </div>

                    <div className="space-y-4">
                        <div className="p-4 bg-muted/30 rounded-lg space-y-3">
                            <div className="flex items-center gap-3">
                                <Mail className="w-4 h-4 text-muted-foreground" />
                                <div>
                                    <p className="text-xs text-muted-foreground">Email Address</p>
                                    <p className="text-sm font-medium">{user?.email}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <Shield className="w-4 h-4 text-muted-foreground" />
                                <div>
                                    <p className="text-xs text-muted-foreground">System Role</p>
                                    <p className="text-sm font-medium">{user?.role}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <Building className="w-4 h-4 text-muted-foreground" />
                                <div>
                                    <p className="text-xs text-muted-foreground">Department</p>
                                    <p className="text-sm font-medium">{user?.department || 'Not Assigned'}</p>
                                </div>
                            </div>
                        </div>

                        <div className="p-4 bg-blue-50 border border-blue-100 rounded-lg">
                            <p className="text-xs text-blue-700 leading-relaxed">
                                Contact your administrator to change your email address, role, or department assignment.
                                These details are managed centrally for system security.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-border">
                <Button onClick={handleSave} disabled={isSubmitting} className="gap-2">
                    {isSubmitting ? (
                        'Saving Changes...'
                    ) : (
                        <>
                            <Save className="w-4 h-4" />
                            Update Profile
                        </>
                    )}
                </Button>
            </div>
        </motion.div>
    );
}
