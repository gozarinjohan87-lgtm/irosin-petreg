import { Dog, Cat } from 'lucide-react';
import type { Species } from '@/types/types';
import { cn } from '@/lib/utils';

interface Props {
  photo?: string;
  name: string;
  species: Species;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const sizes = { sm: 'h-8 w-8', md: 'h-12 w-12', lg: 'h-20 w-20', xl: 'h-32 w-32' };
const iconSizes = { sm: 'h-4 w-4', md: 'h-6 w-6', lg: 'h-10 w-10', xl: 'h-16 w-16' };

export function PetAvatar({ photo, name, species, size = 'md' }: Props) {
  const Icon = species === 'dog' ? Dog : Cat;
  return (
    <div className={cn('shrink-0 overflow-hidden rounded-full bg-primary/10 flex items-center justify-center', sizes[size])}>
      {photo ? (
        <img src={photo} alt={name} className="h-full w-full object-cover" />
      ) : (
        <Icon className={cn('text-primary', iconSizes[size])} />
      )}
    </div>
  );
}
