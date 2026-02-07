 import { PlacedGroundTile } from "@/hooks/useGroundTiles";
 import { motion } from "framer-motion";
 
 interface PlacedGroundTileItemProps {
   tile: PlacedGroundTile;
   cellSize: number;
 }
 
 export function PlacedGroundTileItem({ tile, cellSize }: PlacedGroundTileItemProps) {
   return (
     <motion.div
       initial={tile.isNew ? { scale: 0.5, opacity: 0 } : false}
       animate={{ scale: 1, opacity: 1 }}
       transition={{ 
         type: "spring", 
         stiffness: 400, 
         damping: 20,
         duration: 0.2 
       }}
      className="absolute z-0 pointer-events-none overflow-hidden"
       style={{
         width: cellSize,
         height: cellSize,
         left: tile.gridX * cellSize,
         top: tile.gridY * cellSize,
       }}
     >
      <img 
        src={tile.tile.image} 
        alt={tile.tile.name}
        className="w-full h-full object-cover"
        draggable={false}
      />
     </motion.div>
   );
 }