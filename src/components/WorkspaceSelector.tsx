 import { useState } from "react";
 import { Plus, Check, Loader2, Pencil, Trash2, X, Globe, Lock, Users } from "lucide-react";
 import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
 import { Button } from "@/components/ui/button";
 import { Input } from "@/components/ui/input";
 import { ScrollArea } from "@/components/ui/scroll-area";
 import { useWorkspaces, Workspace } from "@/hooks/useWorkspaces";
 import { useAuth } from "@/contexts/AuthContext";
 import { ChevronDown } from "lucide-react";
 import { cn } from "@/lib/utils";
 import {
   AlertDialog,
   AlertDialogAction,
   AlertDialogCancel,
   AlertDialogContent,
   AlertDialogDescription,
   AlertDialogFooter,
   AlertDialogHeader,
   AlertDialogTitle,
 } from "@/components/ui/alert-dialog";
 import { toast } from "sonner";
 import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
 
 interface WorkspaceSelectorProps {
   currentWorkspace: Workspace | null;
   onWorkspaceChange: (workspace: Workspace) => void;
 }
 
 export function WorkspaceSelector({ currentWorkspace, onWorkspaceChange }: WorkspaceSelectorProps) {
   const { user } = useAuth();
   const { workspaces, friendWorkspaces, loading, createWorkspace, updateWorkspace, deleteWorkspace } = useWorkspaces();
   const [open, setOpen] = useState(false);
   const [isCreating, setIsCreating] = useState(false);
   const [newWorkspaceName, setNewWorkspaceName] = useState("");
   const [creating, setCreating] = useState(false);
 
   const [editingId, setEditingId] = useState<string | null>(null);
   const [editingName, setEditingName] = useState("");
   const [saving, setSaving] = useState(false);
 
   const [deleteTarget, setDeleteTarget] = useState<Workspace | null>(null);
   const [deleting, setDeleting] = useState(false);
 
   const [togglingVisibility, setTogglingVisibility] = useState<string | null>(null);
 
   const handleCreate = async () => {
     if (!newWorkspaceName.trim()) return;
     
     setCreating(true);
     const { data, error } = await createWorkspace(newWorkspaceName.trim());
     setCreating(false);
     
     if (!error && data) {
       onWorkspaceChange(data);
       setNewWorkspaceName("");
       setIsCreating(false);
       setOpen(false);
     }
   };
 
   const handleStartEdit = (workspace: Workspace, e: React.MouseEvent) => {
     e.stopPropagation();
     setEditingId(workspace.id);
     setEditingName(workspace.name);
   };
 
   const handleSaveEdit = async () => {
     if (!editingId || !editingName.trim()) return;
 
     setSaving(true);
     const { error } = await updateWorkspace(editingId, { name: editingName.trim() });
     setSaving(false);
 
     if (error) {
       toast.error("Erro ao renomear base");
     } else {
       toast.success("Base renomeada");
       if (currentWorkspace?.id === editingId) {
         onWorkspaceChange({ ...currentWorkspace, name: editingName.trim() });
       }
     }
     setEditingId(null);
     setEditingName("");
   };
 
   const handleCancelEdit = () => {
     setEditingId(null);
     setEditingName("");
   };
 
   const handleToggleVisibility = async (workspace: Workspace, e: React.MouseEvent) => {
     e.stopPropagation();
     setTogglingVisibility(workspace.id);
     
     const newVisibility = workspace.visibility === "public" ? "private" : "public";
     const { error } = await updateWorkspace(workspace.id, { visibility: newVisibility });
     
     setTogglingVisibility(null);
     
     if (error) {
       toast.error("Erro ao alterar visibilidade");
     } else {
       toast.success(newVisibility === "public" ? "Base agora é pública" : "Base agora é privada");
       if (currentWorkspace?.id === workspace.id) {
         onWorkspaceChange({ ...currentWorkspace, visibility: newVisibility });
       }
     }
   };
 
   const handleDeleteClick = (workspace: Workspace, e: React.MouseEvent) => {
     e.stopPropagation();
     setDeleteTarget(workspace);
   };
 
   const handleConfirmDelete = async () => {
     if (!deleteTarget) return;
 
     setDeleting(true);
     const { error } = await deleteWorkspace(deleteTarget.id);
     setDeleting(false);
 
     if (error) {
       toast.error("Erro ao eliminar base");
     } else {
       toast.success("Base eliminada");
       if (currentWorkspace?.id === deleteTarget.id) {
         const remaining = workspaces.filter(w => w.id !== deleteTarget.id);
         onWorkspaceChange(remaining[0] || null as unknown as Workspace);
       }
     }
     setDeleteTarget(null);
   };
 
   const handleSelect = (workspace: Workspace) => {
     if (editingId) return;
     onWorkspaceChange(workspace);
     setOpen(false);
   };
 
   if (!user) {
     return (
       <Button
         variant="outline"
         size="sm"
         className="h-8 gap-2 text-xs font-medium"
         disabled
       >
         <span className="max-w-[120px] truncate">Faça login</span>
       </Button>
     );
   }
 
   return (
     <>
       <Popover open={open} onOpenChange={setOpen}>
       <PopoverTrigger asChild>
         <Button
           variant="outline"
           size="sm"
           className="h-8 gap-2 text-xs font-medium"
         >
           <span className="max-w-[120px] truncate">
             {currentWorkspace?.name || "Selecionar base"}
           </span>
           <ChevronDown className="h-3 w-3 text-muted-foreground" />
         </Button>
       </PopoverTrigger>
       <PopoverContent className="w-64 p-0" align="end">
         <Tabs defaultValue="mine" className="w-full">
           <TabsList className="w-full grid grid-cols-2 h-9 p-1 m-2 mb-0" style={{ width: 'calc(100% - 16px)' }}>
             <TabsTrigger value="mine" className="text-xs gap-1.5">
               <Lock className="h-3 w-3" />
               Minhas
             </TabsTrigger>
             <TabsTrigger value="friends" className="text-xs gap-1.5">
               <Users className="h-3 w-3" />
               Amigos
             </TabsTrigger>
           </TabsList>
           
           <TabsContent value="mine" className="mt-0">
             <ScrollArea className="max-h-[200px]">
               {loading ? (
                 <div className="flex items-center justify-center py-4">
                   <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                 </div>
               ) : workspaces.length === 0 ? (
                 <p className="text-xs text-muted-foreground text-center py-4">
                   Nenhuma base criada
                 </p>
               ) : (
                 <div className="p-1">
                   {workspaces.map((workspace) => (
                     <div
                       key={workspace.id}
                       className={cn(
                         "group flex items-center justify-between w-full px-2 py-1.5 text-sm rounded-md border border-transparent transition-default cursor-pointer",
                         currentWorkspace?.id === workspace.id 
                           ? "border-primary/50 bg-primary/10" 
                           : "hover:bg-muted"
                       )}
                       onClick={() => handleSelect(workspace)}
                     >
                       {editingId === workspace.id ? (
                         <div className="flex items-center gap-1 w-full" onClick={(e) => e.stopPropagation()}>
                           <Input
                             value={editingName}
                             onChange={(e) => setEditingName(e.target.value)}
                             className="h-6 text-sm flex-1"
                             autoFocus
                             onKeyDown={(e) => {
                               if (e.key === "Enter") handleSaveEdit();
                               if (e.key === "Escape") handleCancelEdit();
                             }}
                           />
                           <Button
                             size="icon"
                             variant="ghost"
                             className="h-6 w-6"
                             onClick={handleSaveEdit}
                             disabled={!editingName.trim() || saving}
                           >
                             {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
                           </Button>
                           <Button
                             size="icon"
                             variant="ghost"
                             className="h-6 w-6"
                             onClick={handleCancelEdit}
                           >
                             <X className="h-3 w-3" />
                           </Button>
                         </div>
                       ) : (
                         <>
                           <div className="flex items-center gap-1.5 truncate">
                             {workspace.visibility === "public" ? (
                              <Globe className="h-3 w-3 text-primary shrink-0" />
                             ) : (
                               <Lock className="h-3 w-3 text-muted-foreground shrink-0" />
                             )}
                             <span className="truncate">{workspace.name}</span>
                           </div>
                           <div className="flex items-center gap-1">
                             {currentWorkspace?.id === workspace.id && (
                               <Check className="h-4 w-4 text-primary shrink-0" />
                             )}
                             <div className="hidden group-hover:flex items-center">
                               <Button
                                 size="icon"
                                 variant="ghost"
                                 className="h-6 w-6"
                                 onClick={(e) => handleToggleVisibility(workspace, e)}
                                 disabled={togglingVisibility === workspace.id}
                                 title={workspace.visibility === "public" ? "Tornar privada" : "Tornar pública"}
                               >
                                 {togglingVisibility === workspace.id ? (
                                   <Loader2 className="h-3 w-3 animate-spin" />
                                 ) : workspace.visibility === "public" ? (
                                   <Lock className="h-3 w-3" />
                                 ) : (
                                   <Globe className="h-3 w-3" />
                                 )}
                               </Button>
                               <Button
                                 size="icon"
                                 variant="ghost"
                                 className="h-6 w-6"
                                 onClick={(e) => handleStartEdit(workspace, e)}
                               >
                                 <Pencil className="h-3 w-3" />
                               </Button>
                               <Button
                                 size="icon"
                                 variant="ghost"
                                 className="h-6 w-6 text-destructive hover:text-destructive"
                                 onClick={(e) => handleDeleteClick(workspace, e)}
                               >
                                 <Trash2 className="h-3 w-3" />
                               </Button>
                             </div>
                           </div>
                         </>
                       )}
                     </div>
                   ))}
                 </div>
               )}
             </ScrollArea>
 
             <div className="p-2 border-t border-border">
               {isCreating ? (
                 <div className="flex gap-2">
                   <Input
                     placeholder="Nome da base..."
                     value={newWorkspaceName}
                     onChange={(e) => setNewWorkspaceName(e.target.value)}
                     className="h-8 text-sm"
                     autoFocus
                     onKeyDown={(e) => {
                       if (e.key === "Enter") handleCreate();
                       if (e.key === "Escape") {
                         setIsCreating(false);
                         setNewWorkspaceName("");
                       }
                     }}
                   />
                   <Button
                     size="sm"
                     className="h-8 px-2"
                     onClick={handleCreate}
                     disabled={!newWorkspaceName.trim() || creating}
                   >
                     {creating ? (
                       <Loader2 className="h-4 w-4 animate-spin" />
                     ) : (
                       <Check className="h-4 w-4" />
                     )}
                   </Button>
                 </div>
               ) : (
                 <Button
                   variant="ghost"
                   size="sm"
                   className="w-full h-8 justify-start text-xs gap-2"
                   onClick={() => setIsCreating(true)}
                 >
                   <Plus className="h-4 w-4" />
                   Nova base
                 </Button>
               )}
             </div>
           </TabsContent>
 
           <TabsContent value="friends" className="mt-0">
             <ScrollArea className="max-h-[250px]">
               {loading ? (
                 <div className="flex items-center justify-center py-4">
                   <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                 </div>
               ) : friendWorkspaces.length === 0 ? (
                 <div className="text-center py-6 px-4">
                   <Users className="h-8 w-8 text-muted-foreground/50 mx-auto mb-2" />
                   <p className="text-xs text-muted-foreground">
                     Nenhuma base pública de amigos
                   </p>
                 </div>
               ) : (
                 <div className="p-1">
                   {friendWorkspaces.map((workspace) => (
                     <div
                       key={workspace.id}
                       className={cn(
                         "flex items-center justify-between w-full px-2 py-1.5 text-sm rounded-md border border-transparent transition-default cursor-pointer",
                         currentWorkspace?.id === workspace.id 
                           ? "border-primary/50 bg-primary/10" 
                           : "hover:bg-muted"
                       )}
                       onClick={() => handleSelect(workspace)}
                     >
                       <div className="flex flex-col min-w-0">
                         <span className="truncate">{workspace.name}</span>
                         <span className="text-xxs text-muted-foreground truncate">
                           por {workspace.owner_name}
                         </span>
                       </div>
                       {currentWorkspace?.id === workspace.id && (
                         <Check className="h-4 w-4 text-primary shrink-0" />
                       )}
                     </div>
                   ))}
                 </div>
               )}
             </ScrollArea>
           </TabsContent>
         </Tabs>
       </PopoverContent>
     </Popover>
 
       <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
       <AlertDialogContent>
         <AlertDialogHeader>
           <AlertDialogTitle>Eliminar base?</AlertDialogTitle>
           <AlertDialogDescription>
             A base "{deleteTarget?.name}" será eliminada permanentemente. Esta ação não pode ser desfeita.
           </AlertDialogDescription>
         </AlertDialogHeader>
         <AlertDialogFooter>
           <AlertDialogCancel disabled={deleting}>Cancelar</AlertDialogCancel>
           <AlertDialogAction
             onClick={handleConfirmDelete}
             disabled={deleting}
             className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
           >
             {deleting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
             Eliminar
           </AlertDialogAction>
         </AlertDialogFooter>
       </AlertDialogContent>
       </AlertDialog>
     </>
   );
 }