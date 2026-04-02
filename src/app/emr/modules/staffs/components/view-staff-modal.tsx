import { motion, AnimatePresence } from 'motion/react';
import { X, Mail, Phone, MapPin, Calendar, Briefcase, User, Shield } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { Badge } from '@/app/components/ui/badge';
import type { Staff } from '@/app/emr/store/types';
import { format } from 'date-fns';

interface ViewStaffModalProps {
  isOpen: boolean;
  onClose: () => void;
  staff: Staff | null;
}

export function ViewStaffModal({ isOpen, onClose, staff }: ViewStaffModalProps) {
  if (!staff) return null;

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      'Active': { variant: 'default', className: 'bg-green-100 text-green-700 hover:bg-green-100' },
      'On Leave': { variant: 'default', className: 'bg-yellow-100 text-yellow-700 hover:bg-yellow-100' },
      'Suspended': { variant: 'destructive', className: 'bg-red-100 text-red-700 hover:bg-red-100' },
      'Resigned': { variant: 'secondary' },
    };
    return variants[status] || { variant: 'default' };
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] overflow-y-auto">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
          />

          {/* Modal Container */}
          <div className="fixed inset-0 flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden pointer-events-auto"
            >
              {/* Header */}
              <div className="sticky top-0 bg-white border-b border-border px-6 py-4 flex items-center justify-between z-10">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center overflow-hidden border-2 border-primary/10">
                    {staff.profilePhoto ? (
                      <img src={staff.profilePhoto} alt={staff.fullName} className="w-full h-full object-cover" />
                    ) : (
                      <User className="w-8 h-8 text-muted-foreground" />
                    )}
                  </div>
                  <div>
                    <h2 className="text-2xl font-semibold">Staff Details</h2>
                    <p className="text-sm text-muted-foreground mt-0.5">{staff.fullName}</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onClose}
                  className="h-8 w-8 rounded-full"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>

              {/* Content - Scrollable */}
              <div className="overflow-y-auto max-h-[calc(90vh-140px)] p-6 space-y-6">
                {/* Basic Info Section */}
                <div>
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <User className="w-5 h-5 text-blue-600" />
                    Basic Information
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Staff ID</label>
                      <p className="text-sm font-medium mt-1">{staff.id}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Full Name</label>
                      <p className="text-sm font-medium mt-1">{staff.fullName}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Gender</label>
                      <p className="text-sm mt-1">{staff.gender}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Status</label>
                      <div className="mt-1">
                        <Badge {...getStatusBadge(staff.status)} className="text-xs">
                          {staff.status}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="border-t border-border" />

                {/* Contact Info Section */}
                <div>
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Phone className="w-5 h-5 text-green-600" />
                    Contact Information
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <Mail className="w-4 h-4 text-muted-foreground mt-0.5" />
                      <div className="flex-1">
                        <label className="text-sm font-medium text-muted-foreground">Email</label>
                        <p className="text-sm mt-1">{staff.email}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Phone className="w-4 h-4 text-muted-foreground mt-0.5" />
                      <div className="flex-1">
                        <label className="text-sm font-medium text-muted-foreground">Phone Number</label>
                        <p className="text-sm mt-1">{staff.phoneNumber}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <MapPin className="w-4 h-4 text-muted-foreground mt-0.5" />
                      <div className="flex-1">
                        <label className="text-sm font-medium text-muted-foreground">Address</label>
                        <p className="text-sm mt-1">{staff.address}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="border-t border-border" />

                {/* Work Info Section */}
                <div>
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Briefcase className="w-5 h-5 text-purple-600" />
                    Work Information
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Department</label>
                      <p className="text-sm mt-1">{staff.department}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Role</label>
                      <div className="mt-1">
                        <Badge variant="outline" className="text-xs">{staff.role}</Badge>
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Employment Type</label>
                      <p className="text-sm mt-1">{staff.employmentType}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Date Joined</label>
                      <div className="flex items-center gap-2 mt-1">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        <p className="text-sm">{format(new Date(staff.dateJoined), 'MMM dd, yyyy')}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="sticky bottom-0 bg-muted/50 px-6 py-4 flex items-center justify-end gap-3 border-t border-border">
                <Button variant="outline" onClick={onClose}>
                  Close
                </Button>
              </div>
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
}