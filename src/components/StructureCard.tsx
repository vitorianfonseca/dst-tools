 import { Structure } from "@/data/structures";
 
 interface StructureCardProps {
   structure: Structure;
   isSelected?: boolean;
   onSelect?: (structure: Structure | null) => void;
 }
 
 export function StructureCard({ structure, isSelected, onSelect }: StructureCardProps) {
  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData("application/json", JSON.stringify(structure));
    e.dataTransfer.effectAllowed = "copy";
  };

   const handleClick = () => {
     if (onSelect) {
       onSelect(isSelected ? null : structure);
     }
   };
 
   return (
    <div
      draggable
      onDragStart={handleDragStart}
       onClick={handleClick}
       className={`group relative flex flex-col gap-2.5 rounded-lg border p-4 transition-default hover:border-primary/50 hover:shadow-soft cursor-pointer active:cursor-grabbing animate-fade-in ${
         isSelected 
           ? "border-primary bg-primary/10 ring-2 ring-primary/30" 
           : "border-border bg-card"
       }`}
    >
       <div className="flex items-start gap-3">
         <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-muted text-lg transition-default group-hover:bg-primary/10">
          {structure.iconImage ? (
            <img 
              src={structure.iconImage} 
              alt={structure.name}
              className="w-10 h-10 object-contain"
            />
          ) : (
            structure.icon
          )}
         </div>
         <div className="flex flex-col min-w-0">
           <span className="text-sm font-bold text-foreground truncate">{structure.name}</span>
           <span className="text-xs text-muted-foreground line-clamp-2">{structure.description}</span>
         </div>
       </div>
       <div className="flex flex-wrap gap-1.5 mt-1">
         {structure.materials.slice(0, 3).map((mat) => (
           <span
             key={mat.name}
             className="inline-flex items-center rounded-md bg-secondary px-2 py-1 text-xs font-medium text-secondary-foreground"
           >
             {mat.amount}× {mat.name}
           </span>
         ))}
         {structure.materials.length > 3 && (
           <span className="inline-flex items-center rounded-md bg-secondary px-2 py-1 text-xs font-medium text-muted-foreground">
             +{structure.materials.length - 3} more
           </span>
         )}
       </div>
     </div>
   );
 }