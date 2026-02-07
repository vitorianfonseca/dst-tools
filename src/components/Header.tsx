import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faScrewdriverWrench } from "@fortawesome/free-solid-svg-icons";
import { UserMenu } from "./UserMenu";
import { Link } from "react-router-dom";
import { WorkspaceSelector } from "./WorkspaceSelector";
import { Workspace } from "@/hooks/useWorkspaces";
import { ReactNode } from "react";
import { Eye, Copy, Loader2, Undo2, Redo2 } from "lucide-react";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { KeyboardShortcutsDialog } from "./KeyboardShortcutsDialog";
import { ShortcutAction } from "@/hooks/useKeyboardShortcuts";
 
interface HeaderProps {
  currentWorkspace: Workspace | null;
  onWorkspaceChange: (workspace: Workspace) => void;
  syncIndicator?: ReactNode;
  isReadOnly?: boolean;
  ownerName?: string;
  onDuplicate?: () => Promise<void>;
  isDuplicating?: boolean;
  onUndo?: () => void;
  onRedo?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
  shortcuts?: ShortcutAction[];
}

export function Header({ 
  currentWorkspace, 
  onWorkspaceChange, 
  syncIndicator, 
  isReadOnly, 
  ownerName, 
  onDuplicate, 
  isDuplicating,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  shortcuts = [],
}: HeaderProps) {
   return (
     <header className="h-16 border-b border-border bg-card flex items-center justify-between px-4 shrink-0">
       <Link to="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
         <FontAwesomeIcon
           icon={faScrewdriverWrench}
           className="h-9 w-9"
           style={{ color: "#d4823b" }}
         />
         <div className="flex flex-col">
           <span className="text-lg font-black uppercase tracking-tight text-foreground" style={{ fontFamily: 'Impact, "Arial Black", sans-serif' }}>DST Tools</span>
           <span className="text-xs text-muted-foreground font-medium">Plan your survival</span>
         </div>
       </Link>
 
        <div className="flex items-center gap-2">
          {isReadOnly && (
           <>
             <Badge variant="secondary" className="gap-1.5 text-xs">
               <Eye className="h-3 w-3" />
               View Only {ownerName ? `• ${ownerName}` : ""}
             </Badge>
             {onDuplicate && (
               <Button
                 variant="outline"
                 size="sm"
                 className="h-8 gap-1.5 text-xs"
                 onClick={onDuplicate}
                 disabled={isDuplicating}
               >
                 {isDuplicating ? (
                   <Loader2 className="h-3 w-3 animate-spin" />
                 ) : (
                   <Copy className="h-3 w-3" />
                 )}
                 Duplicar para mim
               </Button>
             )}
           </>
          )}
          {!isReadOnly && (
            <div className="flex items-center gap-1 border-r border-border pr-2 mr-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={onUndo}
                disabled={!canUndo}
                title="Desfazer (Ctrl+Z)"
              >
                <Undo2 className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={onRedo}
                disabled={!canRedo}
                title="Refazer (Ctrl+Shift+Z)"
              >
                <Redo2 className="h-4 w-4" />
              </Button>
            </div>
          )}
          {shortcuts.length > 0 && <KeyboardShortcutsDialog shortcuts={shortcuts} />}
          {syncIndicator}
          <WorkspaceSelector
            currentWorkspace={currentWorkspace}
            onWorkspaceChange={onWorkspaceChange}
          />
          <UserMenu />
        </div>
      </header>
    );
  }