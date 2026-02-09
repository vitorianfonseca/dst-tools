import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Display helpful instructions for developers
console.log(
    "%c🔧 DST Tools - Developer Info",
    "background: #1a1a1a; color: #00ff00; font-size: 16px; font-weight: bold; padding: 10px;"
);
console.log(
    "%c🔐 Neon Auth ATIVO - Autenticação real configurada!",
    "color: #00ff00; font-size: 14px; font-weight: bold;"
);
console.log(
    "%cAuth URL: " + import.meta.env.VITE_NEON_AUTH_URL,
    "color: #888; font-size: 12px;"
);

console.log(
    "\n%cSe tiver problemas após atualização:",
    "color: #ffaa00; font-size: 14px; margin-top: 10px;"
);
console.log(
    "%clocalStorage.clear(); location.reload();",
    "background: #2a2a2a; color: #00ffff; font-size: 14px; padding: 5px; border-radius: 3px;"
);

console.log(
    "\n%cPara testar autenticação:",
    "color: #ffaa00; font-size: 14px;"
);
console.log(
    "%c1. Cria conta em /auth\n2. Verifica neon_auth.user no Neon Console\n3. Login com email/password",
    "color: #888; font-size: 12px;"
);

createRoot(document.getElementById("root")!).render(<App />);
