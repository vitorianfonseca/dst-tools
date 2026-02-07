 import { useState } from "react";
 import { Link, useNavigate } from "react-router-dom";
 import { useAuth } from "@/contexts/AuthContext";
 import { useProfile } from "@/hooks/useProfile";
 import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
 import { Button } from "@/components/ui/button";
 import {
   DropdownMenu,
   DropdownMenuContent,
   DropdownMenuItem,
   DropdownMenuLabel,
   DropdownMenuSeparator,
   DropdownMenuTrigger,
 } from "@/components/ui/dropdown-menu";
 import { User, LogOut, Settings } from "lucide-react";
 
 export function UserMenu() {
   const { user, signOut } = useAuth();
   const { profile } = useProfile();
   const navigate = useNavigate();
 
   if (!user) {
     return (
       <Button variant="outline" size="sm" onClick={() => navigate("/auth")}>
         Entrar
       </Button>
     );
   }
 
   const handleSignOut = async () => {
     await signOut();
     navigate("/auth");
   };
 
   return (
     <DropdownMenu>
       <DropdownMenuTrigger asChild>
         <Button variant="ghost" size="icon" className="rounded-full">
           <Avatar className="h-8 w-8">
             <AvatarImage src={profile?.avatar_url || undefined} />
             <AvatarFallback className="bg-primary text-primary-foreground text-sm">
               {profile?.display_name?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || "U"}
             </AvatarFallback>
           </Avatar>
         </Button>
       </DropdownMenuTrigger>
       <DropdownMenuContent align="end" className="w-56">
         <DropdownMenuLabel>
           <div className="flex flex-col space-y-1">
             <p className="text-sm font-medium">{profile?.display_name || "Utilizador"}</p>
             <p className="text-xs text-muted-foreground truncate">{user.email}</p>
           </div>
         </DropdownMenuLabel>
         <DropdownMenuSeparator />
         <DropdownMenuItem asChild>
           <Link to="/profile" className="cursor-pointer">
             <User className="mr-2 h-4 w-4" />
             Perfil
           </Link>
         </DropdownMenuItem>
         <DropdownMenuSeparator />
         <DropdownMenuItem onClick={handleSignOut} className="text-destructive cursor-pointer">
           <LogOut className="mr-2 h-4 w-4" />
           Sair
         </DropdownMenuItem>
       </DropdownMenuContent>
     </DropdownMenu>
   );
 }