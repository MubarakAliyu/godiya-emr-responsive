import { useEMRStore } from '@/app/emr/store/emr-store';
import type { Patient } from '@/app/emr/store/types';
import { useNavigate } from 'react-router-dom';
import { usePatientBasePath } from '@/app/emr/hooks/usePatientBasePath';
import { differenceInYears } from 'date-fns';
import { motion, AnimatePresence } from 'motion/react';
import { Badge } from '@/app/components/ui/badge';
import { Button } from '@/app/components/ui/button';
import { UsersRound, X, Phone, MapPin, User, Eye, UserPlus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { AddSubfileModal } from './add-subfile-modal';

interface FamilySubfilesModalProps {
  isOpen: boolean;
  onClose: () => void;
  familyFile: Patient | null;
}

export function FamilySubfilesModal({ isOpen, onClose, familyFile }: FamilySubfilesModalProps) {
  const navigate = useNavigate();
  const patientBasePath = usePatientBasePath();
  const { subfiles: allSubfiles, deleteSubfile } = useEMRStore();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  if (!familyFile) return null;

  // Filter subfiles for this specific family file
  const subfiles = allSubfiles.filter((s) => s.fileId === familyFile.id);

  const handleViewFile = (sub: any) => {
    navigate(`${patientBasePath}/SF-${sub.id}/ipd-file`);
    onClose();
  };

  const getAge = (dateOfBirth?: string) => {
    if (!dateOfBirth) return 'N/A';
    try {
      return `${differenceInYears(new Date(), new Date(dateOfBirth))} years`;
    } catch {
      return 'N/A';
    }
  };

  const getStatusBadge = (isDead: boolean) => {
    if (isDead) {
      return <Badge className="bg-red-100 text-red-700 hover:bg-red-100 text-xs">Deceased</Badge>;
    }
    return <Badge className="bg-green-100 text-green-700 hover:bg-green-100 text-xs">Active</Badge>;
  };

  const getRelationshipBadge = (relationship?: string) => {
    if (!relationship) return <span className="text-muted-foreground text-xs">-</span>;

    const colors: Record<string, string> = {
      'Self': 'bg-purple-100 text-purple-700',
      'Spouse': 'bg-pink-100 text-pink-700',
      'Child': 'bg-blue-100 text-blue-700',
      'Parent': 'bg-green-100 text-green-700',
      'Sibling': 'bg-yellow-100 text-yellow-700',
      'Other': 'bg-gray-100 text-gray-700',
    };

    const colorClass = colors[relationship] || colors['Other'];
    return <Badge className={`${colorClass} hover:${colorClass} text-xs`}>{relationship}</Badge>;
  };

  return (
    <>
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
                className="bg-white rounded-xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden pointer-events-auto"
              >
                {/* Header */}
                <div className="sticky top-0 bg-white border-b border-border px-6 py-4 z-10">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-purple-100">
                        <UsersRound className="w-5 h-5 text-purple-600" />
                      </div>
                      <div>
                        <h2 className="text-2xl font-semibold">Family Subfiles</h2>
                        <p className="text-sm text-muted-foreground mt-0.5">
                          {familyFile.fullName} ({familyFile.id})
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="relative group">
                        <Button
                          variant="default"
                          size="sm"
                          className={`${familyFile.isPaid ? 'bg-purple-600 hover:bg-purple-700' : 'bg-slate-400 cursor-not-allowed'}`}
                          onClick={() => familyFile.isPaid && setIsAddModalOpen(true)}
                          disabled={!familyFile.isPaid}
                        >
                          <UserPlus className="w-4 h-4 mr-2" />
                          Add Member
                        </Button>
                        {!familyFile.isPaid && (
                          <div className="absolute bottom-full right-0 mb-2 px-2 py-1 bg-gray-800 text-white text-[10px] rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 pointer-events-none">
                            Payment required to add members
                          </div>
                        )}
                      </div>
                      <Button variant="ghost" size="icon" onClick={onClose}>
                        <X className="w-5 h-5" />
                      </Button>
                    </div>
                  </div>

                  {/* Family Summary Info */}
                  <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="flex items-center gap-2 p-3 bg-purple-50 rounded-lg">
                      <UsersRound className="w-4 h-4 text-purple-600" />
                      <div>
                        <p className="text-xs text-muted-foreground">Total Members</p>
                        <p className="text-lg font-semibold text-purple-900">{subfiles.length}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg">
                      <Phone className="w-4 h-4 text-blue-600" />
                      <div>
                        <p className="text-xs text-muted-foreground">Contact</p>
                        <p className="text-sm font-medium text-blue-900">{familyFile.phoneNumber}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg">
                      <MapPin className="w-4 h-4 text-green-600" />
                      <div>
                        <p className="text-xs text-muted-foreground">Address</p>
                        <p className="text-sm font-medium text-green-900 truncate">{familyFile.address}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Content - Scrollable */}
                <div className="overflow-y-auto max-h-[calc(90vh-300px)]">
                  {subfiles.length === 0 ? (
                    <div className="p-12 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <User className="w-16 h-16 text-muted-foreground" />
                        <p className="text-lg font-medium">No Family Members Found</p>
                        <p className="text-sm text-muted-foreground">
                          This family file doesn't have any individual subfiles yet.
                        </p>
                        <Button
                          variant="outline"
                          onClick={() => familyFile.isPaid && setIsAddModalOpen(true)}
                          className={`mt-2 ${!familyFile.isPaid ? 'cursor-not-allowed opacity-50' : ''}`}
                          disabled={!familyFile.isPaid}
                        >
                          <UserPlus className="w-4 h-4 mr-2" />
                          {familyFile.isPaid ? 'Add First Member' : 'Payment Required to Add Member'}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="p-6">
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead className="bg-muted/50 border-b border-border">
                            <tr>
                              <th className="px-4 py-3 text-left text-sm font-medium">S/N</th>
                              <th className="px-4 py-3 text-left text-sm font-medium">Full Name</th>
                              <th className="px-4 py-3 text-left text-sm font-medium">Status</th>
                              <th className="px-4 py-3 text-left text-sm font-medium">Gender</th>
                              <th className="px-4 py-3 text-left text-sm font-medium">Age</th>
                              <th className="px-4 py-3 text-left text-sm font-medium">Allergies</th>
                              <th className="px-4 py-3 text-left text-sm font-medium">Blood Group</th>
                              <th className="px-4 py-3 text-right text-sm font-medium">Action</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-border">
                            {subfiles.map((sub, index) => (
                              <motion.tr
                                key={sub.id}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: index * 0.05 }}
                                className="hover:bg-muted/50 transition-colors"
                              >
                                <td className="px-4 py-3 text-sm">{index + 1}</td>
                                <td className="px-4 py-3 text-sm font-medium">{sub.firstName} {sub.lastName}</td>
                                <td className="px-4 py-3">{getStatusBadge(sub.isDead)}</td>
                                <td className="px-4 py-3 text-sm">{sub.gender}</td>
                                <td className="px-4 py-3 text-sm">{getAge(sub.dateOfBirth)}</td>
                                <td className="px-4 py-3 text-sm text-muted-foreground truncate max-w-[150px]">
                                  {sub.allergies || '-'}
                                </td>
                                <td className="px-4 py-3 text-sm">{sub.bloodGroup || '-'}</td>
                                <td className="px-4 py-3">
                                  <div className="flex items-center justify-end gap-2">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handleViewFile(sub)}
                                      className="text-xs"
                                    >
                                      <Eye className="w-3 h-3 mr-1" />
                                      View
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => {
                                        if (confirm('Are you sure you want to remove this family member?')) {
                                          deleteSubfile(sub.id);
                                        }
                                      }}
                                      className="text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </Button>
                                  </div>
                                </td>
                              </motion.tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className="sticky bottom-0 bg-muted/50 px-6 py-4 flex items-center justify-between gap-3 border-t border-border">
                  <p className="text-sm text-muted-foreground">
                    Showing {subfiles.length} family member{subfiles.length !== 1 ? 's' : ''}
                  </p>
                  <Button variant="outline" onClick={onClose}>
                    Close
                  </Button>
                </div>
              </motion.div>
            </div>
          </div>
        )}
      </AnimatePresence>

      <AddSubfileModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        parentFileId={familyFile.id}
      />
    </>
  );
}
