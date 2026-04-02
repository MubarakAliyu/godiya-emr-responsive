import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Trash2, Loader2, AlertTriangle } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { toast } from 'sonner';
import { useEMRStore } from '@/app/emr/store/emr-store';
import type { BedCategory } from '@/app/emr/store/types';

interface DeleteBedCategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  category: BedCategory | null;
}

export function DeleteBedCategoryModal({ isOpen, onClose, category }: DeleteBedCategoryModalProps) {
  const { deleteBedCategory, addNotification } = useEMRStore();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!category) return;

    setIsDeleting(true);

    try {

      deleteBedCategory(category.id);

      toast.success('Bed Category Deleted', {
        description: `${category.categoryName} has been permanently deleted`,
      });

      addNotification({
        type: 'warning',
        category: 'admin',
        module: 'Beds',
        icon: 'Trash2',
        title: 'Bed Category Deleted',
        description: `${category.categoryName} bed category has been removed from the system`,
      });

      onClose();
    } catch (error) {
      toast.error('Failed to Delete Category', {
        description: 'An error occurred. Please try again.',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  if (!isOpen || !category) return null;

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
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white rounded-2xl shadow-2xl z-50 overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-border bg-red-50">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-red-100">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-red-900">Delete Bed Category</h2>
                  <p className="text-sm text-red-700">This action cannot be undone</p>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0">
                <X className="w-5 h-5" />
              </Button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4">
              <p className="text-muted-foreground">
                Are you sure you want to delete the bed category <strong className="text-foreground">{category.categoryName}</strong>?
              </p>

              <div className="p-4 rounded-lg bg-red-50 border border-red-200">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-red-700">Category ID:</span>
                    <span className="font-medium text-red-900">{category.id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-red-700">Total Beds:</span>
                    <span className="font-medium text-red-900">{category.totalBeds}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-red-700">Occupied Beds:</span>
                    <span className="font-medium text-red-900">{category.occupiedBeds}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-red-700">Available Beds:</span>
                    <span className="font-medium text-red-900">{category.availableBeds}</span>
                  </div>
                </div>
              </div>

              {category.occupiedBeds > 0 && (
                <div className="p-4 rounded-lg bg-orange-50 border border-orange-200">
                  <p className="text-sm text-orange-800">
                    <strong>⚠️ Warning:</strong> This category has {category.occupiedBeds} occupied bed(s).
                    Please ensure patients are reassigned before deleting.
                  </p>
                </div>
              )}

              <p className="text-sm text-muted-foreground">
                This will permanently delete the bed category and all associated data. This action cannot be reversed.
              </p>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 p-6 border-t border-border bg-muted/30">
              <Button variant="outline" onClick={onClose} disabled={isDeleting}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={isDeleting}
                className="gap-2"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    Delete Category
                  </>
                )}
              </Button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
