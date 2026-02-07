 import { useState } from "react";
 import { Navigate } from "react-router-dom";
 import { useAuth } from "@/contexts/AuthContext";
 import { Button } from "@/components/ui/button";
 import { Input } from "@/components/ui/input";
 import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
 import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
 import { Label } from "@/components/ui/label";
 import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
 import { faScrewdriverWrench } from "@fortawesome/free-solid-svg-icons";
 import { Eye, EyeOff } from "lucide-react";
 import { toast } from "sonner";
 
 export default function Auth() {
   const { user, loading, signIn, signUp } = useAuth();
   const [email, setEmail] = useState("");
   const [password, setPassword] = useState("");
   const [displayName, setDisplayName] = useState("");
   const [isSubmitting, setIsSubmitting] = useState(false);
   const [showPassword, setShowPassword] = useState(false);
 
   if (loading) {
     return (
       <div className="min-h-screen flex items-center justify-center bg-background">
         <div className="animate-pulse text-muted-foreground">Loading...</div>
       </div>
     );
   }
 
   if (user) {
     return <Navigate to="/" replace />;
   }
 
   const handleSignIn = async (e: React.FormEvent) => {
     e.preventDefault();
     setIsSubmitting(true);
     const { error } = await signIn(email, password);
     setIsSubmitting(false);
     if (error) {
       toast.error("Error signing in: " + error.message);
     }
   };
 
   const handleSignUp = async (e: React.FormEvent) => {
     e.preventDefault();
     setIsSubmitting(true);
     const { error } = await signUp(email, password, displayName);
     setIsSubmitting(false);
     if (error) {
       toast.error("Error creating account: " + error.message);
     }
     // Auto-login happens automatically with auto-confirm enabled
   };
 
   return (
     <div className="min-h-screen flex items-center justify-center bg-background p-4">
       <Card className="w-full max-w-md">
         <CardHeader className="text-center">
           <div className="flex items-center justify-center gap-2 mb-2">
             <FontAwesomeIcon
               icon={faScrewdriverWrench}
               className="h-8 w-8"
               style={{ color: "#d4823b" }}
             />
            <span className="text-xl font-bold">DST Tools</span>
           </div>
           <CardTitle>Bem-vindo</CardTitle>
           <CardDescription>Entra ou cria uma conta para guardar os teus planos</CardDescription>
         </CardHeader>
         <CardContent>
           <Tabs defaultValue="signin" className="w-full">
             <TabsList className="grid w-full grid-cols-2">
               <TabsTrigger value="signin">Sign In</TabsTrigger>
               <TabsTrigger value="signup">Create Account</TabsTrigger>
             </TabsList>
             <TabsContent value="signin">
               <form onSubmit={handleSignIn} className="space-y-4">
                 <div className="space-y-2">
                   <Label htmlFor="signin-email">Email</Label>
                   <Input
                     id="signin-email"
                     type="email"
                     placeholder="email@exemplo.com"
                     value={email}
                     onChange={(e) => setEmail(e.target.value)}
                     required
                   />
                 </div>
                 <div className="space-y-2">
                   <Label htmlFor="signin-password">Password</Label>
                   <div className="relative">
                     <Input
                       id="signin-password"
                       type={showPassword ? "text" : "password"}
                       placeholder="••••••••"
                       value={password}
                       onChange={(e) => setPassword(e.target.value)}
                       required
                       autoComplete="current-password"
                       className="pr-10"
                     />
                     <Button
                       type="button"
                       variant="ghost"
                       size="icon"
                       className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                       onClick={() => setShowPassword(!showPassword)}
                     >
                       {showPassword ? (
                         <EyeOff className="h-4 w-4 text-muted-foreground" />
                       ) : (
                         <Eye className="h-4 w-4 text-muted-foreground" />
                       )}
                     </Button>
                   </div>
                 </div>
                 <Button type="submit" className="w-full" disabled={isSubmitting}>
                   {isSubmitting ? "A entrar..." : "Entrar"}
                 </Button>
               </form>
             </TabsContent>
             <TabsContent value="signup">
               <form onSubmit={handleSignUp} className="space-y-4">
                 <div className="space-y-2">
                   <Label htmlFor="signup-name">Nome de utilizador</Label>
                   <Input
                     id="signup-name"
                     type="text"
                     placeholder="O teu nome"
                     value={displayName}
                     onChange={(e) => setDisplayName(e.target.value)}
                     autoComplete="name"
                   />
                 </div>
                 <div className="space-y-2">
                   <Label htmlFor="signup-email">Email</Label>
                   <Input
                     id="signup-email"
                     type="email"
                     placeholder="email@exemplo.com"
                     value={email}
                     onChange={(e) => setEmail(e.target.value)}
                     required
                     autoComplete="email"
                   />
                 </div>
                 <div className="space-y-2">
                   <Label htmlFor="signup-password">Password</Label>
                   <div className="relative">
                     <Input
                       id="signup-password"
                       type={showPassword ? "text" : "password"}
                       placeholder="Minimum 6 characters"
                       value={password}
                       onChange={(e) => setPassword(e.target.value)}
                       required
                       minLength={6}
                       autoComplete="new-password"
                       className="pr-10"
                     />
                     <Button
                       type="button"
                       variant="ghost"
                       size="icon"
                       className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                       onClick={() => setShowPassword(!showPassword)}
                     >
                       {showPassword ? (
                         <EyeOff className="h-4 w-4 text-muted-foreground" />
                       ) : (
                         <Eye className="h-4 w-4 text-muted-foreground" />
                       )}
                     </Button>
                   </div>
                 </div>
                 <Button type="submit" className="w-full" disabled={isSubmitting}>
                   {isSubmitting ? "Creating..." : "Create Account"}
                 </Button>
               </form>
             </TabsContent>
           </Tabs>
         </CardContent>
       </Card>
     </div>
   );
 }