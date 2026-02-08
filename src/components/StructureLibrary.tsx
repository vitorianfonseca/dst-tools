 import { Search } from "lucide-react";
 import { Input } from "./ui/input";
 import { StructureCard } from "./StructureCard";
 import { structures, categories, Structure } from "@/data/structures";
import { GroundTile } from "@/data/groundTiles";
import { GroundTileSelector } from "./GroundTileSelector";
 import { useState } from "react";
 
 interface StructureLibraryProps {
   selectedStructure: Structure | null;
   onSelectStructure: (structure: Structure | null) => void;
  selectedGroundTile: GroundTile | null;
  onSelectGroundTile: (tile: GroundTile | null) => void;
  isErasingTiles: boolean;
  onToggleEraser: () => void;
   disabled?: boolean;
 }
 
export function StructureLibrary({ 
  selectedStructure, 
  onSelectStructure, 
  selectedGroundTile,
  onSelectGroundTile,
  isErasingTiles,
  onToggleEraser,
  disabled 
}: StructureLibraryProps) {
   const [activeCategory, setActiveCategory] = useState<string | null>(null);
   const [searchQuery, setSearchQuery] = useState("");
 
  const handleStructureSelect = (structure: Structure | null) => {
    onSelectStructure(structure);
    // Clear ground tile selection when selecting a structure
    if (structure) {
      onSelectGroundTile(null);
    }
  };

  const handleGroundTileSelect = (tile: GroundTile | null) => {
    onSelectGroundTile(tile);
    // Clear structure selection when selecting a ground tile
    if (tile) {
      onSelectStructure(null);
    }
  };

   const filteredStructures = structures.filter((s) => {
     const matchesCategory = !activeCategory || s.category === activeCategory;
     const matchesSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase());
     return matchesCategory && matchesSearch;
   });
 
  return (
    <aside className={`w-80 border-r border-border bg-card flex flex-col shrink-0 overflow-hidden ${disabled ? "opacity-60 pointer-events-none" : ""}`}>
      <div className="p-5 border-b border-border">
        <h2 className="text-base font-bold text-foreground mb-3 uppercase tracking-wide" style={{ fontFamily: 'Impact, "Arial Black", sans-serif' }}>
          Structures
          {disabled && <span className="text-muted-foreground font-normal ml-2">(read only)</span>}
        </h2>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search structures..."
            className="pl-9 h-10 text-sm bg-secondary border-0 placeholder:text-muted-foreground/70"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="p-4 pb-3 border-b border-border overflow-hidden">
        <div
          className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent"
          style={{ scrollbarWidth: "thin" }}
        >
          <button
            onClick={() => setActiveCategory(null)}
            className={`inline-flex items-center rounded-md px-3 py-1.5 text-xs font-bold uppercase transition-default ${
              activeCategory === null
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-secondary-foreground hover:bg-muted"
            }`}
          >
            All
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(activeCategory === cat.id ? null : cat.id)}
              className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-bold uppercase transition-default ${
                activeCategory === cat.id
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-secondary-foreground hover:bg-muted"
              }`}
            >
              <span>{cat.icon}</span>
              {cat.label}
            </button>
          ))}
        </div>
      </div>
 
       <div className="flex-1 overflow-y-auto p-4 space-y-3">
         {filteredStructures.map((structure) => (
           <StructureCard 
             key={structure.id} 
             structure={structure}
             isSelected={selectedStructure?.id === structure.id}
              onSelect={handleStructureSelect}
           />
         ))}
         {filteredStructures.length === 0 && (
           <div className="text-center py-8">
             <p className="text-sm text-muted-foreground">No structures found</p>
           </div>
         )}
       </div>

        <GroundTileSelector
          selectedTile={selectedGroundTile}
          onSelectTile={handleGroundTileSelect}
          isErasing={isErasingTiles}
          onToggleEraser={onToggleEraser}
          disabled={disabled}
        />
     </aside>
   );
 }