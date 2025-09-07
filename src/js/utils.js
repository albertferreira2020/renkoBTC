// Utilitários e configurações adicionais para o gráfico Renko

// Configurações predefinidas para diferentes timeframes de Renko
const RENKO_PRESETS = {
    SCALPING: { blockSize: 5, name: 'Scalping ($5)' },
    INTRADAY: { blockSize: 10, name: 'Intraday ($10)' },
    SWING: { blockSize: 25, name: 'Swing ($25)' },
    POSITION: { blockSize: 50, name: 'Position ($50)' }
};

// Pares de trading disponíveis na Binance
const TRADING_PAIRS = {
    BTCUSDT: { symbol: 'btcusdt', name: 'Bitcoin/USDT', decimals: 2 },
    ETHUSDT: { symbol: 'ethusdt', name: 'Ethereum/USDT', decimals: 2 },
    BNBUSDT: { symbol: 'bnbusdt', name: 'BNB/USDT', decimals: 2 },
    ADAUSDT: { symbol: 'adausdt', name: 'Cardano/USDT', decimals: 4 },
    SOLUSDT: { symbol: 'solusdt', name: 'Solana/USDT', decimals: 2 }
};

// Temas de cores para o gráfico
const CHART_THEMES = {
    DARK: {
        background: '#0d1421',
        textColor: '#d1d4dc',
        gridColor: 'rgba(197, 203, 206, 0.1)',
        upColor: '#0ecb81',
        downColor: '#f6465d'
    },
    LIGHT: {
        background: '#ffffff',
        textColor: '#333333',
        gridColor: 'rgba(0, 0, 0, 0.1)',
        upColor: '#26a69a',
        downColor: '#ef5350'
    },
    CLASSIC: {
        background: '#1e1e1e',
        textColor: '#ffffff',
        gridColor: 'rgba(255, 255, 255, 0.1)',
        upColor: '#00ff00',
        downColor: '#ff0000'
    }
};

// Classe para gerenciar sons de notificação
class SoundManager {
    constructor() {
        this.audioContext = null;
        this.sounds = new Map();
        this.isEnabled = false;
        this.init();
    }

    async init() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            this.isEnabled = true;
        } catch (error) {
            console.warn('Audio context não disponível:', error);
        }
    }

    // Criar som de bloco verde (tom mais alto)
    createGreenBlockSound() {
        if (!this.isEnabled) return;

        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);

        oscillator.frequency.setValueAtTime(800, this.audioContext.currentTime);
        oscillator.type = 'sine';

        gainNode.gain.setValueAtTime(0.1, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.2);

        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + 0.2);
    }

    // Criar som de bloco vermelho (tom mais baixo)
    createRedBlockSound() {
        if (!this.isEnabled) return;

        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);

        oscillator.frequency.setValueAtTime(400, this.audioContext.currentTime);
        oscillator.type = 'sine';

        gainNode.gain.setValueAtTime(0.1, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.3);

        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + 0.3);
    }
}

// Classe para calcular indicadores técnicos adicionais
class TechnicalIndicators {
    constructor() {
        this.priceHistory = [];
    }

    addPrice(price) {
        this.priceHistory.push(price);

        // Manter apenas os últimos 200 preços para performance
        if (this.priceHistory.length > 200) {
            this.priceHistory.shift();
        }
    }

    // Calcular média móvel simples
    calculateSMA(period = 20) {
        if (this.priceHistory.length < period) return null;

        const slice = this.priceHistory.slice(-period);
        const sum = slice.reduce((acc, price) => acc + price, 0);
        return sum / period;
    }

    // Calcular volatilidade
    calculateVolatility(period = 20) {
        if (this.priceHistory.length < period) return null;

        const slice = this.priceHistory.slice(-period);
        const mean = slice.reduce((acc, price) => acc + price, 0) / period;

        const variance = slice.reduce((acc, price) => {
            return acc + Math.pow(price - mean, 2);
        }, 0) / period;

        return Math.sqrt(variance);
    }

    // Detectar tendência baseada nos últimos blocos
    detectTrend(blocks, period = 10) {
        if (blocks.length < period) return 'NEUTRO';

        const recentBlocks = blocks.slice(-period);
        const greenCount = recentBlocks.filter(block => block.isGreen).length;
        const redCount = period - greenCount;

        if (greenCount > redCount * 1.5) return 'ALTA FORTE';
        if (greenCount > redCount) return 'ALTA';
        if (redCount > greenCount * 1.5) return 'BAIXA FORTE';
        if (redCount > greenCount) return 'BAIXA';

        return 'NEUTRO';
    }
}

// Classe para persistir dados localmente
class DataPersistence {
    constructor() {
        this.storageKey = 'renko_chart_data';
    }

    // Salvar configurações do usuário
    saveSettings(settings) {
        try {
            localStorage.setItem(`${this.storageKey}_settings`, JSON.stringify(settings));
        } catch (error) {
            console.warn('Erro ao salvar configurações:', error);
        }
    }

    // Carregar configurações do usuário
    loadSettings() {
        try {
            const saved = localStorage.getItem(`${this.storageKey}_settings`);
            return saved ? JSON.parse(saved) : null;
        } catch (error) {
            console.warn('Erro ao carregar configurações:', error);
            return null;
        }
    }

