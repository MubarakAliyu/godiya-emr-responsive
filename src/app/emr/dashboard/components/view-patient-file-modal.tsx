import { X, User, Phone, MapPin, Calendar, FileText, Activity, Heart, Users, Folder } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Button } from '@/app/components/ui/button';
import { Badge } from '@/app/components/ui/badge';
import { ScrollArea } from '@/app/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/ui/tabs';
import { format } from 'date-fns';
import type { Patient } from '@/app/emr/store/types';

const formatDate = (dateString: string | undefined, formatStr: string = 'MMM dd, yyyy') => {
  if (!dateString) return 'N/A';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'N/A';
    return format(date, formatStr);
  } catch {
    return 'N/A';
  }
};

interface ViewPatientFileModalProps {
  isOpen: boolean;
  onClose: () => void;
  patient: Patient | null;
}

export function ViewPatientFileModal({ isOpen, onClose, patient }: ViewPatientFileModalProps) {
  if (!patient) return null;

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      'Active': { variant: 'default', className: 'bg-green-100 text-green-700 hover:bg-green-100' },
      'Admitted': { variant: 'default', className: 'bg-blue-100 text-blue-700 hover:bg-blue-100' },
      'Discharged': { variant: 'secondary' },
      'Pending Payment': { variant: 'destructive', className: 'bg-orange-100 text-orange-700 hover:bg-orange-100' },
    };
    return variants[status] || { variant: 'default' };
  };

  const getPatientTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      'Inpatient': 'bg-blue-100 text-blue-700',
      'Outpatient': 'bg-green-100 text-green-700',
    };
    return colors[type] || 'bg-gray-100 text-gray-700';
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            style={{ height: '100vh', width: '100vw' }}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-5xl max-h-[90vh] bg-white rounded-xl shadow-2xl z-50 overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-5 flex items-center justify-between text-white">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center">
                  <Folder className="w-8 h-8" />
                </div>
                <div>
                  <h2 className="text-2xl font-semibold">Patient File Details</h2>
                  <p className="text-blue-100 text-sm mt-1">Complete medical record and information</p>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={onClose} className="text-white hover:bg-white/20">
                <X className="w-5 h-5" />
              </Button>
            </div>

            {/* Patient Header Card */}
            <div className="bg-gradient-to-br from-blue-50 to-white p-6 border-b border-border">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  <div className="w-20 h-20 rounded-full bg-blue-100 flex items-center justify-center">
                    <User className="w-10 h-10 text-blue-600" />
                  </div>
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-2xl font-semibold">{patient.fullName}</h3>
                      <Badge {...getStatusBadge(patient.status)} className="text-xs">
                        {patient.status}
                      </Badge>
                      <Badge className={`${getPatientTypeColor(patient.patientType)} hover:${getPatientTypeColor(patient.patientType)}`}>
                        {patient.patientType}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-x-8 gap-y-1 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4" />
                        <span>File No: <strong className="text-foreground">{patient.id}</strong></span>
                      </div>
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4" />
                        <span>Gender: <strong className="text-foreground">{patient.gender}</strong></span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        <span>Age: <strong className="text-foreground">{patient.age} years</strong></span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        <span>DOB: <strong className="text-foreground">{formatDate(patient.dateOfBirth)}</strong></span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground mb-1">Registered On</p>
                  <p className="text-sm font-semibold">{formatDate(patient.dateRegistered)}</p>
                  <p className="text-xs text-muted-foreground mt-1">{formatDate(patient.dateRegistered, 'hh:mm a')}</p>
                </div>
              </div>
            </div>

            {/* Content - Scrollable */}
            <ScrollArea className="flex-1 overflow-auto">
              <Tabs defaultValue="personal" className="p-6">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="personal">Personal Info</TabsTrigger>
                  <TabsTrigger value="contact">Contact Details</TabsTrigger>
                  <TabsTrigger value="emergency">Emergency Contact</TabsTrigger>
                  <TabsTrigger value="medical">Medical Notes</TabsTrigger>
                </TabsList>

                {/* Personal Information Tab */}
                <TabsContent value="personal" className="space-y-6 mt-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold flex items-center gap-2">
                        <User className="w-5 h-5 text-blue-600" />
                        Basic Information
                      </h3>
                      <div className="space-y-3 bg-muted/30 p-4 rounded-lg">
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">First Name:</span>
                          <span className="text-sm font-medium">{patient.firstName}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Last Name:</span>
                          <span className="text-sm font-medium">{patient.lastName}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Full Name:</span>
                          <span className="text-sm font-medium">{patient.fullName}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Gender:</span>
                          <span className="text-sm font-medium">{patient.gender}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Date of Birth:</span>
                          <span className="text-sm font-medium">{formatDate(patient.dateOfBirth, 'MMMM dd, yyyy')}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Age:</span>
                          <span className="text-sm font-medium">{patient.age} years</span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold flex items-center gap-2">
                        <Activity className="w-5 h-5 text-green-600" />
                        File Information
                      </h3>
                      <div className="space-y-3 bg-muted/30 p-4 rounded-lg">
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">File Number:</span>
                          <span className="text-sm font-medium font-mono">{patient.id}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Patient Type:</span>
                          <Badge className={`${getPatientTypeColor(patient.patientType)} hover:${getPatientTypeColor(patient.patientType)}`}>
                            {patient.patientType}
                          </Badge>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Status:</span>
                          <Badge {...getStatusBadge(patient.status)}>
                            {patient.status}
                          </Badge>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Registration Date:</span>
                          <span className="text-sm font-medium">{formatDate(patient.dateRegistered)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Registration Time:</span>
                          <span className="text-sm font-medium">{formatDate(patient.dateRegistered, 'hh:mm a')}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                {/* Contact Details Tab */}
                <TabsContent value="contact" className="space-y-6 mt-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <Phone className="w-5 h-5 text-blue-600" />
                      Contact Information
                    </h3>
                    <div className="bg-muted/30 p-6 rounded-lg space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">Phone Number</p>
                          <div className="flex items-center gap-2">
                            <Phone className="w-4 h-4 text-muted-foreground" />
                            <p className="text-sm font-medium">{patient.phoneNumber}</p>
                          </div>
                        </div>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Home Address</p>
                        <div className="flex items-start gap-2">
                          <MapPin className="w-4 h-4 text-muted-foreground mt-0.5" />
                          <p className="text-sm font-medium">{patient.address}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                {/* Emergency Contact Tab */}
                <TabsContent value="emergency" className="space-y-6 mt-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <Heart className="w-5 h-5 text-red-600" />
                      Emergency Contact Information
                    </h3>
                    <div className="bg-muted/30 p-6 rounded-lg space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <p className="text-sm text-muted-foreground mb-2">Emergency Contact Name</p>
                          <div className="flex items-center gap-2 p-3 bg-white rounded-lg border border-border">
                            <Users className="w-4 h-4 text-muted-foreground" />
                            <p className="text-sm font-medium">{patient.emergencyContactName}</p>
                          </div>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground mb-2">Emergency Contact Phone</p>
                          <div className="flex items-center gap-2 p-3 bg-white rounded-lg border border-border">
                            <Phone className="w-4 h-4 text-muted-foreground" />
                            <p className="text-sm font-medium">{patient.emergencyContactPhone}</p>
                          </div>
                        </div>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground mb-2">Next of Kin</p>
                        <div className="flex items-center gap-2 p-3 bg-white rounded-lg border border-border">
                          <User className="w-4 h-4 text-muted-foreground" />
                          <p className="text-sm font-medium">{patient.nextOfKin}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                {/* Medical Notes Tab */}
                <TabsContent value="medical" className="space-y-6 mt-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <FileText className="w-5 h-5 text-purple-600" />
                      Medical Notes & Additional Information
                    </h3>
                    <div className="bg-muted/30 p-6 rounded-lg">
                      {patient.notes ? (
                        <p className="text-sm leading-relaxed whitespace-pre-wrap">{patient.notes}</p>
                      ) : (
                        <p className="text-sm text-muted-foreground italic">No medical notes available for this patient.</p>
                      )}
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </ScrollArea>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-border flex items-center justify-between bg-muted/30">
              <p className="text-xs text-muted-foreground">
                File created on {formatDate(patient.dateRegistered, 'MMMM dd, yyyy')} at {formatDate(patient.dateRegistered, 'hh:mm a')}
              </p>
              <div className="flex gap-2">
                <Button variant="outline" onClick={onClose}>
                  Close
                </Button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}