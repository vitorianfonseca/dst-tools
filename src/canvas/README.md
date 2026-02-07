# Canvas 2D Editor - Documentação e Guia de Uso

## 📋 Visão Geral

Este é um editor visual **não grid-based** com suporte a:
- ✅ Movimento livre em coordenadas contínuas (x, y)
- ✅ Múltiplos objetos sobrepostos
- ✅ Zoom e pan
- ✅ Seleção múltipla
- ✅ Sistema de layers com visibilidade e lock
- ✅ Drag & drop com precisão
- ✅ Undo/redo (arquitetura pronta, TODO: implementar)
- ✅ Snap grid opcional

---

## 🏗️ Arquitetura

### Estrutura de Arquivos

```
src/canvas/
├── index.ts                 # Re-exports
├── types.ts                 # Tipos TypeScript
├── store.ts                 # Zustand state management
├── utils.ts                 # Funções utilitárias (bounds, rendering)
├── history.ts               # Undo/redo operations
├── CanvasEditor.tsx         # Componente Canvas (HTML5 2D)
├── CanvasEditorApp.tsx      # App completo (integrado)
├── Toolbar.tsx              # Top bar com controles
├── LayerPanel.tsx           # Painel lateral de layers
└── PropertiesPanel.tsx      # Painel de propriedades do objeto
```

### Tipos Core

#### PlaceableObject
Todo objeto no canvas tem:
```typescript
{
  id: string;
  position: { x: number; y: number };      // Contínuo, não grid
  dimensions: { width: number; height: number };
  anchor: AnchorPoint;                     // Pivot point (ex: 'center')
  layer: 'ground' | 'structure' | 'decoration' | 'overlay';
  zIndex: number;                          // Ordem dentro da layer
  rotation: number;                        // Graus (0-360)
  scale: { x: number; y: number };
  visual: { opacity, selected, locked };
  metadata: { assetKey, functionalRadius, data };
}
```

#### CanvasWorkspace
O estado completo do editor:
```typescript
{
  objects: Map<string, PlaceableObject>;   // Acesso O(1)
  camera: { x, y, zoom };
  selectedIds: Set<string>;
  layerSettings: Record<Layer, { visible, locked, opacity }>;
  snap: { enabled, size, threshold };
  history: { undo, redo };                 // Stack de ações
}
```

---

## 🚀 Como Usar

### 1. Importar e Renderizar o Editor

```typescript
import { CanvasEditorApp } from '@/canvas';

export default function MyEditorPage() {
  return (
    <CanvasEditorApp
      width={1400}
      height={800}
      showLeftPanel={true}
      showRightPanel={true}
    />
  );
}
```

### 2. Acessar a Store

```typescript
import { useCanvasStore } from '@/canvas';

function MyComponent() {
  const { workspace, addObject, selectObject } = useCanvasStore();
  
  const handleAdd = () => {
    addObject({
      type: 'structure',
      position: { x: 100, y: 100 },
      dimensions: { width: 64, height: 64 },
      anchor: 'center',
      layer: 'structure',
      zIndex: 0,
      rotation: 0,
      scale: { x: 1, y: 1 },
      visual: { opacity: 1, highlighted: false, selected: false, locked: false },
      metadata: { assetKey: 'my-object', name: 'My Object' },
    });
  };
  
  return <button onClick={handleAdd}>Add Object</button>;
}
```

### 3. Atualizar Objetos

```typescript
const { updateObject } = useCanvasStore();

// Atualizar posição
updateObject(objectId, {
  position: { x: 200, y: 300 },
});

// Atualizar múltiplas propriedades
updateObject(objectId, {
  rotation: 45,
  scale: { x: 1.5, y: 1.5 },
  visual: { ...obj.visual, opacity: 0.5 },
});
```

### 4. Seleção e Multi-select

```typescript
const { selectObject, selectMultiple, toggleObjectSelection, clearSelection } = useCanvasStore();

// Selecionar um objeto
selectObject('obj_123');

// Multi-select
selectMultiple(['obj_1', 'obj_2', 'obj_3']);

// Toggle
toggleObjectSelection('obj_123');

// Limpar
clearSelection();
```

### 5. Gerenciar Layers

```typescript
const { toggleLayerVisibility, toggleLayerLock, setLayerOpacity } = useCanvasStore();

// Mostrar/esconder layer
toggleLayerVisibility('structure');

// Lock/unlock layer
toggleLayerLock('decoration');

// Ajustar opacidade
setLayerOpacity('overlay', 0.5); // 50%
```

### 6. Zoom e Pan

