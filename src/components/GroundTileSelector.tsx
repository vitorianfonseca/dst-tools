 import { GroundTile, groundTiles } from "@/data/groundTiles";
import { Eraser, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
 
 interface GroundTileSelectorProps {
   selectedTile: GroundTile | null;
   onSelectTile: (tile: GroundTile | null) => void;
   isErasing: boolean;
   onToggleEraser: () => void;
   disabled?: boolean;
 }
 
 export function GroundTileSelector({
   selectedTile,
   onSelectTile,
   isErasing,
   onToggleEraser,
   disabled,
 }: GroundTileSelectorProps) {
  const [isExpanded, setIsExpanded] = useState(false);

   return (
    <div className={`border-t border-border ${disabled ? "opacity-60 pointer-events-none" : ""}`}>
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-5 py-3 flex items-center justify-between hover:bg-muted/50 transition-colors"
      >
        <span className="flex items-center text-xs font-bold text-muted-foreground uppercase tracking-wider leading-none">
          Ground Tiles
          {disabled && <span className="font-normal ml-2">(read only)</span>}
        </span>
        {isExpanded ? (
          <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0" />
        ) : (
          <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
        )}
      </button>
      
      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-4">
          <div className="flex flex-wrap gap-2">
         <button
           onClick={onToggleEraser}
           className={`flex items-center justify-center w-10 h-10 rounded-md transition-all ${
             isErasing
               ? "bg-destructive text-destructive-foreground ring-2 ring-destructive ring-offset-2 ring-offset-background"
               : "bg-secondary text-secondary-foreground hover:bg-muted"
           }`}
           title="Eraser - remove tiles"
         >
           <Eraser className="h-5 w-5" />
         </button>
         {groundTiles.map((tile) => (
           <button
             key={tile.id}
             onClick={() => {
               onSelectTile(selectedTile?.id === tile.id ? null : tile);
             }}
            className={`flex items-center justify-center w-10 h-10 rounded-md overflow-hidden transition-all ${
               selectedTile?.id === tile.id
                ? "ring-2 ring-primary ring-offset-2 ring-offset-background"
                : "ring-1 ring-border hover:ring-primary/50"
             }`}
             title={tile.name}
           >
            <img 
              src={tile.image} 
              alt={tile.name} 
              className="w-full h-full object-cover"
            />
           </button>
         ))}
          </div>
          <p className="text-xs text-muted-foreground mt-2">
         Click & drag to paint multiple tiles
          </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
     </div>
   );
 }