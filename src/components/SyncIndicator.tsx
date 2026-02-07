 import { Cloud, CloudOff, Check, Loader2 } from "lucide-react";
 import { SyncStatus } from "@/hooks/usePlacedStructures";
 import { cn } from "@/lib/utils";
 
 interface SyncIndicatorProps {
   status: SyncStatus;
   className?: string;
 }
 
 export function SyncIndicator({ status, className }: SyncIndicatorProps) {
   if (status === "idle") return null;
 
   const config = {
     saving: {
       icon: Loader2,
       text: "A guardar...",
       className: "text-muted-foreground",
       animate: true,
     },
     saved: {
       icon: Check,
       text: "Guardado",
       className: "text-green-500",
       animate: false,
     },
     error: {
       icon: CloudOff,
       text: "Erro ao guardar",
       className: "text-destructive",
       animate: false,
     },
   }[status];
 
   const Icon = config.icon;
 
   return (
     <div
       className={cn(
         "flex items-center gap-1.5 text-xs font-medium transition-opacity duration-300",
         config.className,
         className
       )}
     >
       <Icon className={cn("h-3.5 w-3.5", config.animate && "animate-spin")} />
       <span>{config.text}</span>
     </div>
   );
 }