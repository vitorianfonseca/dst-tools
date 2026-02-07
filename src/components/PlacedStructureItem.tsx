 import { X, Check } from "lucide-react";
 import { PlacedStructure } from "@/hooks/usePlacedStructures";
import { motion } from "framer-motion";
 
 interface PlacedStructureItemProps {
   placed: PlacedStructure;
   cellSize: number;
   onRemove: (id: string) => void;
   onToggleBuilt: (id: string) => void;
   onDragStart: (e: React.DragEvent, placed: PlacedStructure) => void;
  isNew?: boolean;
 }
 
 export function PlacedStructureItem({
   placed,
   cellSize,
   onRemove,
   onToggleBuilt,
   onDragStart,
  isNew,
 }: PlacedStructureItemProps) {
  const handleNativeDragStart = (e: React.DragEvent<HTMLDivElement>) => {
    onDragStart(e, placed);
  };

   return (
    <motion.div
      initial={isNew ? { scale: 0, opacity: 0 } : false}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ 
        type: "spring", 
        stiffness: 500, 
        damping: 25,
        duration: 0.3 
      }}
       className={`absolute z-10 flex items-center justify-center rounded-lg border-2 transition-all cursor-grab active:cursor-grabbing group ${
         placed.built
           ? "bg-primary/20 border-primary/50"
           : "bg-card border-border hover:border-primary/50"
       }`}
       style={{
         width: cellSize - 4,
         height: cellSize - 4,
         left: placed.gridX * cellSize + 2,
         top: placed.gridY * cellSize + 2,
       }}
     >
      {/* Inner div to handle native HTML5 drag */}
      <div
        draggable
        onDragStart={handleNativeDragStart}
        onMouseDown={(e) => e.stopPropagation()}
        className="w-full h-full flex items-center justify-center"
        title={placed.structure.name}
      >
      {placed.structure.iconImage ? (
        <motion.img
          src={placed.structure.iconImage}
          alt={placed.structure.name}
          className="w-20 h-20 object-contain drop-shadow-lg"
          initial={isNew ? { scale: 1.5 } : false}
          animate={{ scale: 1 }}
          transition={{ delay: 0.1, type: "spring", stiffness: 400 }}
        />
      ) : (
        <motion.span 
          className="text-6xl drop-shadow-lg"
          initial={isNew ? { scale: 1.5 } : false}
          animate={{ scale: 1 }}
          transition={{ delay: 0.1, type: "spring", stiffness: 400 }}
        >
          {placed.structure.icon}
        </motion.span>
      )}
      </div>
       
       {/* Action buttons on hover */}
       <div className="absolute -top-2 -right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
         <button
           onClick={(e) => {
             e.stopPropagation();
             onToggleBuilt(placed.id);
           }}
           className={`h-5 w-5 rounded-full flex items-center justify-center text-white transition-colors ${
             placed.built ? "bg-primary" : "bg-muted-foreground hover:bg-primary"
           }`}
           title={placed.built ? "Mark as not built" : "Mark as built"}
         >
           <Check className="h-3 w-3" />
         </button>
         <button
           onClick={(e) => {
             e.stopPropagation();
             onRemove(placed.id);
           }}
           className="h-5 w-5 rounded-full bg-destructive flex items-center justify-center text-white hover:bg-destructive/80 transition-colors"
           title="Remove"
         >
           <X className="h-3 w-3" />
         </button>
       </div>
    </motion.div>
   );
 }