```typescript
const { zoomCamera, panCamera, resetCamera } = useCanvasStore();

// Zoom in 1.2x
zoomCamera(1.2);

// Zoom out 0.9x
zoomCamera(0.9);

// Pan (deslizar)
panCamera({ x: 100, y: 50 });

// Reset
resetCamera();
```

---

## 🎮 Controles de Mouse/Teclado

| Ação | Controle |
|------|----------|
| **Selecionar** | Click |
| **Multi-select** | Ctrl/Cmd + Click |
| **Drag** | Click + Drag |
| **Drag múltiplo** | Selecionar + Drag |
| **Pan** | Middle Mouse ou Spacebar + Drag |
| **Zoom** | Mouse Wheel (scroll) |
| **Delete** | Delete key |
| **Undo** | Ctrl/Cmd + Z |
| **Redo** | Ctrl/Cmd + Shift + Z |

---

## 🔧 Componentes

### CanvasEditor
- Renderiza o canvas 2D
- Gerencia eventos de mouse/teclado
- Atualiza store com interações

### Toolbar
- Botões: Add, Delete, Duplicate, Clear
- Info: Object count, zoom level
- Grid snap toggle

### LayerPanel
- Mostrar/esconder layers
- Lock/unlock layers
- Ajustar opacidade por layer

### PropertiesPanel
- Editar propriedades do objeto selecionado
- Position (x, y)
- Dimensions (width, height)
- Rotation, Scale, Opacity
- Layer e Z-index
- Anchor point

---

## 📊 Sistema de Z-Index

Os objetos são renderizados em ordem:

```
1. Ground layer     (zIndex 0-9999)
2. Structure layer  (zIndex 0-9999)
3. Decoration layer (zIndex 0-9999)
4. Overlay layer    (zIndex 0-9999)

Global Z = LayerOrder * 10000 + LocalZIndex
```

Isso permite que você tenha controle fino dentro de cada layer, mas também ordem clara entre layers.

---

## 🎨 Estilizar Objetos

### Mudar posição de pivot

```typescript
// Mudar cómo o objeto é posicionado
updateObject(id, { anchor: 'center' });  // Agora (x,y) = centro
updateObject(id, { anchor: 'top-left' }); // Agora (x,y) = canto sup esq
updateObject(id, { anchor: 'bottom-right' }); // Agora (x,y) = canto inf dir
```

### Raio funcional

Para objetos como lightning rods que têm efeito em área:

```typescript
updateObject(id, {
  metadata: {
    ...obj.metadata,
    functionalRadius: 100,           // 100px de raio
    functionalRadiusType: 'circle',  // ou 'square'
  },
});
```

O raio aparece como círculo azul semitransparente quando o objeto está selecionado.

---

## 🔄 Undo/Redo (TODO)

Arquitetura está pronta, mas ainda não implementada. Estrutura:

```typescript
// Na store
const { pushAction, undo, redo, canUndo, canRedo } = useCanvasStore();

// Ações automáticas
// - Quando move: pushAction({ type: 'move', ... })
// - Quando adiciona: pushAction({ type: 'add', ... })
// - Quando deleta: pushAction({ type: 'delete', ... })

// Chamar manualmente
undo();  // Volta um passo
redo();  // Avança um passo
```

---

## 💾 Salvar/Carregar

```typescript
const { workspace, saveWorkspace, loadWorkspace, createNewWorkspace } = useCanvasStore();

// Salvar como JSON
const json = saveWorkspace();
localStorage.setItem('my-workspace', json);

// Carregar
const stored = localStorage.getItem('my-workspace');
if (stored) {
  const data = JSON.parse(stored);
  loadWorkspace(data);
}

// Novo workspace
createNewWorkspace('My Design', 1920, 1080);
```

---

## 🎯 Snap Grid (Opcional)

```typescript
const { setSnapEnabled, setSnapSize } = useCanvasStore();

// Ativar snap
setSnapEnabled(true);
setSnapSize(32); // Cada 32px

// Threshold é a distância mínima para snap activar
// Default: 50000 (effectivamente desativado)
```

---

## 📐 Utilitários Úteis

### Bounds e Colisão

```typescript
import { getObjectBounds, objectContainsPoint, getTopObjectAtPoint } from '@/canvas';

// Obter bounding box
const bounds = getObjectBounds(obj);
// { left, top, right, bottom, width, height, centerX, centerY }

// Check if point is inside object
const isInside = objectContainsPoint(obj, { x: 150, y: 200 });

// Find top object at point
const topObj = getTopObjectAtPoint(point, workspace.objects);
```

### Conversão de Coordenadas

