import { motion, AnimatePresence } from 'motion/react';
import { X, Users, Eye, FolderOpen } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { Badge } from '@/app/components/ui/badge';
import { useEMRStore } from '@/app/emr/store/emr-store';
import { FamilySubfile } from '@/app/emr/store/types';

interface FamilySubfilesModalProps {
  isOpen: boolean;
  onClose: () => void;
  familyFile: any;
  onViewSubfile: (subfileId: string) => void;
}

export function FamilySubfilesModal({ isOpen, onClose, familyFile, onViewSubfile }: FamilySubfilesModalProps) {
  const { subfiles: allSubfiles } = useEMRStore();

  // Get all subfiles that belong to this family from the new subfiles state
  const subfiles = allSubfiles.filter((s: FamilySubfile) => s.fileId === familyFile?.id);

  const calculateAge = (dateOfBirth?: string) => {
    if (!dateOfBirth) return 'N/A';
    try {
      const birthDate = new Date(dateOfBirth);
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const m = today.getMonth() - birthDate.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      return `${age} years`;
    } catch {
      return 'N/A';
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
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
            transition={{ duration: 0.2 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-white rounded-lg shadow-2xl z-50"
          >
            {/* Header */}
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between z-10">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <FolderOpen className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-foreground">Family File Subfiles</h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    {familyFile?.fullName} • {familyFile?.id}
                  </p>
                </div>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="rounded-full"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>

            {/* Body */}
            <div className="p-6">
              {subfiles.length === 0 ? (
                // Empty state
                <div className="text-center py-12">
                  <Users className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                  <p className="text-lg font-medium text-muted-foreground mb-2">
                    No Family Members
                  </p>
                  <p className="text-sm text-muted-foreground max-w-md mx-auto">
                    This family file doesn't have any individual members registered yet.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">
                      {subfiles.length} family {subfiles.length === 1 ? 'member' : 'members'} found
                    </p>
                  </div>

                  {/* Subfiles Table */}
                  <div className="border rounded-lg overflow-hidden">
                    <table className="w-full">
                      <thead className="border-b bg-muted/50">
                        <tr>
                          <th className="text-left px-4 py-3 text-sm font-semibold text-foreground">S/N</th>
                          <th className="text-left px-4 py-3 text-sm font-semibold text-foreground">Name</th>
                          <th className="text-left px-4 py-3 text-sm font-semibold text-foreground">Gender</th>
                          <th className="text-left px-4 py-3 text-sm font-semibold text-foreground">Age</th>
                          <th className="text-left px-4 py-3 text-sm font-semibold text-foreground">Status</th>
                          <th className="text-right px-4 py-3 text-sm font-semibold text-foreground">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {subfiles.map((subfile: FamilySubfile, index: number) => (
                          <tr key={subfile.id} className="hover:bg-muted/30 transition-colors">
                            <td className="px-4 py-3">
                              <span className="text-sm text-muted-foreground">
                                {index + 1}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <span className="font-medium text-foreground">{subfile.firstName} {subfile.lastName}</span>
                            </td>
                            <td className="px-4 py-3">
                              <span className="text-sm text-muted-foreground">{subfile.gender}</span>
                            </td>
                            <td className="px-4 py-3">
                              <span className="text-sm text-muted-foreground">{calculateAge(subfile.dateOfBirth)}</span>
                            </td>
                            <td className="px-4 py-3">
                              <Badge variant={subfile.isDead ? 'destructive' : 'default'}>
                                {subfile.isDead ? 'Deceased' : 'Alive'}
                              </Badge>
                            </td>
                            <td className="px-4 py-3 text-right">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="gap-2"
                                onClick={() => onViewSubfile(subfile.id.toString())}
                              >
                                <Eye className="w-4 h-4" />
                                View Details
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Info Note */}
                  <div className="p-4 rounded-lg bg-blue-50 border border-blue-200">
                    <p className="text-sm text-blue-800">
                      <strong>Note:</strong> These are the members currently listed in the family file.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="sticky bottom-0 bg-gray-50 border-t px-6 py-4 flex items-center justify-end">
              <Button variant="outline" onClick={onClose}>
                Close
              </Button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
