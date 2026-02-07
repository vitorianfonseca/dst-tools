 import { MaterialsTracker } from "./MaterialsTracker";
 import { ConstructionChecklist } from "./ConstructionChecklist";
 import { Separator } from "./ui/separator";
import { PlacedStructure } from "@/hooks/usePlacedStructures";
 
interface RightSidebarProps {
  placedStructures: PlacedStructure[];
  onToggleBuilt: (id: string) => void;
}

export function RightSidebar({ placedStructures, onToggleBuilt }: RightSidebarProps) {
   return (
     <aside className="w-80 border-l border-border bg-card flex flex-col shrink-0 overflow-hidden">
       <div className="flex-1 overflow-y-auto p-5 space-y-6">
        <MaterialsTracker placedStructures={placedStructures} />
         <Separator />
        <ConstructionChecklist
          placedStructures={placedStructures}
          onToggleBuilt={onToggleBuilt}
        />
       </div>
     </aside>
   );
 }