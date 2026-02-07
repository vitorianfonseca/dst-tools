import { CheckSquare, Square, CheckCircle2 } from "lucide-react";
 import { EmptyState } from "./EmptyState";
import { PlacedStructure } from "@/hooks/usePlacedStructures";
 
interface ConstructionChecklistProps {
  placedStructures: PlacedStructure[];
  onToggleBuilt: (id: string) => void;
}

export function ConstructionChecklist({ placedStructures, onToggleBuilt }: ConstructionChecklistProps) {
  const builtCount = placedStructures.filter((p) => p.built).length;

   return (
     <div className="flex flex-col">
       <div className="flex items-center justify-between mb-4">
         <h3 className="text-base font-bold uppercase tracking-wide text-foreground" style={{ fontFamily: 'Impact, "Arial Black", sans-serif' }}>Build Checklist</h3>
        <span className="text-xs font-bold text-muted-foreground bg-secondary px-2.5 py-1 rounded">
          {builtCount}/{placedStructures.length}
        </span>
       </div>
      {placedStructures.length === 0 ? (
        <EmptyState
          icon={CheckSquare}
          title="Nothing to Build"
          description="Structures you place will appear here as a checklist"
        />
      ) : (
        <div className="space-y-2">
          {placedStructures.map((placed) => (
            <button
              key={placed.id}
              onClick={() => onToggleBuilt(placed.id)}
              className={`w-full flex items-center gap-2.5 py-2.5 px-3 rounded-md transition-default text-left ${
                placed.built
                  ? "bg-primary/10 text-muted-foreground"
                  : "bg-secondary/50 hover:bg-secondary"
              }`}
            >
              {placed.built ? (
                <CheckCircle2 className="h-5 w-5 text-primary shrink-0" />
              ) : (
                <Square className="h-5 w-5 text-muted-foreground shrink-0" />
              )}
              {placed.structure.iconImage ? (
                <img 
                  src={placed.structure.iconImage} 
                  alt={placed.structure.name}
                  className="w-7 h-7 object-contain shrink-0"
                />
              ) : (
                <span className="text-lg shrink-0">{placed.structure.icon}</span>
              )}
              <span
                className={`text-sm font-medium truncate ${
                  placed.built ? "line-through" : ""
                }`}
              >
                {placed.structure.name}
              </span>
            </button>
          ))}
        </div>
      )}
     </div>
   );
 }