    // Salvar histórico de blocos (últimos 1000)
    saveBlockHistory(blocks) {
        try {
            const limited = blocks.slice(-1000); // Manter apenas os últimos 1000 blocos
            localStorage.setItem(`${this.storageKey}_blocks`, JSON.stringify(limited));
        } catch (error) {
            console.warn('Erro ao salvar histórico:', error);
        }
    }

    // Carregar histórico de blocos
    loadBlockHistory() {
        try {
            const saved = localStorage.getItem(`${this.storageKey}_blocks`);
            return saved ? JSON.parse(saved) : [];
        } catch (error) {
            console.warn('Erro ao carregar histórico:', error);
            return [];
        }
    }

    // Limpar todos os dados salvos
    clearAllData() {
        try {
            localStorage.removeItem(`${this.storageKey}_settings`);
            localStorage.removeItem(`${this.storageKey}_blocks`);
        } catch (error) {
            console.warn('Erro ao limpar dados:', error);
        }
    }
}

// Classe para calcular o indicador RSI (Relative Strength Index)
class RSICalculator {
    constructor(period = 14) {
        this.period = period;
        this.prices = [];
        this.gains = [];
        this.losses = [];
        this.avgGain = 0;
        this.avgLoss = 0;
        this.rsiValues = [];
    }

    // Adiciona um novo preço e calcula o RSI
    addPrice(price) {
        this.prices.push(price);

        // Calcular mudança de preço
        if (this.prices.length >= 2) {
            const change = price - this.prices[this.prices.length - 2];
            const gain = change > 0 ? change : 0;
            const loss = change < 0 ? Math.abs(change) : 0;

            this.gains.push(gain);
            this.losses.push(loss);

            // Calcular RSI quando temos dados suficientes
            if (this.gains.length >= this.period) {
                this.calculateRSI();
            }
        }

        // Manter apenas os dados necessários
        if (this.prices.length > this.period + 10) {
            this.prices.shift();
            this.gains.shift();
            this.losses.shift();
        }

        return this.getCurrentRSI();
    }

    calculateRSI() {
        if (this.gains.length < this.period) {
            return;
        }

        // Primeira média simples
        if (this.avgGain === 0 && this.avgLoss === 0) {
            const recentGains = this.gains.slice(-this.period);
            const recentLosses = this.losses.slice(-this.period);

            this.avgGain = recentGains.reduce((sum, gain) => sum + gain, 0) / this.period;
            this.avgLoss = recentLosses.reduce((sum, loss) => sum + loss, 0) / this.period;
        } else {
            // Média móvel suavizada (EMA)
            const alpha = 1 / this.period;
            this.avgGain = (this.avgGain * (this.period - 1) + this.gains[this.gains.length - 1]) / this.period;
            this.avgLoss = (this.avgLoss * (this.period - 1) + this.losses[this.losses.length - 1]) / this.period;
        }

        // Calcular RS e RSI
        const rs = this.avgLoss === 0 ? 100 : this.avgGain / this.avgLoss;
        const rsi = 100 - (100 / (1 + rs));

        this.rsiValues.push(rsi);

        // Manter apenas os últimos 100 valores
        if (this.rsiValues.length > 100) {
            this.rsiValues.shift();
        }
    }

    getCurrentRSI() {
        return this.rsiValues.length > 0 ? this.rsiValues[this.rsiValues.length - 1] : null;
    }

    getRSILevel() {
        const rsi = this.getCurrentRSI();
        if (!rsi) return 'INDEFINIDO';

        if (rsi >= 70) return 'SOBRECOMPRADO';
        if (rsi <= 30) return 'SOBREVENDIDO';
        return 'NEUTRO';
    }

    getRSIHistory() {
        return [...this.rsiValues];
    }

    reset() {
        this.prices = [];
        this.gains = [];
        this.losses = [];
        this.avgGain = 0;
        this.avgLoss = 0;
        this.rsiValues = [];
    }
}

// Função utilitária para formatar números
const formatPrice = (price, decimals = 2) => {
    return price.toLocaleString('pt-BR', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
    });
};

// Função utilitária para formatar porcentagem
const formatPercentage = (value, decimals = 2) => {
    const sign = value >= 0 ? '+' : '';
    return `${sign}${value.toFixed(decimals)}%`;
};

// Função utilitária para calcular diferença de tempo
const formatTimeDifference = (timestamp) => {
    const now = Date.now();
    const diff = now - timestamp;

    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
};

// Função para detectar dispositivo móvel
const isMobileDevice = () => {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
};

// Função para validar conexão WebSocket
const isWebSocketSupported = () => {
    return 'WebSocket' in window && window.WebSocket.CLOSING === 2;
};

// Expor as classes e funções globalmente para uso no frontend
window.RSICalculator = RSICalculator;
window.RENKO_PRESETS = RENKO_PRESETS;
window.TRADING_PAIRS = TRADING_PAIRS;
window.CHART_THEMES = CHART_THEMES;
window.SoundManager = SoundManager;
window.TechnicalIndicators = TechnicalIndicators;
window.DataPersistence = DataPersistence;
window.formatPrice = formatPrice;
window.formatPercentage = formatPercentage;
window.formatTimeDifference = formatTimeDifference;
window.isMobileDevice = isMobileDevice;
window.isWebSocketSupported = isWebSocketSupported;
