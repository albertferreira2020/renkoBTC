// Configuração para carregar variáveis de ambiente
class Config {
    constructor() {
        this.supabaseUrl = null;
        this.supabaseKey = null;
        this.loadConfig();
    }

    async loadConfig() {
        try {
            // Tentar carregar do arquivo .env
            const response = await fetch('.env');
            if (response.ok) {
                const envText = await response.text();
                this.parseEnvFile(envText);
            } else {
                // Fallback para variáveis de ambiente do navegador ou prompt
                this.loadFromPrompt();
            }
        } catch (error) {
            console.warn('Não foi possível carregar .env, usando prompt para configuração');
            this.loadFromPrompt();
        }
    }

    parseEnvFile(envText) {
        const lines = envText.split('\n');
        for (const line of lines) {
            if (line.trim() && !line.startsWith('#')) {
                const [key, value] = line.split('=');
                if (key && value) {
                    switch (key.trim()) {
                        case 'SUPABASE_URL':
                            this.supabaseUrl = value.trim();
                            break;
                        case 'SUPABASE_KEY':
                            this.supabaseKey = value.trim();
                            break;
                    }
                }
            }
        }
        console.log('✅ Configuração carregada do arquivo .env');
    }

    loadFromPrompt() {
        // Se não conseguir carregar do .env, pedir ao usuário
        if (!this.supabaseUrl) {
            this.supabaseUrl = prompt('Digite a URL do Supabase:') || 'http://37.27.214.207:8097/rest/v1';
        }
        if (!this.supabaseKey) {
            this.supabaseKey = prompt('Digite a chave da API do Supabase:') || '';
        }
        console.log('✅ Configuração carregada via prompt');
    }

    getSupabaseUrl() {
        return this.supabaseUrl;
    }

    getSupabaseKey() {
        return this.supabaseKey;
    }

    isConfigured() {
        return this.supabaseUrl && this.supabaseKey;
    }
}

// Exportar instância global
window.appConfig = new Config();
