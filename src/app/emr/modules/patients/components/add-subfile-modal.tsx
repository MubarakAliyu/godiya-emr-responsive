import { useState } from 'react';
import { useEMRStore } from '@/app/emr/store/emr-store';
import { motion, AnimatePresence } from 'motion/react';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/app/components/ui/select';
import { X, UserPlus, Heart, Activity } from 'lucide-react';
import { toast } from 'sonner';
import { Gender } from '@/app/emr/store/types';

interface AddSubfileModalProps {
    isOpen: boolean;
    onClose: () => void;
    parentFileId: string;
}

export function AddSubfileModal({ isOpen, onClose, parentFileId }: AddSubfileModalProps) {
    const { addSubfile } = useEMRStore();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        gender: '' as Gender,
        maritalStatus: '',
        allergies: '',
        dateOfBirth: '',
        bloodGroup: '',
    });

    const handleChange = (field: string, value: string) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.firstName || !formData.lastName || !formData.gender) {
            toast.error('Please fill in required fields');
            return;
        }

        setIsSubmitting(true);
        try {
            addSubfile({
                fileId: parentFileId,
                firstName: formData.firstName,
                lastName: formData.lastName,
                gender: formData.gender,
                maritalStatus: formData.maritalStatus,
                allergies: formData.allergies,
                dateOfBirth: formData.dateOfBirth,
                bloodGroup: formData.bloodGroup,
                isDead: false,
            });

            toast.success('Family member added successfully');
            setFormData({
                firstName: '',
                lastName: '',
                gender: '' as any,
                maritalStatus: '',
                allergies: '',
                dateOfBirth: '',
                bloodGroup: '',
            });
            onClose();
        } catch (error) {
            toast.error('Failed to add family member');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm"
                    />
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden relative z-10"
                    >
                        {/* Header */}
                        <div className="px-6 py-4 border-b border-border flex items-center justify-between bg-primary/5">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-primary/10 text-primary">
                                    <UserPlus className="w-5 h-5" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold">Add Family Member</h2>
                                    <p className="text-sm text-muted-foreground">Parent File ID: {parentFileId}</p>
                                </div>
                            </div>
                            <Button variant="ghost" size="icon" onClick={onClose}>
                                <X className="w-5 h-5" />
                            </Button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Basic Info */}
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="firstName">First Name <span className="text-destructive">*</span></Label>
                                        <Input
                                            id="firstName"
                                            value={formData.firstName}
                                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange('firstName', e.target.value)}
                                            placeholder="Enter first name"
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="lastName">Last Name <span className="text-destructive">*</span></Label>
                                        <Input
                                            id="lastName"
                                            value={formData.lastName}
                                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange('lastName', e.target.value)}
                                            placeholder="Enter last name"
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="gender">Gender <span className="text-destructive">*</span></Label>
                                        <Select value={formData.gender} onValueChange={(value: string) => handleChange('gender', value)}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select gender" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="Male">Male</SelectItem>
                                                <SelectItem value="Female">Female</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="maritalStatus">Marital Status</Label>
                                        <Select value={formData.maritalStatus} onValueChange={(value: string) => handleChange('maritalStatus', value)}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select status" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="Single">Single</SelectItem>
                                                <SelectItem value="Married">Married</SelectItem>
                                                <SelectItem value="Divorced">Divorced</SelectItem>
                                                <SelectItem value="Widowed">Widowed</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                {/* Medical Info */}
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="dateOfBirth">Date of Birth</Label>
                                        <Input
                                            id="dateOfBirth"
                                            type="date"
                                            value={formData.dateOfBirth}
                                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange('dateOfBirth', e.target.value)}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="bloodGroup">Blood Group</Label>
                                        <Select value={formData.bloodGroup} onValueChange={(value: string) => handleChange('bloodGroup', value)}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select group" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="A+">A+</SelectItem>
                                                <SelectItem value="A-">A-</SelectItem>
                                                <SelectItem value="B+">B+</SelectItem>
                                                <SelectItem value="B-">B-</SelectItem>
                                                <SelectItem value="O+">O+</SelectItem>
                                                <SelectItem value="O-">O-</SelectItem>
                                                <SelectItem value="AB+">AB+</SelectItem>
                                                <SelectItem value="AB-">AB-</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="allergies">Known Allergies</Label>
                                        <Input
                                            id="allergies"
                                            value={formData.allergies}
                                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange('allergies', e.target.value)}
                                            placeholder="e.g. Penicillin, Peanuts"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="mt-8 flex justify-end gap-3 border-t border-border pt-6">
                                <Button variant="outline" type="button" onClick={onClose}>
                                    Cancel
                                </Button>
                                <Button type="submit" disabled={isSubmitting}>
                                    {isSubmitting ? 'Adding Member...' : 'Add Family Member'}
                                </Button>
                            </div>
                        </form>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
