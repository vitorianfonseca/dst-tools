 import { useState, useEffect } from "react";
 import { Navigate, useSearchParams } from "react-router-dom";
 import { useAuth } from "@/contexts/AuthContext";
 import { useProfile } from "@/hooks/useProfile";
 import { useWorkspaces, Workspace } from "@/hooks/useWorkspaces";
 import { useFriends } from "@/hooks/useFriends";
 import { Button } from "@/components/ui/button";
 import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faScrewdriverWrench } from "@fortawesome/free-solid-svg-icons";
import { ArrowLeft, Globe, Lock, User, Users, Palette, Trash2, Check, X, UserMinus, Send, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Profile as ProfileType } from "@/hooks/useProfile";
import { ImageUpload } from "@/components/profile/ImageUpload";
import { getRandomDontStarveBio } from "@/data/dontStarveBios";
import { WorkspacePreview } from "@/components/WorkspacePreview";
import { useNavigate } from "react-router-dom";

export default function Profile() {
   const { user, loading: authLoading } = useAuth();
   const { profile, loading: profileLoading, updateProfile } = useProfile();
   const { workspaces, loading: workspacesLoading, updateWorkspace, deleteWorkspace } = useWorkspaces();
   const { friends, pendingRequests, sentRequests, acceptFriendRequest, rejectFriendRequest, cancelFriendRequest, removeFriend, sendFriendRequest } = useFriends();
   const navigate = useNavigate();
 
   const [displayName, setDisplayName] = useState("");
   const [bio, setBio] = useState("");
   const [avatarUrl, setAvatarUrl] = useState("");
   const [bannerUrl, setBannerUrl] = useState("");
   const [isEditing, setIsEditing] = useState(false);
   const [searchQuery, setSearchQuery] = useState("");
   const [searchResults, setSearchResults] = useState<ProfileType[]>([]);
   const [isSearching, setIsSearching] = useState(false);
  const [savingPrivacy, setSavingPrivacy] = useState(false);
 
   // Persist active tab in URL
   const [searchParams, setSearchParams] = useSearchParams();
   const activeTab = searchParams.get("tab") || "workspaces";
 
   const handleTabChange = (value: string) => {
     setSearchParams({ tab: value }, { replace: true });
   };
 
   if (authLoading || profileLoading) {
     return (
       <div className="min-h-screen flex items-center justify-center bg-background">
         <div className="animate-pulse text-muted-foreground">A carregar...</div>
       </div>
     );
   }
 
   if (!user) {
     return <Navigate to="/auth" replace />;
   }
 
   const handleStartEdit = () => {
     setDisplayName(profile?.display_name || "");
     setBio(profile?.bio || "");
     setAvatarUrl(profile?.avatar_url || "");
     setBannerUrl(profile?.banner_url || "");
     setIsEditing(true);
   };
 
  const handleGenerateRandomBio = () => {
    setBio(getRandomDontStarveBio());
  };

   const handleSaveProfile = async () => {
     const { error } = await updateProfile({
       display_name: displayName,
       bio,
       avatar_url: avatarUrl || null,
       banner_url: bannerUrl || null,
     });
 
     if (error) {
       toast.error("Erro ao guardar perfil");
     } else {
       toast.success("Perfil guardado!");
       setIsEditing(false);
     }
   };
 
   const handleTogglePrivacy = async () => {
    setSavingPrivacy(true);
     const { error } = await updateProfile({ is_private: !profile?.is_private });
    setSavingPrivacy(false);
     if (error) {
       toast.error("Erro ao atualizar privacidade");
     } else {
       toast.success(profile?.is_private ? "Perfil agora é público" : "Perfil agora é privado");
     }
   };
 
   const handleToggleWorkspaceVisibility = async (workspace: Workspace) => {
     const newVisibility = workspace.visibility === "public" ? "private" : "public";
     const { error } = await updateWorkspace(workspace.id, { visibility: newVisibility });
     if (error) {
       toast.error("Erro ao atualizar visibilidade");
     } else {
       toast.success(`Workspace agora é ${newVisibility === "public" ? "público" : "privado"}`);
     }
   };
 
   const handleDeleteWorkspace = async (id: string) => {
     const { error } = await deleteWorkspace(id);
     if (error) {
       toast.error("Erro ao eliminar workspace");
     } else {
       toast.success("Workspace eliminado");
     }
   };
 
   const handleSearchUsers = async () => {
     if (!searchQuery.trim()) return;
 
     setIsSearching(true);
     const { data, error } = await supabase
       .from("profiles")
       .select("*")
       .ilike("display_name", `%${searchQuery}%`)
       .neq("id", user.id)
       .limit(10);
 
     if (error) {
       toast.error("Erro na pesquisa");
     } else {
       setSearchResults(data || []);
     }
     setIsSearching(false);
   };
 
   const handleSendRequest = async (receiverId: string) => {
     const { error } = await sendFriendRequest(receiverId);
     if (error) {
       toast.error("Erro ao enviar pedido");
     } else {
       toast.success("Pedido enviado!");
       setSearchResults((prev) => prev.filter((p) => p.id !== receiverId));
     }
   };
 
   const handleAcceptRequest = async (requestId: string) => {
     const { error } = await acceptFriendRequest(requestId);
     if (error) {
       toast.error("Erro ao aceitar pedido");
     } else {
       toast.success("Amigo adicionado!");
     }
   };
 
   const handleRejectRequest = async (requestId: string) => {
     const { error } = await rejectFriendRequest(requestId);
     if (error) {
       toast.error("Erro ao rejeitar pedido");
     } else {
       toast.success("Pedido rejeitado");
     }
   };
 
   const handleCancelRequest = async (requestId: string) => {
     const { error } = await cancelFriendRequest(requestId);
     if (error) {
       toast.error("Erro ao cancelar pedido");
     } else {
       toast.success("Pedido cancelado");
     }
   };
 
   const handleRemoveFriend = async (friendId: string) => {
     const { error } = await removeFriend(friendId);
     if (error) {
       toast.error("Erro ao remover amigo");
     } else {
       toast.success("Amigo removido");
     }
   };
 
   return (
     <div className="min-h-screen bg-[#1a1410] text-white">
       {/* Navigation */}
       <nav className="border-b border-white/10 bg-black/40 backdrop-blur-sm sticky top-0 z-50">
         <div className="max-w-7xl mx-auto px-8 h-16 flex items-center justify-between">
           <Link to="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
             <FontAwesomeIcon
               icon={faScrewdriverWrench}
               className="h-9 w-9"
               style={{ color: "#d4823b" }}
             />
             <div className="flex flex-col">
               <span className="text-lg font-black uppercase tracking-tight text-foreground" style={{ fontFamily: 'Impact, "Arial Black", sans-serif' }}>DST Tools</span>
             </div>
           </Link>
           <Link to="/">
             <Button variant="ghost" size="sm" className="relative gap-2 rounded-full px-4 py-2 text-sm font-semibold uppercase tracking-wide text-white/80 hover:text-white hover:bg-[#d4823b] transition-colors">
               <span className="absolute inset-0 rounded-full bg-gradient-to-r from-[#d4823b]/20 to-transparent opacity-0 transition-opacity duration-300 hover:opacity-100" />
               <span className="relative flex items-center gap-2">
                 <ArrowLeft className="h-4 w-4" />
                 Voltar
               </span>
             </Button>
           </Link>
         </div>
       </nav>

       {/* Profile Header */}
       <div className="border-b border-white/10 bg-black/20"
         style={profile?.banner_url ? { 
           backgroundImage: `linear-gradient(rgba(26, 20, 16, 0.8), rgba(26, 20, 16, 0.9)), url(${profile.banner_url})`, 
           backgroundSize: "cover", 
           backgroundPosition: "center" 
         } : {}}
       >
         <div className="max-w-[1200px] mx-auto px-8 py-12">
           <div className="flex items-center gap-6">
             <Avatar className="h-32 w-32 border-4 border-[#d4823b] shadow-2xl flex-shrink-0">
               <AvatarImage src={profile?.avatar_url || undefined} />
               <AvatarFallback className="text-4xl bg-[#d4823b] text-white font-black" style={{ fontFamily: 'Impact, "Arial Black", sans-serif' }}>
                 {profile?.display_name?.[0]?.toUpperCase() || "U"}
               </AvatarFallback>
             </Avatar>
             <div className="flex-1">
               <div className="flex items-start justify-between gap-4">
                 <div>
                   <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tighter mb-2" style={{ fontFamily: 'Impact, "Arial Black", sans-serif' }}>
                     {profile?.display_name || "Utilizador"}
                   </h1>
                   <p className="text-lg text-white/70">{profile?.bio || "Sem descrição"}</p>
                 </div>
                 <Badge 
                   variant={profile?.is_private ? "secondary" : "default"} 
                   className="gap-2 px-4 py-2 text-sm bg-black/60 border border-white/20 text-white"
                 >
                   {profile?.is_private ? <Lock className="h-4 w-4" /> : <Globe className="h-4 w-4" />}
                   {profile?.is_private ? "Privado" : "Público"}
                 </Badge>
               </div>
             </div>
           </div>
         </div>
       </div>

       {/* Content */}
       <div className="max-w-[1200px] mx-auto px-8 py-12">
         <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
           <TabsList className="grid w-full grid-cols-3 p-1 bg-black/40 border border-white/10">
             <TabsTrigger 
               value="workspaces" 
               className="gap-2 data-[state=active]:bg-[#d4823b] data-[state=active]:text-white uppercase font-bold tracking-wide"
             >
               <FontAwesomeIcon icon={faScrewdriverWrench} className="h-4 w-4" />
               Workspaces
             </TabsTrigger>
             <TabsTrigger 
               value="social" 
               className="gap-2 data-[state=active]:bg-[#d4823b] data-[state=active]:text-white uppercase font-bold tracking-wide"
             >
               <Users className="h-4 w-4" />
               Social
             </TabsTrigger>
             <TabsTrigger 
               value="customize" 
               className="gap-2 data-[state=active]:bg-[#d4823b] data-[state=active]:text-white uppercase font-bold tracking-wide"
             >
               <Palette className="h-4 w-4" />
               Personalizar
             </TabsTrigger>
           </TabsList>
 
           {/* Workspaces Tab */}
           <TabsContent value="workspaces" className="mt-8">
             <div className="bg-black/40 border border-white/10 rounded-lg p-8">
               <div className="mb-6">
                 <h2 className="text-2xl font-black uppercase tracking-tight mb-2" style={{ fontFamily: 'Impact, "Arial Black", sans-serif' }}>Os teus Workspaces</h2>
                 <p className="text-white/60">Gere os teus planos de base e a sua visibilidade</p>
               </div>
                 {workspacesLoading ? (
                   <div className="text-center py-12 text-white/60">A carregar...</div>
                 ) : workspaces.length === 0 ? (
                   <div className="text-center py-12 text-white/60">
                     Ainda não tens workspaces. Cria um na página principal!
                   </div>
                 ) : (
                   <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                     {workspaces.map((workspace) => (
                       <WorkspacePreview
                         key={workspace.id}
                         workspace={workspace}
                         onToggleVisibility={handleToggleWorkspaceVisibility}
                         onDelete={handleDeleteWorkspace}
                         onClick={(ws) => {
                           localStorage.setItem("dst-planner-current-workspace", ws.id);
                           navigate("/");
                         }}
                       />
                     ))}
                   </div>
                 )}
             </div>
           </TabsContent>

           {/* Social Tab */}
           <TabsContent value="social" className="mt-8 space-y-6">
             {/* Search Users */}
             <div className="bg-black/40 border border-white/10 rounded-lg p-8">
               <div className="mb-6">
                 <h2 className="text-2xl font-black uppercase tracking-tight mb-2" style={{ fontFamily: 'Impact, "Arial Black", sans-serif' }}>Procurar Utilizadores</h2>
                 <p className="text-white/60">Encontra outros jogadores para adicionar</p>
               </div>
                 <div className="flex gap-2">
                   <Input
                     placeholder="Procurar por nome..."
                     value={searchQuery}
                     onChange={(e) => setSearchQuery(e.target.value)}
                     onKeyDown={(e) => e.key === "Enter" && handleSearchUsers()}
                     className="bg-black/60 border-white/20 text-white placeholder:text-white/40"
                   />
                   <Button 
                     onClick={handleSearchUsers} 
                     disabled={isSearching}
                     className="bg-[#d4823b] hover:bg-[#b56f2f] text-white font-bold uppercase"
                   >
                     {isSearching ? "A procurar..." : "Procurar"}
                   </Button>
                 </div>
                 {searchResults.length > 0 && (
                   <div className="mt-6 space-y-3">
                     {searchResults.map((result) => (
                       <div key={result.id} className="flex items-center justify-between p-4 rounded-lg bg-black/60 border border-white/10">
                         <div className="flex items-center gap-3">
                           <Avatar className="h-12 w-12 border-2 border-[#d4823b]">
                             <AvatarImage src={result.avatar_url || undefined} />
                             <AvatarFallback className="bg-[#d4823b] text-white font-bold">{result.display_name?.[0]?.toUpperCase() || "U"}</AvatarFallback>
                           </Avatar>
                           <span className="font-bold">{result.display_name}</span>
                         </div>
                         <Button 
                           size="sm" 
                           onClick={() => handleSendRequest(result.id)} 
                           className="gap-2 bg-[#d4823b] hover:bg-[#b56f2f] text-white font-bold uppercase"
                         >
                           <Send className="h-4 w-4" />
                           Adicionar
                         </Button>
                       </div>
                     ))}
                   </div>
                 )}
             </div>
 
             {/* Pending Requests */}
             {pendingRequests.length > 0 && (
               <div className="bg-black/40 border border-white/10 rounded-lg p-8">
                 <div className="mb-6">
                   <h2 className="text-2xl font-black uppercase tracking-tight mb-2" style={{ fontFamily: 'Impact, "Arial Black", sans-serif' }}>Pedidos Recebidos</h2>
                   <p className="text-white/60">{pendingRequests.length} pedido(s) pendente(s)</p>
                 </div>
                 <div className="space-y-3">
                   {pendingRequests.map((request) => (
                     <div key={request.id} className="flex items-center justify-between p-4 rounded-lg bg-black/60 border border-white/10">
                       <div className="flex items-center gap-3">
                         <Avatar className="h-12 w-12 border-2 border-[#d4823b]">
                           <AvatarImage src={request.sender?.avatar_url || undefined} />
                           <AvatarFallback className="bg-[#d4823b] text-white font-bold">{request.sender?.display_name?.[0]?.toUpperCase() || "U"}</AvatarFallback>
                         </Avatar>
                         <span className="font-bold">{request.sender?.display_name}</span>
                       </div>
                       <div className="flex gap-2">
                         <Button size="sm" className="bg-[#d4823b] hover:bg-[#b56f2f]" onClick={() => handleAcceptRequest(request.id)}>
                           <Check className="h-4 w-4" />
                         </Button>
                         <Button size="sm" variant="outline" className="border-white/20 text-white hover:bg-white/10" onClick={() => handleRejectRequest(request.id)}>
                           <X className="h-4 w-4" />
                         </Button>
                       </div>
                     </div>
                   ))}
                 </div>
               </div>
             )}
 
             {/* Sent Requests */}
             {sentRequests.length > 0 && (
               <div className="bg-black/40 border border-white/10 rounded-lg p-8">
                 <div className="mb-6">
                   <h2 className="text-2xl font-black uppercase tracking-tight mb-2" style={{ fontFamily: 'Impact, "Arial Black", sans-serif' }}>Pedidos Enviados</h2>
                   <p className="text-white/60">A aguardar resposta</p>
                 </div>
                 <div className="space-y-3">
                   {sentRequests.map((request) => (
                     <div key={request.id} className="flex items-center justify-between p-4 rounded-lg bg-black/60 border border-white/10">
                       <div className="flex items-center gap-3">
                         <Avatar className="h-12 w-12 border-2 border-[#d4823b]">
                           <AvatarImage src={request.receiver?.avatar_url || undefined} />
                           <AvatarFallback className="bg-[#d4823b] text-white font-bold">{request.receiver?.display_name?.[0]?.toUpperCase() || "U"}</AvatarFallback>
                         </Avatar>
                         <span className="font-bold">{request.receiver?.display_name}</span>
                       </div>
                       <Button size="sm" variant="outline" className="border-white/20 text-white hover:bg-white/10" onClick={() => handleCancelRequest(request.id)}>
                         Cancelar
                       </Button>
                     </div>
                   ))}
                 </div>
               </div>
             )}
 
             {/* Friends List */}
             <div className="bg-black/40 border border-white/10 rounded-lg p-8">
               <div className="mb-6">
                 <h2 className="text-2xl font-black uppercase tracking-tight mb-2" style={{ fontFamily: 'Impact, "Arial Black", sans-serif' }}>Amigos</h2>
                 <p className="text-white/60">{friends.length} amigo(s)</p>
               </div>
                 {friends.length === 0 ? (
                   <div className="text-center py-12 text-white/60">
                     Ainda não tens amigos adicionados
                   </div>
                 ) : (
                   <div className="space-y-3">
                     {friends.map((friend) => (
                       <div key={friend.id} className="flex items-center justify-between p-4 rounded-lg bg-black/60 border border-white/10">
                         <div className="flex items-center gap-3">
                           <Avatar className="h-12 w-12 border-2 border-[#d4823b]">
                             <AvatarImage src={friend.avatar_url || undefined} />
                             <AvatarFallback className="bg-[#d4823b] text-white font-bold">{friend.display_name?.[0]?.toUpperCase() || "U"}</AvatarFallback>
                           </Avatar>
                           <div>
                             <p className="font-bold">{friend.display_name}</p>
                             <p className="text-sm text-white/60">{friend.bio || "Sem bio"}</p>
                           </div>
                         </div>
                         <Button size="sm" variant="ghost" onClick={() => handleRemoveFriend(friend.id)} className="text-red-400 hover:text-red-300 hover:bg-red-400/10">
                           <UserMinus className="h-4 w-4" />
                         </Button>
                       </div>
                     ))}
                   </div>
                 )}
             </div>
           </TabsContent>
 
           {/* Customize Tab */}
           <TabsContent value="customize" className="mt-8">
             <div className="bg-black/40 border border-white/10 rounded-lg p-8">
               <div className="mb-6">
                 <h2 className="text-2xl font-black uppercase tracking-tight mb-2" style={{ fontFamily: 'Impact, "Arial Black", sans-serif' }}>Personalizar Perfil</h2>
                 <p className="text-white/60">Edita a tua informação e aparência</p>
               </div>
               <div className="space-y-6">
                 {/* Privacy Toggle */}
                 <div className="flex items-center justify-between p-4 rounded-lg bg-black/60 border border-white/10">
                   <div className="space-y-0.5">
                     <Label className="text-white font-bold">Perfil Privado</Label>
                     <p className="text-sm text-white/60">
                       Apenas amigos podem ver o teu perfil e workspaces
                     </p>
                   </div>
                   <Switch
                     checked={profile?.is_private || false}
                     onCheckedChange={(checked) => {
                       handleTogglePrivacy();
                     }}
                   />
                 </div>
 
                 <Separator className="bg-white/10" />
 
                 {isEditing ? (
                   <div className="space-y-6">
                     <div className="space-y-2">
                       <Label className="text-white font-bold">Avatar</Label>
                       <ImageUpload
                         userId={user.id}
                         currentUrl={avatarUrl}
                         onUpload={setAvatarUrl}
                         type="avatar"
                         fallbackText={displayName?.[0]?.toUpperCase() || "U"}
                       />
                     </div>
                     <div className="space-y-2">
                       <Label className="text-white font-bold">Banner</Label>
                       <ImageUpload
                         userId={user.id}
                         currentUrl={bannerUrl}
                         onUpload={setBannerUrl}
                         type="banner"
                       />
                     </div>
                     <div className="space-y-2">
                       <Label htmlFor="display-name" className="text-white font-bold">Nome de Exibição</Label>
                       <Input
                         id="display-name"
                         value={displayName}
                         onChange={(e) => setDisplayName(e.target.value)}
                         placeholder="O teu nome"
                         className="bg-black/60 border-white/20 text-white placeholder:text-white/40"
                       />
                     </div>
                     <div className="space-y-2">
                       <div className="flex items-center justify-between">
                         <Label htmlFor="bio" className="text-white font-bold">Bio</Label>
                         <Button
                           type="button"
                           variant="ghost"
                           size="sm"
                           onClick={handleGenerateRandomBio}
                           className="gap-1.5 text-xs h-7 text-[#d4823b] hover:text-[#b56f2f] hover:bg-white/10"
                         >
                           <Sparkles className="h-3 w-3" />
                           Bio aleatória
                         </Button>
                       </div>
                       <Textarea
                         id="bio"
                         value={bio}
                         onChange={(e) => setBio(e.target.value)}
                         placeholder="Uma breve descrição sobre ti..."
                         rows={2}
                         className="bg-black/60 border-white/20 text-white placeholder:text-white/40"
                       />
                     </div>
                     <div className="flex gap-2">
                       <Button onClick={handleSaveProfile} className="bg-[#d4823b] hover:bg-[#b56f2f] text-white font-bold uppercase">Guardar</Button>
                       <Button variant="outline" onClick={() => setIsEditing(false)} className="border-white/20 text-white hover:bg-white/10">Cancelar</Button>
                     </div>
                   </div>
                 ) : (
                   <div className="space-y-6">
                     <div className="grid grid-cols-2 gap-6 p-4 rounded-lg bg-black/60 border border-white/10">
                       <div>
                         <Label className="text-white/60 text-sm">Nome</Label>
                         <p className="font-bold text-lg">{profile?.display_name || "-"}</p>
                       </div>
                       <div>
                         <Label className="text-white/60 text-sm">Bio</Label>
                         <p className="font-bold text-lg">{profile?.bio || "-"}</p>
                       </div>
                     </div>
                     <Button onClick={handleStartEdit} className="bg-[#d4823b] hover:bg-[#b56f2f] text-white font-bold uppercase">Editar Perfil</Button>
                   </div>
                 )}
               </div>
             </div>
           </TabsContent>
         </Tabs>
       </div>
     </div>
   );
 }