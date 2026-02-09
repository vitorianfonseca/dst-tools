# Sistema de Autenticação - DST Tools

## Status Atual

✅ **Autenticação Local implementada** (baseada em localStorage)
🔄 **Neon Auth provisionado** (pronto para integração futura)

## Como Funciona Atualmente

### Autenticação Local
- O sistema usa localStorage para guardar dados de sessão
- Cada email gera um ID único e consistente
- Os dados são sincronizados com a base de dados PostgreSQL no Neon

### Estrutura de Dados

**Tabela `profiles`:**
- `id` (UUID) - ID único do utilizador
- `email` (TEXT, UNIQUE) - Email do utilizador
- `display_name` (TEXT) - Nome de exibição
- `avatar_url`, `bio`, `banner_url` - Dados do perfil
- `is_private` (BOOLEAN) - Perfil privado ou público
- `created_at`, `updated_at` - Timestamps

## Resolver Problemas Comuns

### Perfis Duplicados

Se você criou perfis duplicados, use um dos métodos abaixo:

**Método 1: Limpar localStorage (Frontend)**
```javascript
// No console do navegador (F12)
localStorage.clear();
location.reload();
```

**Método 2: Limpar base de dados (Backend)**
```bash
# No terminal
npm run db:cleanup
```

### Regenerar Dados com ID Consistente

Depois de limpar o localStorage:
1. Faça login novamente com o mesmo email
2. O sistema gerará o mesmo ID baseado no email
3. Os dados serão sincronizados com a base de dados

## Scripts Disponíveis

```bash
# Limpar perfis duplicados na base de dados
npm run db:cleanup

# Aplicar migrações
npm run migrate

# Iniciar servidor de desenvolvimento
npm run dev
```

## Próximos Passos: Integrar Neon Auth

O Neon Auth já está provisionado e pronto para uso. Para integrar:

1. **Instalar dependências:**
```bash
npm install @neondatabase/auth better-auth
```

2. **Configurar Better Auth** com o Neon Auth endpoint

3. **Substituir** o sistema local pelo Neon Auth

## Estrutura Técnica

### Geração de ID Consistente

O sistema usa um hash do email para gerar IDs consistentes:
- Mesmo email = Mesmo ID
- Previne duplicatas
- Compatível com UUID format

```typescript
// src/lib/localData.ts
function generateConsistentId(email: string): string {
  // Gera UUID baseado em hash do email
}
```

### API Endpoints

- `GET /api/profiles/:id` - Buscar perfil
- `PUT /api/profiles/:id` - Criar/atualizar perfil
- Validação de email único
- Suporte a conflitos (409)

## Segurança

⚠️ **Nota Importante:** 
O sistema atual é adequado para desenvolvimento local. Para produção, recomenda-se:

1. ✅ Migrar para Neon Auth (autenticação real)
2. ✅ Adicionar validação de tokens JWT
3. ✅ Implementar rate limiting
4. ✅ Usar HTTPS em produção

## Support

Se encontrar problemas:
1. Verifique o console do navegador (F12)
2. Execute `npm run db:cleanup` se houver duplicatas
3. Limpe o localStorage: `localStorage.clear()`
