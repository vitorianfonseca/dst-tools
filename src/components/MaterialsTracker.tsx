import { Package } from "lucide-react";
import { EmptyState } from "./EmptyState";
import { PlacedStructure } from "@/hooks/usePlacedStructures";
import { getMaterialImage } from "@/data/materials";
import { useMemo } from "react";

interface MaterialsTrackerProps {
  placedStructures: PlacedStructure[];
}

export function MaterialsTracker({ placedStructures }: MaterialsTrackerProps) {
  const materials = useMemo(() => {
    const materialMap = new Map<string, number>();
    
    placedStructures
      .filter((p) => !p.built)
      .forEach((placed) => {
        placed.structure.materials.forEach((mat) => {
          const current = materialMap.get(mat.name) || 0;
          materialMap.set(mat.name, current + mat.amount);
        });
      });
    
    return Array.from(materialMap.entries())
      .map(([name, amount]) => ({ name, amount }))
      .sort((a, b) => b.amount - a.amount);
  }, [placedStructures]);

  return (
    <div className="flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-bold uppercase tracking-wide text-foreground" style={{ fontFamily: 'Impact, "Arial Black", sans-serif' }}>Materials Needed</h3>
        <span className="text-xs font-bold text-muted-foreground bg-secondary px-2.5 py-1 rounded">
          {materials.length} items
        </span>
      </div>
      {materials.length === 0 ? (
        <EmptyState
          icon={Package}
          title="No Materials Yet"
          description="Place structures on the canvas to see required materials"
        />
      ) : (
        <div className="space-y-2">
          {materials.map((mat) => {
            const materialImage = getMaterialImage(mat.name);
            return (
              <div
                key={mat.name}
                className="flex items-center justify-between py-2 px-3 rounded-md bg-secondary/50"
              >
                <div className="flex items-center gap-2.5">
                  {materialImage ? (
                    <img
                      src={materialImage}
                      alt={mat.name}
                      className="w-8 h-8 object-contain"
                    />
                  ) : null}
                  <span className="text-sm font-medium text-foreground">{mat.name}</span>
                </div>
                <span className="text-sm font-bold text-primary">{mat.amount}×</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}