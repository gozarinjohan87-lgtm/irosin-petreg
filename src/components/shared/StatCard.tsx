import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';

interface Props {
  title: string;
  value: string | number;
  icon: LucideIcon;
  subtitle?: string;
  color?: 'yellow' | 'green' | 'red' | 'blue';
}

const colorMap = {
  yellow: 'bg-primary/10 text-primary',
  green: 'bg-green-100 text-green-700',
  red: 'bg-red-100 text-red-700',
  blue: 'bg-blue-100 text-blue-700',
};

export function StatCard({ title, value, icon: Icon, subtitle, color = 'yellow' }: Props) {
  return (
    <Card className="h-full border border-border/80 shadow-none hover:shadow-none transition-none cursor-default select-none pointer-events-none">
      <CardContent className="p-3 md:p-5 flex flex-col justify-center">
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
          <div className={cn('shrink-0 rounded-lg p-2 md:p-3 self-start sm:self-auto inline-flex', colorMap[color])}>
            <Icon className="h-4 w-4 md:h-5 md:w-5" />
          </div>
          <div className="min-w-0 flex-1 break-words">
            <p className="text-xs md:text-sm text-muted-foreground leading-tight text-balance">{title}</p>
            <p className="text-lg sm:text-xl md:text-2xl font-bold mt-0.5 tracking-tight text-foreground">{value}</p>
            {subtitle && <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5 sm:mt-1 break-words text-pretty">{subtitle}</p>}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
