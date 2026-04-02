import { motion, AnimatePresence } from 'motion/react';
import { X, Bed, Hash, DollarSign, Calendar, Clock, CheckCircle, XCircle, Info } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { Badge } from '@/app/components/ui/badge';
import { Separator } from '@/app/components/ui/separator';
import type { BedCategory } from '@/app/emr/store/types';
import { format } from 'date-fns';

interface ViewBedDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  category: BedCategory | null;
}

export function ViewBedDetailsModal({ isOpen, onClose, category }: ViewBedDetailsModalProps) {
  if (!isOpen || !category) return null;

  const occupancyRate = ((category.occupiedBeds / category.totalBeds) * 100).toFixed(1);
  const dailyRevenue = category.occupiedBeds * category.pricePerDay;
  const isAvailable = category.availableBeds > 0;

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
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-3xl max-h-[90vh] bg-white rounded-2xl shadow-2xl z-50 overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-border bg-gradient-to-r from-primary/5 to-secondary/5">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Bed className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h2 className="text-2xl font-semibold">{category.categoryName}</h2>
                  <p className="text-sm text-muted-foreground">Bed Category Details</p>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0">
                <X className="w-5 h-5" />
              </Button>
            </div>

            {/* Content */}
            <div className="overflow-y-auto max-h-[calc(90vh-180px)] p-6 space-y-6">
              {/* Status Banner */}
              <div className={`p-4 rounded-lg border-2 ${
                isAvailable 
                  ? 'bg-green-50 border-green-200' 
                  : 'bg-red-50 border-red-200'
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {isAvailable ? (
                      <CheckCircle className="w-6 h-6 text-green-600" />
                    ) : (
                      <XCircle className="w-6 h-6 text-red-600" />
                    )}
                    <div>
                      <p className={`font-semibold ${
                        isAvailable ? 'text-green-900' : 'text-red-900'
                      }`}>
                        {isAvailable ? 'Beds Available' : 'Fully Occupied'}
                      </p>
                      <p className={`text-sm ${
                        isAvailable ? 'text-green-700' : 'text-red-700'
                      }`}>
                        {isAvailable 
                          ? `${category.availableBeds} bed(s) currently available` 
                          : 'No beds available in this category'}
                      </p>
                    </div>
                  </div>
                  <Badge className={
                    isAvailable 
                      ? 'bg-green-100 text-green-700 hover:bg-green-100'
                      : 'bg-red-100 text-red-700 hover:bg-red-100'
                  }>
                    {occupancyRate}% Occupied
                  </Badge>
                </div>
              </div>

              {/* Basic Information */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <Info className="w-5 h-5 text-primary" />
                  <h3 className="text-lg font-semibold">Basic Information</h3>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-lg bg-muted/50 border border-border">
                    <p className="text-sm text-muted-foreground mb-1">Category ID</p>
                    <p className="text-lg font-semibold text-primary">{category.id}</p>
                  </div>
                  <div className="p-4 rounded-lg bg-muted/50 border border-border">
                    <p className="text-sm text-muted-foreground mb-1">Category Name</p>
                    <p className="text-lg font-semibold">{category.categoryName}</p>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Bed Statistics */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <Hash className="w-5 h-5 text-primary" />
                  <h3 className="text-lg font-semibold">Bed Statistics</h3>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="p-4 rounded-lg bg-blue-50 border border-blue-200">
                    <div className="flex items-center gap-2 mb-2">
                      <Bed className="w-4 h-4 text-blue-600" />
                      <p className="text-sm text-blue-700 font-medium">Total Beds</p>
                    </div>
                    <p className="text-2xl font-bold text-blue-900">{category.totalBeds}</p>
                  </div>
                  <div className="p-4 rounded-lg bg-red-50 border border-red-200">
                    <div className="flex items-center gap-2 mb-2">
                      <XCircle className="w-4 h-4 text-red-600" />
                      <p className="text-sm text-red-700 font-medium">Occupied</p>
                    </div>
                    <p className="text-2xl font-bold text-red-900">{category.occupiedBeds}</p>
                  </div>
                  <div className="p-4 rounded-lg bg-green-50 border border-green-200">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <p className="text-sm text-green-700 font-medium">Available</p>
                    </div>
                    <p className="text-2xl font-bold text-green-900">{category.availableBeds}</p>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Pricing Information */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <DollarSign className="w-5 h-5 text-primary" />
                  <h3 className="text-lg font-semibold">Pricing & Revenue</h3>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-lg bg-purple-50 border border-purple-200">
                    <p className="text-sm text-purple-700 mb-1">Price Per Day</p>
                    <p className="text-2xl font-bold text-purple-900">
                      ₦{category.pricePerDay.toLocaleString()}
                    </p>
                  </div>
                  <div className="p-4 rounded-lg bg-orange-50 border border-orange-200">
                    <p className="text-sm text-orange-700 mb-1">Current Daily Revenue</p>
                    <p className="text-2xl font-bold text-orange-900">
                      ₦{dailyRevenue.toLocaleString()}
                    </p>
                    <p className="text-xs text-orange-600 mt-1">
                      From {category.occupiedBeds} occupied bed(s)
                    </p>
                  </div>
                </div>
              </div>

              {/* Description */}
              {category.description && (
                <>
                  <Separator />
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Description</h3>
                    <p className="text-muted-foreground leading-relaxed">
                      {category.description}
                    </p>
                  </div>
                </>
              )}

              <Separator />

              {/* Timestamps */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <Clock className="w-5 h-5 text-primary" />
                  <h3 className="text-lg font-semibold">Timestamps</h3>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/50 border border-border">
                    <Calendar className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Created</p>
                      <p className="text-sm font-medium">
                        {format(new Date(category.dateCreated), 'PPp')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/50 border border-border">
                    <Clock className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Last Updated</p>
                      <p className="text-sm font-medium">
                        {format(new Date(category.lastUpdated), 'PPp')}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Occupancy Progress Bar */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-semibold">Occupancy Rate</h3>
                  <span className="text-sm font-medium">{occupancyRate}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      parseFloat(occupancyRate) >= 90
                        ? 'bg-red-600'
                        : parseFloat(occupancyRate) >= 70
                        ? 'bg-orange-500'
                        : parseFloat(occupancyRate) >= 50
                        ? 'bg-yellow-500'
                        : 'bg-green-500'
                    }`}
                    style={{ width: `${occupancyRate}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 p-6 border-t border-border bg-muted/30">
              <Button onClick={onClose}>Close</Button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
