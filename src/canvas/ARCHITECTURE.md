# Arquitetura do Canvas Editor - Análise Técnica

## 📌 Decisões Arquiteturais

### 1. Canvas 2D vs Alternativas

#### Canvas 2D (Escolhido)
```
✅ Pros:
- Total controle
- Light weight
- Suficiente para 1-200 objetos
- Sem dependências pesadas

❌ Contras:
- Render manual
- Event handling manual
- Sem GPU acceleration
```

#### Alternativas Descartadas

**PixiJS** (WebGL)
- Quando performance crítica (500+ objetos)
- Overkill para este caso

**Konva.js** (Canvas wrapper)
- Mais features built-in
- Melhor para interatividade
- Poderia ser upgrade futuro

**Phaser** (Game engine)
- Motor de jogo
- Descartado por restrição (não quero motor de jogo)

**SVG**
- Escalável mas não GPU
- Lento com muitos objetos

### Conclusão
Canvas 2D é a escolha ideal: balanço entre controle, performance e simplicidade.

---

## 🗂️ Data Flow

```
User Interaction (Mouse/Keyboard)
        ↓
   CanvasEditor.tsx (eventos)
        ↓
  useCanvasStore (Zustand)
        ↓
  workspace (estado único)
        ↓
   React re-render
        ↓
  Canvas 2D renderer
        ↓
   Visual output
```

### Fluxo Detalhado

1. **Mouse Down**: 
   - detecta objeto at point
   - prepara dragState
   - atualiza seleção

2. **Mouse Move**:
   - calcula distância (threshold para drag)
   - move objetos se arrastandoo
   - atualiza posição em store
   - re-render automático

3. **Mouse Up**:
   - finaliza drag
   - adiciona ação ao history

---

## 💾 State Management (Zustand)

### Por que Zustand?

```
✅ Pros:
- Simples e direto
- Sem boilerplate
- Acesso fácil com hooks
- Performance (não re-renda props desnecessárias)

❌ Alternativas:
- Redux: Overkill, muita boilerplate
- Context: Performance issues com frequente updates
- MobX: Mais complexo
```

### Estrutura da Store

```typescript
interface CanvasStore {
  workspace: CanvasWorkspace;      // Estado único
  
  // Métodos
  addObject(...)
  deleteObjects(...)
  updateObject(...)
  moveObjects(...)
  
  selectObject(...)
  // ... etc
}
```

Tudo em um lugar, fácil de debugar, fácil de persistir.

---

## 🎮 Input Handling

### Mouse Events

```
User Move → screenToCanvas() → hitTest at point → update hover state

User Click → raycast (topmost object) → update selection

User Drag → calculate offset for each selected → moveObjects() → render
```

### Keyboard Events

```
Ctrl+Z → undo() (TODO)
Delete → deleteObjects(selected)
Space → set panMode (TODO)
```

---

## 🎨 Rendering Pipeline

```
1. Clear canvas (fill background)

2. Draw grid (optional, for reference)

3. For each object (sorted by global z-index):
   a. Check if layer visible
   b. Calculate screen bounds (canvas coords → screen coords)
   c. Skip if off-screen (optimization)
   d. Draw image or placeholder
   e. Draw selection UI if selected
   f. Draw functional radius if applicable

4. Draw selection rect if dragging
```

### Screen vs Canvas Coordinates

```
Canvas Coordinates:
- Mundo do editor (potencialmente infinito)
- Não afetado por zoom/pan
- Ex: {x: 1000, y: 500} pode estar off-viewport

Screen Coordinates:
- Pixels na tela do user
- Afetado por zoom/pan
- Ex: {x: 100, y: 50} sempre visível se on-screen

Conversão:
screenPoint = (canvasPoint - camera) * zoom
canvasPoint = screenPoint / zoom + camera
```

---

## 🔄 Undo/Redo Architecture

### Action Model

```typescript
type CanvasAction = 
  | { type: 'move'; objects: [...] }
  | { type: 'add'; objects: [...] }
  | { type: 'delete'; objects: [...] }
  | { type: 'modify'; objects: [...] }
  | { type: 'camera'; from: Camera; to: Camera };
```

