import { motion } from 'motion/react';
import { Construction, Clock } from 'lucide-react';
import { Card, CardContent } from '@/app/components/ui/card';

interface ComingSoonProps {
  icon?: React.ElementType;
  title: string;
  subtitle?: string;
}

export function ComingSoon({ 
  icon: Icon = Construction, 
  title, 
  subtitle = 'Module under implementation. Updates coming soon.' 
}: ComingSoonProps) {
  return (
    <div className="p-6 md:p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <Card className="border-dashed border-2 border-muted-foreground/20 bg-muted/30">
          <CardContent className="flex flex-col items-center justify-center py-16 md:py-24 text-center">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="relative mb-6"
            >
              <div className="absolute inset-0 bg-primary/10 blur-2xl rounded-full" />
              <div className="relative bg-primary/10 p-6 rounded-2xl">
                <Icon className="w-16 h-16 text-primary" />
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.2 }}
              className="space-y-3 max-w-md"
            >
              <h3 className="text-2xl md:text-3xl font-semibold text-foreground">
                {title}
              </h3>
              <p className="text-muted-foreground text-base md:text-lg">
                {subtitle}
              </p>

              <div className="flex items-center justify-center gap-2 pt-4 text-sm text-muted-foreground">
                <Clock className="w-4 h-4" />
                <span>Feature in development</span>
              </div>
            </motion.div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
