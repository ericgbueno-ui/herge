/**
 * INICIALIZAÇÃO DO INTEGRATION CORE
 * Registra todos os providers no sistema
 * Deve ser chamado durante o boot da aplicação
 */

import { initIntegrationCore, getIntegrationCore } from './core';
import { createMetaProvider } from './providers/meta/meta-provider';
import { initTokenManager } from './core/token-manager';
import { getEventBus } from './services/event-bus';

export async function initializeIntegrations(): Promise<void> {
  console.log('🚀 Inicializando Integration Core...');

  try {
    // 1. Inicializa Token Manager
    console.log('📦 Inicializando Token Manager...');
    initTokenManager(process.env.TOKEN_ENCRYPTION_KEY || '');

    // 2. Inicializa Event Bus
    console.log('📦 Inicializando Event Bus...');
    const eventBus = getEventBus();

    // 3. Inicializa Integration Core
    console.log('📦 Inicializando Integration Core...');
    const core = initIntegrationCore(eventBus);

    // 4. Registra providers
    console.log('📦 Registrando Providers...');

    // Meta Provider
    try {
      const metaProvider = createMetaProvider();
      core.registerProvider(metaProvider);
    } catch (error) {
      console.error('❌ Erro ao registrar Meta Provider:', error);
    }

    // Google Provider (TODO)
    // const googleProvider = createGoogleProvider();
    // core.registerProvider(googleProvider);

    // TikTok Provider (TODO)
    // const tiktokProvider = createTikTokProvider();
    // core.registerProvider(tiktokProvider);

    // Shopee Provider (TODO)
    // const shopeeProvider = createShopeeProvider();
    // core.registerProvider(shopeeProvider);

    // 5. Subscreve a eventos importantes
    console.log('📦 Configurando listeners de eventos...');

    eventBus.on('ACCOUNT_CONNECTED', (data) => {
      console.log('✅ Conta conectada:', data);
      // Aqui você pode adicionar lógica adicional
    });

    eventBus.on('SYNC_COMPLETED', (data) => {
      console.log('✅ Sincronização completada:', {
        provider: data.type,
        items: data.result?.itemsSynced,
        duration: `${data.result?.duration}ms`,
      });
    });

    eventBus.on('SYNC_FAILED', (data) => {
      console.error('❌ Sincronização falhou:', {
        provider: data.type,
        error: data.error,
      });
    });

    eventBus.on('ERROR_OCCURRED', (data) => {
      console.error('❌ Erro de integração:', {
        provider: data.type,
        error: data.error,
      });
    });

    // 6. Inicializa workflow engine
    console.log('📦 Inicializando Workflow Engine...');
    await import('@/core/integrations/workflow/workflow-engine');

    // 6. Exibe status
    const status = core.getStatus();
    console.log('✅ Integration Core inicializado com sucesso!');
    console.log('📊 Status:', {
      providers: status.providers.total,
      enabled: status.providers.enabled,
    });

    // 7. Exibe próximos passos
    console.log('\n📝 Próximas implementações:');
    console.log('   ☐ Google Provider');
    console.log('   ☐ TikTok Provider');
    console.log('   ☐ Shopee Provider');
    console.log('   ☐ Sync Jobs (Bull Queue)');
    console.log('   ☐ Webhooks Service');
    console.log('   ☐ Status Dashboard');
  } catch (error) {
    console.error('❌ Erro ao inicializar Integration Core:', error);
    throw error;
  }
}

export function getInitializedCore() {
  return getIntegrationCore();
}