Cada ação sabe como fazer e refazer.

### Stack

```
history = {
  undo: [action1, action2, action3],  // Histórico de ações
  redo: []                             // Para redo
}

undo():
  action = history.undo.pop()
  reverseAction(workspace, action)
  history.redo.push(action)

redo():
  action = history.redo.pop()
  applyAction(workspace, action)
  history.undo.push(action)
```

**Status**: Arquitetura pronta em `history.ts`, falta integrar chamadas em `CanvasEditor.tsx` e `store.ts`.

---

## 📊 Object Ordering

### O Problema

Com múltiplos layers e muitos objetos, como garantir ordem de render correta?

### Solução: Dual Z-Index

```
Layer Order (global):
  ground:     0-9999
  structure:  10000-19999
  decoration: 20000-29999
  overlay:    30000-39999

Local Z-Index (dentro de layer):
  0-9999 para controle fino

Global Z = (layerOrder * 10000) + localZIndex

Vantagens:
✅ Estrutura clara: estruturas sempre sobre terreno
✅ Controle fino: pode ordenar estruturas entre si
✅ Fácil debug: ver layerOrder é óbvio
```

### Alternativa Descartada: Flat Z-Index

```
❌ Sem estrutura
❌ Difícil de manter (fácil acidentalmente colocar decoração acima estrutura)
❌ Requer reorganizar números quando insere novo objeto
```

---

## 🎯 Selection & Multi-Select

### Estado

```typescript
selectedIds: Set<string>   // IDs dos objetos selecionados
```

### Lógica

```
Click + Shift → add a seleção
Click + Ctrl/Cmd → toggle seleção
Click → replace seleção
Click vazio → clear seleção

Drag múltiplo:
  1. Select object
  2. Guarde offset de cada um
  3. Ao mover, aplique offset a cada um
```

---

## 🖼️ Asset Management (TODO)

Atualmente: placeholders cinzento.

```typescript
// Futuro:
interface AssetCache {
  images: Map<string, HTMLImageElement>;
  load(key: string): Promise<HTMLImageElement>;
}

// No renderObject:
const image = await assetCache.get(obj.metadata.assetKey);
ctx.drawImage(image, ...);
```

---

## 📐 Bounds & Collision

### Cálculo

```typescript
function getObjectBounds(obj: PlaceableObject): Bounds {
  // 1. Calcular anchor offset
  const anchorOffsets = calculateAnchorOffsets(obj.anchor, width, height);
  
  // 2. Aplicar offset à posição
  const left = obj.position.x + anchorOffsets.x;
  const top = obj.position.y + anchorOffsets.y;
  
  // 3. Aplicar escala
  const width = obj.dimensions.width * Math.abs(obj.scale.x);
  const height = obj.dimensions.height * Math.abs(obj.scale.y);
  
  // 4. Retornar bounds
  return { left, top, width, height, ... };
}
```

### Limitações Atuais

```
❌ Ignora rotação na hitbox
   Motivo: SAT (Separating Axis Theorem) é complexo
   Status: TODO se necessário

✅ Rectengle-only hitbox
   Good enough para este caso
```

---

## 🔧 Performance Considerations

### Otimizações Implementadas

✅ **Spatial culling**: Check se off-screen antes de render
✅ **Efficient hit detection**: Top-most object em O(n)
✅ **Map for objects**: O(1) lookup by ID

### Otimizações Não Implementadas (TODO if needed)

❌ **Quadtree**: Para hit detection com 500+ objetos
❌ **Dirty flag**: Skip render se nada mudou
❌ **Batch rendering**: Agrupar draws similares
❌ **WebWorker**: Offload calc intensivo

### Performance Targets

```
- 1-200 objetos: 60 FPS com Canvas 2D puro ✅
- 200-500: Considere Konva.js ou PixiJS
- 500+: Precisa WebGL + spatial indexing
```

---

## 🚨 Error Handling

Atualmente: minimális.

