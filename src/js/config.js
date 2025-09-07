// Configuração simplificada para banco PostgreSQL
class Config {
    constructor() {
        // Configuração direta do banco PostgreSQL
        this.dbConfig = {
            host: '37.27.214.207',
            port: 5432,
            database: 'btc',
            user: 'postgres',
            password: 'xxxx'
        };

        // URL base para API (se houver uma API REST disponível)
        this.apiBaseUrl = null;
        console.log('✅ Configuração do banco PostgreSQL carregada');
    }

    async loadConfig() {
        // Configuração já carregada no constructor
        return Promise.resolve();
    }

    getDbConfig() {
        return this.dbConfig;
    }

    // Manter compatibilidade com código existente
    getSupabaseUrl() {
        return this.apiBaseUrl;
    }

    getSupabaseKey() {
        return null; // Não usado mais
    }

    isConfigured() {
        return true; // Sempre configurado
    }
}

// Exportar instância global
window.appConfig = new Config();
