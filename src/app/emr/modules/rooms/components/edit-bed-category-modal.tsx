import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Save, Loader2, Bed, DollarSign, Hash } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Textarea } from '@/app/components/ui/textarea';
import { toast } from 'sonner';
import { useEMRStore } from '@/app/emr/store/emr-store';
import type { BedCategory } from '@/app/emr/store/types';

interface EditBedCategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  category: BedCategory | null;
}

export function EditBedCategoryModal({ isOpen, onClose, category }: EditBedCategoryModalProps) {
  const { updateBedCategory, addNotification } = useEMRStore();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    categoryName: '',
    totalBeds: '',
    occupiedBeds: '',
    pricePerDay: '',
    description: '',
  });

  useEffect(() => {
    if (category) {
      setFormData({
        categoryName: category.categoryName,
        totalBeds: category.totalBeds.toString(),
        occupiedBeds: category.occupiedBeds.toString(),
        pricePerDay: category.pricePerDay.toString(),
        description: category.description || '',
      });
    }
  }, [category]);

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!category) return;

    // Validation
    if (!formData.categoryName || !formData.totalBeds || !formData.pricePerDay) {
      toast.error('Required Fields Missing', {
        description: 'Please fill in all required fields marked with *',
      });
      return;
    }

    const totalBeds = parseInt(formData.totalBeds);
    const occupiedBeds = parseInt(formData.occupiedBeds || '0');
    const pricePerDay = parseFloat(formData.pricePerDay);

    if (totalBeds <= 0) {
      toast.error('Invalid Total Beds', {
        description: 'Total beds must be greater than 0',
      });
      return;
    }

    if (occupiedBeds < 0 || occupiedBeds > totalBeds) {
      toast.error('Invalid Occupied Beds', {
        description: 'Occupied beds must be between 0 and total beds',
      });
      return;
    }

    if (pricePerDay <= 0) {
      toast.error('Invalid Price', {
        description: 'Price per day must be greater than 0',
      });
      return;
    }

    setIsSubmitting(true);

    try {

      updateBedCategory(category.id, {
        categoryName: formData.categoryName,
        totalBeds,
        occupiedBeds,
        pricePerDay,
        description: formData.description,
      });

      toast.success('Bed Category Updated Successfully!', {
        description: `${formData.categoryName} has been updated`,
      });

      addNotification({
        type: 'info',
        category: 'admin',
        module: 'Beds',
        icon: 'Bed',
        title: 'Bed Category Updated',
        description: `${formData.categoryName} bed category has been updated`,
      });

      onClose();
    } catch (error) {
      toast.error('Failed to Update Category', {
        description: 'An error occurred. Please try again.',
      });
    } finally {
      setIsSubmitting(false);
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
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl max-h-[90vh] bg-white rounded-2xl shadow-2xl z-50 overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-border bg-gradient-to-r from-primary/5 to-secondary/5">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Save className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h2 className="text-2xl font-semibold">Edit Bed Category</h2>
                  <p className="text-sm text-muted-foreground">Update category details</p>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0">
                <X className="w-5 h-5" />
              </Button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="overflow-y-auto max-h-[calc(90vh-180px)]">
              <div className="p-6 space-y-6">
                {/* Category ID (Read-only) */}
                <div className="p-4 rounded-lg bg-muted/50 border border-border">
                  <p className="text-sm text-muted-foreground">Category ID</p>
                  <p className="text-base font-semibold text-primary">{category.id}</p>
                </div>

                {/* Category Name */}
                <div className="space-y-2">
                  <Label htmlFor="categoryName">
                    <Bed className="w-3 h-3 inline mr-1" />
                    Category Name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="categoryName"
                    value={formData.categoryName}
                    onChange={(e) => handleChange('categoryName', e.target.value)}
                    placeholder="e.g., General Ward, Private Room, ICU"
                    required
                  />
                </div>

                {/* Bed Numbers */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="totalBeds">
                      <Hash className="w-3 h-3 inline mr-1" />
                      Total Beds <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="totalBeds"
                      type="number"
                      min="1"
                      value={formData.totalBeds}
                      onChange={(e) => handleChange('totalBeds', e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="occupiedBeds">
                      <Hash className="w-3 h-3 inline mr-1" />
                      Currently Occupied
                    </Label>
                    <Input
                      id="occupiedBeds"
                      type="number"
                      min="0"
                      value={formData.occupiedBeds}
                      onChange={(e) => handleChange('occupiedBeds', e.target.value)}
                    />
                  </div>
                </div>

                {/* Price */}
                <div className="space-y-2">
                  <Label htmlFor="pricePerDay">
                    <DollarSign className="w-3 h-3 inline mr-1" />
                    Price Per Day (₦) <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="pricePerDay"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.pricePerDay}
                    onChange={(e) => handleChange('pricePerDay', e.target.value)}
                    required
                  />
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => handleChange('description', e.target.value)}
                    placeholder="Enter category description (optional)"
                    rows={3}
                  />
                </div>

                {/* Available Beds Info */}
                <div className="p-4 rounded-lg bg-blue-50 border border-blue-200">
                  <p className="text-sm text-blue-800">
                    <strong>Available Beds:</strong>{' '}
                    {parseInt(formData.totalBeds || '0') - parseInt(formData.occupiedBeds || '0')} beds will be available
                  </p>
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-end gap-3 p-6 border-t border-border bg-muted/30">
                <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="gap-2 bg-primary hover:bg-primary/90"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Saving Changes...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Save Changes
                    </>
                  )}
                </Button>
              </div>
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