```typescript
import { screenToCanvas, canvasToScreen } from '@/canvas';

// Screen (pixels na tela) → Canvas (mundo do editor)
const canvasPoint = screenToCanvas(
  screenPoint,      // { x, y } em pixels do canvas
  camera.x,
  camera.y,
  camera.zoom
);

// Canvas → Screen
const screenPoint = canvasToScreen(canvasPoint, camera.x, camera.y, camera.zoom);
```

### Clone de Objeto

```typescript
import { cloneObject, generateObjectId } from '@/canvas';

const clone = cloneObject(obj);
clone.id = generateObjectId();
// Agora é um novo objeto independente
```

---

## 🐛 Debugging

### Ver estado atual

```typescript
const { workspace } = useCanvasStore();

console.log('Total objects:', workspace.objects.size);
console.log('Selected:', workspace.selectedIds);
console.log('Camera:', workspace.camera);
console.log('Objects:', Array.from(workspace.objects.values()));
```

### Salvar/carregar para inspect

```typescript
const json = useCanvasStore.getState().saveWorkspace();
console.log(JSON.parse(json));
```

---

## 📝 Notas de Implementação

### Performance
- Com 1-200 objetos, Canvas 2D pure é suficiente
- Se precisar 500+, considere Konva.js ou PixiJS
- Spatial indexing (quadtree) não implementado ainda, mas fácil de adicionar

### Limitações Atuais
- ❌ Undo/redo: arquitectura pronta, lógica TODO
- ❌ Imagens reais: placeholders cinzento. Carregamento de assets TODO
- ❌ Rotação em hitbox: ignora rotação (SAT não implementado)
- ❌ Resize handles: UI pronta mas sem lógica de drag-to-resize
- ❌ Teclado numérico para pan/zoom: TODO

### Próximos Passos
1. Implementar undo/redo completo
2. Carregar imagens de assets (em `src/assets/dst-assets/`)
3. Adicionar editor visual de raio funcional
4. Implements resize/rotate handles
5. Testar com 200+ objetos e otimizar se necessário

---

## 🚀 Roadmap

- [ ] Undo/redo funcional
- [ ] Asset loader (imagens reais)
- [ ] Handles de resize/rotate
- [ ] Snap visual (mostrar grid quando snap ativo)
- [ ] Copy/paste
- [ ] Grupo de objetos
- [ ] Serialização melhorada
- [ ] Validação de espaço (collision detection)
- [ ] Export para canvas/imagem
- [ ] Histórico visual (timeline)

---

## 📚 Exemplos Completos

### Exemplo 1: Adicionar e selecionar objeto

```typescript
function AddAndSelect() {
  const { addObject, selectObject } = useCanvasStore();
  
  const handleAdd = () => {
    // TODO: Usar estrutura real do teu jogo
    addObject({
      type: 'structure',
      position: { x: Math.random() * 500, y: Math.random() * 500 },
      dimensions: { width: 64, height: 64 },
      anchor: 'center',
      layer: 'structure',
      zIndex: 0,
      rotation: 0,
      scale: { x: 1, y: 1 },
      visual: { opacity: 1, highlighted: false, selected: false, locked: false },
      metadata: {
        assetKey: 'science-machine',
        name: 'Science Machine',
        functionalRadius: 64,
        functionalRadiusType: 'circle',
      },
    });
  };
  
  return <button onClick={handleAdd}>➕ Add</button>;
}
```

### Exemplo 2: Salvar e restaurar

```typescript
function SaveRestore() {
  const { saveWorkspace, loadWorkspace } = useCanvasStore();
  
  const save = () => {
    const json = saveWorkspace();
    localStorage.setItem('workspace', json);
    alert('Saved!');
  };
  
  const load = () => {
    const json = localStorage.getItem('workspace');
    if (json) {
      loadWorkspace(JSON.parse(json));
      alert('Loaded!');
    }
  };
  
  return (
    <>
      <button onClick={save}>💾 Save</button>
      <button onClick={load}>📂 Load</button>
    </>
  );
}
```

---

## 🎓 Conceitos

### Anchor Point
Determina onde a posição (x, y) do objeto é referenciada:
- `center`: x,y = centro do objeto
- `top-left`: x,y = canto superior esquerdo
- etc.

Isso afeta como o objeto é renderizado e é crítico para drag intuitivo.

### Layer
Agrupa objetos e controla ordem de render:
- **ground**: Terreno, piso
- **structure**: Estruturas (máquinas, fornalhas)
- **decoration**: Decoração (flores, lanternas)
- **overlay**: UI no topo

### Global Z-Index
Determina ordem final de render considerando layer E zIndex local:
```
global = (layer_order * 10000) + local_zindex
```

Garante que todas estruturas aparecem antes de decorações, etc.

---

Qualquer dúvida, consultar os tipos em `src/canvas/types.ts` ou componentes.
