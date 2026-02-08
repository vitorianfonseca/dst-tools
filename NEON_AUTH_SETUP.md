# Neon Auth Integration - DST Tools

## ✅ Neon Auth Configurado

O projeto agora usa **Neon Auth** real com autenticação gerida!

### 🔐 Credenciais

- **Auth URL:** `https://ep-fancy-rice-ag30jzj9.neonauth.c-2.eu-central-1.aws.neon.build/neondb/auth`
- **Endpoint ID:** `ep-fancy-rice-ag30jzj9`
- **Database:** `neondb`

### 🎯 Funcionalidades Ativas

- ✅ **Email/Password Authentication** (enabled)
- ✅ **Google OAuth** (shared provider)
- ✅ **Auto Sign-in** após verificação
- ✅ **Localhost** permitido
- ✅ **Signup** ativado

### 🚀 Como Testar

1. **Limpar dados locais antigos:**
   ```javascript
   // No console do navegador (F12)
   localStorage.clear();
   location.reload();
   ```

2. **Criar Nova Conta:**
   - Vai para `/auth`
   - Usa o tab "Sign Up"
   - Email: `test@example.com`
   - Password: `Test123!@#`
   - Nome: `Test User`

3. **Verificar no Banco:**
   ```bash
   npx tsx scripts/check-neon-auth.ts
   ```

4. **Ver Utilizadores:**
   - Abre Neon Console
   - Database Studio
   - Schema: `neon_auth`
   - Tabela: `user`

### 📊 Estrutura

**neon_auth.user** - Utilizadores registados
- `id` (UUID)
- `email` (único)
- `name`
- `emailVerified`
- `image`
- `createdAt`, `updatedAt`

**neon_auth.session** - Sessões ativas
- `id`
- `userId`
- `token`
- `expiresAt`

**public.profiles** - Perfis da aplicação
- `id` (UUID) - mesmo que neon_auth.user.id
- `email` (único)
- `display_name`
- `avatar_url`
- `bio`
- `banner_url`
- `is_private`

### 🔄 Fluxo de Autenticação

1. Utilizador regista-se → cria entrada em `neon_auth.user`
2. Login bem-sucedido → cria sessão em `neon_auth.session`
3. AuthContext sincroniza → cria perfil em `public.profiles`
4. Aplicação usa perfil personalizado com dados do neon_auth

### 🛠️ Scripts Úteis

```bash
# Ver configuração do Neon Auth
npx tsx scripts/check-neon-auth.ts

# Limpar perfis duplicados
npm run db:cleanup

# Aplicar migrações
npm run migrate
```

### 🔍 Debugging

**Console do navegador mostra:**
- Auth client inicialização
- Erros de autenticação
- Estado da sessão

**Verificar erros:**
```javascript
// No console
authClient.getSession().then(console.log)
```

### 📝 Diferenças vs Sistema Anterior

| Antes | Agora |
|-------|-------|
| IDs aleatórios | IDs do Neon Auth |
| localStorage | Sessões no servidor |
| Sem passwords | Passwords seguras (hashed) |
| Sem OAuth | Google OAuth ready |
| Perfis duplicados | Único por email |

### ⚠️ Notas Importantes

1. **Limpar localStorage** após atualização
2. **Passwords** devem ter mínimo 8 caracteres
3. **Emails** devem ser válidos e únicos
4. **Sessões** expiram automaticamente
5. **Perfis** são criados automaticamente após login

### 🎨 UI Components (Opcional)

Se quiseres usar os componentes de UI prontos:

```typescript
import { NeonAuthUIProvider } from "@neondatabase/auth/react/ui";
import "@neondatabase/auth/ui/css";
```

Mas a integração atual usa o AuthContext customizado para manter a UI existente.
