 import { useMemo } from "react";
 import { Workspace } from "@/hooks/useWorkspaces";
 import { PlacedStructure } from "@/hooks/usePlacedStructures";
 import { Globe, Lock, Trash2 } from "lucide-react";
 import { Button } from "@/components/ui/button";
 import { cn } from "@/lib/utils";
 
 interface WorkspaceData {
   structures?: PlacedStructure[];
 }
 
 interface WorkspacePreviewProps {
   workspace: Workspace;
   onToggleVisibility: (workspace: Workspace) => void;
   onDelete: (id: string) => void;
   onClick?: (workspace: Workspace) => void;
 }
 
 export function WorkspacePreview({ workspace, onToggleVisibility, onDelete, onClick }: WorkspacePreviewProps) {
   const data = workspace.data as WorkspaceData | null;
   const structures = data?.structures || [];
 
   // Calculate bounds and render mini canvas
   const { minX, minY, maxX, maxY, hasStructures } = useMemo(() => {
     if (structures.length === 0) {
       return { minX: 0, minY: 0, maxX: 10, maxY: 10, hasStructures: false };
     }
 
     let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
     structures.forEach((s) => {
       minX = Math.min(minX, s.gridX);
       minY = Math.min(minY, s.gridY);
       maxX = Math.max(maxX, s.gridX);
       maxY = Math.max(maxY, s.gridY);
     });
 
     // Add padding
     const padding = 2;
     return {
       minX: minX - padding,
       minY: minY - padding,
       maxX: maxX + padding,
       maxY: maxY + padding,
       hasStructures: true,
     };
   }, [structures]);
 
   const gridWidth = maxX - minX + 1;
   const gridHeight = maxY - minY + 1;
   const cellSize = Math.min(120 / gridWidth, 120 / gridHeight, 16);
 
   return (
     <div
       className={cn(
         "group relative rounded-xl border bg-card overflow-hidden transition-all hover:shadow-lg hover:border-primary/50",
         onClick && "cursor-pointer"
       )}
       onClick={() => onClick?.(workspace)}
     >
       {/* Preview Canvas */}
       <div className="h-32 bg-surface-elevated relative flex items-center justify-center overflow-hidden">
         {!hasStructures ? (
           <p className="text-xs text-muted-foreground">Sem estruturas</p>
         ) : (
           <div
             className="grid gap-px"
             style={{
               gridTemplateColumns: `repeat(${gridWidth}, ${cellSize}px)`,
               gridTemplateRows: `repeat(${gridHeight}, ${cellSize}px)`,
             }}
           >
             {Array.from({ length: gridWidth * gridHeight }).map((_, i) => {
               const x = (i % gridWidth) + minX;
               const y = Math.floor(i / gridWidth) + minY;
               const structure = structures.find((s) => s.gridX === x && s.gridY === y);
 
               return (
                 <div
                   key={i}
                   className={cn(
                     "flex items-center justify-center text-xxs rounded-sm",
                     structure
                       ? structure.built
                         ? "bg-primary/30"
                         : "bg-primary/60"
                       : "bg-canvas-grid/30"
                   )}
                   style={{ width: cellSize, height: cellSize }}
                   title={structure?.structure.name}
                 >
                   {structure && cellSize >= 12 && (
                     structure.structure.iconImage ? (
                       <img 
                         src={structure.structure.iconImage} 
                         alt={structure.structure.name}
                         className="w-2 h-2 object-contain"
                       />
                     ) : (
                       <span className="text-[8px] leading-none">{structure.structure.icon}</span>
                     )
                   )}
                 </div>
               );
             })}
           </div>
         )}
 
         {/* Visibility Badge */}
         <div className="absolute top-2 right-2">
           <div className={cn(
             "flex items-center gap-1 px-1.5 py-0.5 rounded-full text-xxs font-medium",
             workspace.visibility === "public"
               ? "bg-primary/20 text-primary"
               : "bg-muted text-muted-foreground"
           )}>
             {workspace.visibility === "public" ? (
               <Globe className="h-2.5 w-2.5" />
             ) : (
               <Lock className="h-2.5 w-2.5" />
             )}
           </div>
         </div>
       </div>
 
       {/* Info */}
       <div className="p-3">
         <div className="flex items-center justify-between">
           <div className="min-w-0 flex-1">
             <h3 className="font-medium text-sm truncate">{workspace.name}</h3>
             <p className="text-xxs text-muted-foreground">
               {structures.length} estrutura{structures.length !== 1 ? "s" : ""} • {new Date(workspace.updated_at).toLocaleDateString("pt-PT")}
             </p>
           </div>
         </div>
 
         {/* Actions on Hover */}
         <div className="absolute bottom-3 right-3 hidden group-hover:flex items-center gap-1">
           <Button
             variant="secondary"
             size="sm"
             className="h-7 px-2 text-xs gap-1"
             onClick={(e) => {
               e.stopPropagation();
               onToggleVisibility(workspace);
             }}
           >
             {workspace.visibility === "public" ? (
               <>
                 <Lock className="h-3 w-3" />
                 Privado
               </>
             ) : (
               <>
                 <Globe className="h-3 w-3" />
                 Público
               </>
             )}
           </Button>
           <Button
             variant="secondary"
             size="icon"
             className="h-7 w-7 text-destructive hover:text-destructive"
             onClick={(e) => {
               e.stopPropagation();
               onDelete(workspace.id);
             }}
           >
             <Trash2 className="h-3 w-3" />
           </Button>
         </div>
       </div>
     </div>
   );
 }