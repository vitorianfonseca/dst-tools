 import { LucideIcon } from "lucide-react";
 
 interface EmptyStateProps {
   icon: LucideIcon;
   title: string;
   description: string;
   className?: string;
 }
 
 export function EmptyState({ icon: Icon, title, description, className = "" }: EmptyStateProps) {
   return (
     <div className={`flex flex-col items-center justify-center p-8 text-center ${className}`}>
       <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted mb-4">
         <Icon className="h-5 w-5 text-muted-foreground" />
       </div>
       <h3 className="text-sm font-medium text-foreground mb-1">{title}</h3>
       <p className="text-xs text-muted-foreground max-w-[200px]">{description}</p>
     </div>
   );
 }