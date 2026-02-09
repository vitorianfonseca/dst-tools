#!/usr/bin/env node
/**
 * Test Neon Auth Integration
 * 
 * Este script testa se o Neon Auth está a funcionar corretamente.
 */

const authUrl = process.env.VITE_NEON_AUTH_URL || 'https://ep-fancy-rice-ag30jzj9.neonauth.c-2.eu-central-1.aws.neon.build/neondb/auth';

console.log('\n🔍 Testando Neon Auth...\n');

async function testAuth() {
    try {
        // Test 1: Check if auth endpoint is accessible
        console.log('1️⃣  Verificando endpoint do Auth...');
        const response = await fetch(`${authUrl}/.well-known/openid-configuration`);

        if (response.ok) {
            console.log('   ✅ Endpoint acessível!');
            const config = await response.json();
            console.log(`   📋 Issuer: ${config.issuer}`);
        } else {
            console.log(`   ❌ Endpoint retornou ${response.status}`);
            return;
        }

        // Test 2: Check JWKS endpoint
        console.log('\n2️⃣  Verificando JWKS...');
        const jwksResponse = await fetch(`${authUrl}/.well-known/jwks.json`);

        if (jwksResponse.ok) {
            const jwks = await jwksResponse.json();
            console.log(`   ✅ JWKS configurado com ${jwks.keys?.length || 0} keys`);
        } else {
            console.log(`   ⚠️  JWKS não disponível (${jwksResponse.status})`);
        }

        console.log('\n✅ Neon Auth está configurado e acessível!');
        console.log('\n📝 Próximos passos:');
        console.log('   1. Reinicia o servidor de desenvolvimento');
        console.log('   2. Limpa o localStorage no navegador');
        console.log('   3. Vai para /auth e cria uma conta');
        console.log('   4. Verifica neon_auth.user no Neon Console\n');

    } catch (error) {
        console.error('\n❌ Erro ao testar Neon Auth:', error.message);
        console.log('\n💡 Dicas:');
        console.log('   - Verifica se o VITE_NEON_AUTH_URL está correto no .env');
        console.log('   - Verifica a conexão à internet');
        console.log('   - Verifica se o projeto Neon está ativo\n');
    }
}

testAuth();
