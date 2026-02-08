import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { tileMappings, getTileMapping } from "@/data/tileMappings";

const tileAssets = import.meta.glob<string>(
  "@/assets/dst-assets/items/splited/**/*.png",
  { eager: true, query: "?url", import: "default" }
);

const ITEMS = [
  // Structures
  "science-machine",
  "alchemy-engine",
  "campfire",
  "fire-pit",
  "crock-pot",
  "drying-rack",
  "chest",
  "icebox",
  "sign",
  "tent",
  "siesta-lean-to",
  "endothermic-fire-pit",
  "prestihatitator",
  "think-tank",
  "lightning-rod",
  "pig-house",
  "rabbit-hutch",
  "bee-box",
  "birdcage",
  // Materials
  "log",
  "twigs",
  "cut-grass",
  "rocks",
  "flint",
  "gold-nugget",
  "boards",
  "cut-stone",
  "rope",
  "papyrus",
  "charcoal",
  "gears",
  "nightmare-fuel",
];

const ITEM_SETS = [
  "item_set1",
  "item_set2",
  "item_set3",
];

export function TileMapper() {
  const [selectedItem, setSelectedItem] = useState<string | null>(null);
  const [selectedSet, setSelectedSet] = useState<string>("item_set1");
  const [tileSearch, setTileSearch] = useState<string>("");
  const [currentMapping, setCurrentMapping] = useState<Record<string, string>>(
    tileMappings
  );

  const tileRange = useMemo(() => {
    const setIndex = ITEM_SETS.indexOf(selectedSet);
    const counts = [57, 1000, 1000]; // item_set1, item_set2, item_set3
    return Array.from({ length: counts[setIndex] }, (_, i) =>
      String(i + 1).padStart(3, "0")
    );
  }, [selectedSet]);

  const filteredTiles = useMemo(() => {
    if (!tileSearch) return tileRange;
    return tileRange.filter((tile) => tile.includes(tileSearch));
  }, [tileRange, tileSearch]);

  const handleSelectTile = (tileNum: string) => {
    if (!selectedItem) return;

    const tilePath = `tile${tileNum}.png`;

    setCurrentMapping({
      ...currentMapping,
      [selectedItem]: tilePath,
    });

    alert(
      `Mapeamento criado:\n"${selectedItem}": "${tilePath}"\n\nPasta: ${selectedSet}`
    );
  };

  const getMappingCode = () => {
    const entries = Object.entries(currentMapping)
      .map(([key, val]) => `  "${key}": "${val}"`)
      .join(",\n");

    return `export const tileMappings: Record<string, string> = {\n${entries},\n};`;
  };

  return (
    <div className="w-full max-w-6xl mx-auto p-6 space-y-6 bg-background">
      <h1 className="text-3xl font-bold">DST Tile Mapper</h1>
      <p className="text-sm text-muted-foreground">
        Selecione um item, escolha o asset set, e clique no tile correto.
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Panel: Items */}
        <Card className="p-4 space-y-4">
          <h2 className="font-bold">Items</h2>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {ITEMS.map((item) => (
              <button
                key={item}
                onClick={() => setSelectedItem(item)}
                className={`w-full text-left px-3 py-2 rounded text-sm transition-colors ${
                  selectedItem === item
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary hover:bg-secondary/80"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span>{item}</span>
                  {getTileMapping(item) && (
                    <span className="text-xs bg-green-600 px-2 py-1 rounded">
                      {getTileMapping(item)}
                    </span>
                  )}
                </div>
              </button>
            ))}
          </div>
        </Card>

        {/* Middle: Tile Selector */}
        <div className="lg:col-span-2 space-y-4">
          {selectedItem ? (
            <>
              <Card className="p-4">
                <h2 className="font-bold mb-4">
                  Item selecionado: <span className="text-primary">{selectedItem}</span>
                </h2>

                <div className="space-y-4">
                  {/* Asset Set Selector */}
                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      Asset Set:
                    </label>
                    <div className="flex gap-2">
                      {ITEM_SETS.map((set) => (
                        <Button
                          key={set}
                          variant={selectedSet === set ? "default" : "outline"}
                          onClick={() => setSelectedSet(set)}
                          className="text-sm"
                        >
                          {set}
                        </Button>
                      ))}
                    </div>
                  </div>

                  {/* Tile Search */}
                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      Pesquisar tile (ex: 045):
                    </label>
                    <Input
                      type="text"
                      placeholder="Digite número do tile..."
                      value={tileSearch}
                      onChange={(e) => setTileSearch(e.target.value)}
                      className="text-sm"
                    />
                  </div>

                  {/* Tile Preview Grid */}
                  <div className="bg-secondary/30 p-4 rounded">
                    <p className="text-xs text-muted-foreground mb-3">
                      Clique no tile correto de {selectedSet} ({filteredTiles.length} tiles):
                    </p>
                    <div className="grid grid-cols-8 gap-2 max-h-64 overflow-y-auto">
                      {filteredTiles.map((tileNum) => (
                        <button
                          key={tileNum}
                          onClick={() => handleSelectTile(tileNum)}
                          className="aspect-square rounded border border-border hover:border-primary hover:bg-primary/10 transition-all flex items-center justify-center text-xs font-mono hover:shadow-md"
                          title={`tile${tileNum}.png`}
                        >
                          <img
                            src={tileAssets[`/src/assets/dst-assets/items/splited/${selectedSet}/tile${tileNum}.png`]}
                            alt={`tile${tileNum}`}
                            className="w-full h-full object-contain p-1"
                            onError={(e) => {
                              (e.target as HTMLImageElement).alt = "X";
                            }}
                          />
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Current Mapping */}
                  {getTileMapping(selectedItem) && (
                    <div className="bg-green-600/10 p-3 rounded text-sm">
                      <p className="font-medium text-green-700">
                        ✓ Mapeado para: {getTileMapping(selectedItem)}
                      </p>
                    </div>
                  )}
                </div>
              </Card>
            </>
          ) : (
            <Card className="p-4 text-center text-muted-foreground">
              Selecione um item para começar
            </Card>
          )}
        </div>
      </div>

      {/* Code Output */}
      <Card className="p-4 space-y-3">
        <h2 className="font-bold">Código gerado:</h2>
        <pre className="bg-secondary p-3 rounded text-xs overflow-x-auto max-h-48 overflow-y-auto">
          <code>{getMappingCode()}</code>
        </pre>
        <Button
          onClick={() => {
            navigator.clipboard.writeText(getMappingCode());
            alert("Código copiei para clipboard!");
          }}
          className="w-full"
        >
          Copiar para Clipboard
        </Button>
      </Card>
    </div>
  );
}