Adicionar:
```typescript
try {
  applyAction(workspace, action);
} catch (e) {
  console.error('Action failed:', action, e);
  // Revert if needed
}
```

---

## 🔐 Serialization

### Current Format

```json
{
  "id": "ws_...",
  "name": "My Workspace",
  "objects": [
    {
      "id": "obj_...",
      "position": { "x": 100, "y": 200 },
      ...
    }
  ],
  "camera": { "x": 0, "y": 0, "zoom": 1 },
  "selectedIds": [],
  "history": { "undo": [], "redo": [] }
}
```

### Problemas

⚠️ **Histórico serializado**: Torna JSON grande
- Solução: Só salvar workspace current, não history

⚠️ **Sem schema validation**:
- Solução: Adicionar Zod ou similar

⚠️ **Sem versionamento**:
- Solução: Adicionar `version: 1` para migrations futuras

---

## 📤 Export/Import

### Planeado

```typescript
// Export para imagem
function exportAsImage(workspace): Blob {
  // Render todo canvas para offscreen canvas
  // toBlob() e return
}

// Export para JSON
function exportAsJSON(workspace): string {
  return saveWorkspace();
}

// Import
function importFromJSON(json): CanvasWorkspace {
  return JSON.parse(json);
}
```

---

## 🎓 Padrões de Design Utilizados

### 1. **Strategy Pattern**
```typescript
// Diferentes tipos de ações
type CanvasAction = 'move' | 'add' | 'delete' | ...;

// Cada tipo tem lógica diferente em applyAction/reverseAction
```

### 2. **Observer Pattern**
```typescript
// React + Zustand já implementa isso
// Store emite updates → React listeners
```

### 3. **Composite Pattern**
```typescript
// Objects representam árvore (layers → objects)
// Render recursivamente (layer por layer)
```

### 4. **Singleton Pattern**
```typescript
// useCanvasStore é singleton
// Apenas uma instância per app
```

---

## 🔗 Dependencies

```
zustand          - State management
react            - UI framework
typescript       - Type safety
vite             - Build tool

Dev:
@types/react     - Type definitions
```

Minimal dependencies = Low maintenance burden ✅

---

## 🚀 Future Architecture Improvements

### If scaling to 500+ objects

```
1. Switch to PixiJS (GPU)
   - Drop Canvas 2D render code
   - Reuse store/types/logic
   
2. Add Quadtree spatial index
   - Fast hit detection
   - Frustum culling
   
3. Asset loader service
   - Lazy load textures
   - Texture atlas
```

### If adding collaboration

```
1. Central state sync
   - Diff-based sync
   - Conflict resolution
   
2. Action broadcasting
   - Send actions through websocket
   - Local apply + remote apply
   
3. Operational transforms
   - Handle concurrent edits
```

---

## 📝 Development Guide

### Adding a New Feature

1. **Update types** (`types.ts`)
   ```typescript
   interface PlaceableObject {
     newField: string;
   }
   ```

2. **Update store** (`store.ts`)
   ```typescript
   updateNewField: (id: string, value: string) => { ... }
   ```

3. **Update UI** (Toolbar/Properties)
   ```typescript
   <input value={workspace.objects.get(id)?.newField} onChange={...} />
   ```

4. **Test**
   ```typescript
   npm run dev
   // Test in http://localhost:5173/canvas-editor
   ```

---

## 🐛 Common Issues & Solutions

### Problema: Objeto não aparece

```
✅ Check: layer visibility
✅ Check: objeto in workspace.objects
✅ Check: bounds calculation
✅ Debug: console.log(workspace.objects)
```

### Problema: Drag não funciona

```
✅ Check: objeto está selected?
✅ Check: spacePressed state
✅ Check: distance < threshold?
✅ Debug: console.log(inputState.drag)
```

### Problema: Performance ruim

```
✅ Check: quantos objetos?
✅ Check: zoom muito pequeno (viewport grande)?
✅ Check: função render chamada demais?
✅ Solution: useCallback para render
```

---

Fim da documentação arquitetural.
