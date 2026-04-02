import { motion } from 'motion/react';
import { LucideIcon } from 'lucide-react';
import { Card, CardContent } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Skeleton } from '@/app/components/ui/skeleton';

interface ComingSoonPageProps {
  title: string;
  description: string;
  icon: LucideIcon;
  actionButtons?: { label: string; disabled?: boolean }[];
}

export function ComingSoonPage({ title, description, icon: Icon, actionButtons }: ComingSoonPageProps) {
  return (
    <div className="p-6 space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="bg-primary/10 p-3 rounded-xl">
            <Icon className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold">{title}</h1>
            <p className="text-sm text-muted-foreground">{description}</p>
          </div>
        </div>

        {/* Quick Actions (Disabled) */}
        <div className="flex items-center gap-2">
          {actionButtons?.map((btn, index) => (
            <Button key={index} variant="outline" disabled>
              {btn.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Coming Soon Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <Card className="border-2 border-dashed border-primary/30 bg-primary/5">
          <CardContent className="p-12">
            <div className="text-center space-y-4">
              <div className="inline-flex p-4 bg-primary/10 rounded-full">
                <Icon className="w-12 h-12 text-primary" />
              </div>
              <h2 className="text-3xl font-semibold">Coming Soon</h2>
              <p className="text-muted-foreground max-w-md mx-auto">
                This module will be implemented in the next batch. Stay tuned for updates!
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Placeholder Table Skeleton */}
      <Card>
        <CardContent className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-10 w-32" />
          </div>
          
          <div className="space-y-3">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
