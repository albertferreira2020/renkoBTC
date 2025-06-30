// Gráfico Renko em tempo real usando Lightweight Charts
// A biblioteca já está carregada via script tag no HTML

class RenkoChart {
    constructor() {
        this.chart = null;
        this.candlestickSeries = null;
        this.ws = null;
        this.currentPrice = 0;
        this.blockSize = 10; // Aumentar para $10 para melhor visualização
        this.renkoBlocks = [];
        this.lastBlockPrice = 0;
        this.lastBlockDirection = null; // 'up', 'down', ou null
        this.stats = {
            totalBlocks: 0,
            greenBlocks: 0,
            redBlocks: 0,
            lastDirection: null
        };

        this.init();
    }

    init() {
        // Aguardar um pouco para garantir que o CSS foi aplicado
        setTimeout(() => {
            this.createChart();
            this.setupEventListeners();
            this.connectWebSocket();
        }, 100);
    }

    createChart() {
        const chartContainer = document.getElementById('chart');

        console.log('📊 Criando gráfico...');
        console.log('Chart container element:', chartContainer);
        console.log('Container parent:', chartContainer.parentElement);
        console.log('Container styles:', window.getComputedStyle(chartContainer));
        console.log('Container dimensions:', {
            clientWidth: chartContainer.clientWidth,
            clientHeight: chartContainer.clientHeight,
            offsetWidth: chartContainer.offsetWidth,
            offsetHeight: chartContainer.offsetHeight,
            scrollWidth: chartContainer.scrollWidth,
            scrollHeight: chartContainer.scrollHeight
        });

        if (!chartContainer.clientWidth || !chartContainer.clientHeight) {
            console.warn('⚠️ Container com dimensões inválidas, aguardando...');
            setTimeout(() => this.createChart(), 200);
            return;
        }

        console.log('📦 Tentando criar gráfico com LightweightCharts...');

        try {
            this.chart = LightweightCharts.createChart(chartContainer, {
                width: chartContainer.clientWidth,
                height: chartContainer.clientHeight,
                layout: {
                    background: {
                        color: '#0d1421',
                    },
                    textColor: '#d1d4dc',
                },
                grid: {
                    vertLines: {
                        color: 'rgba(197, 203, 206, 0.1)',
                    },
                    horzLines: {
                        color: 'rgba(197, 203, 206, 0.1)',
                    },
                },
                crosshair: {
                    mode: 1,
                },
                rightPriceScale: {
                    borderColor: 'rgba(197, 203, 206, 0.2)',
                    textColor: '#d1d4dc',
                },
                timeScale: {
                    borderColor: 'rgba(197, 203, 206, 0.2)',
                    textColor: '#d1d4dc',
                    timeVisible: false,
                    secondsVisible: false,
                },
                handleScroll: {
                    mouseWheel: true,
                    pressedMouseMove: true,
                },
                handleScale: {
                    axisPressedMouseMove: true,
                    mouseWheel: true,
                    pinch: true,
                },
            });

            console.log('✅ Gráfico criado com sucesso');
            console.log('Chart object:', this.chart);

            this.candlestickSeries = this.chart.addCandlestickSeries({
                upColor: '#0ecb81',
                downColor: '#f6465d',
                borderDownColor: '#f6465d',
                borderUpColor: '#0ecb81',
                wickDownColor: '#f6465d',
                wickUpColor: '#0ecb81',
            });

            console.log('✅ Série de candlesticks adicionada');

            // Adicionar linha de preço atual
            this.currentPriceLine = this.chart.addLineSeries({
                color: '#f0b90b',
                lineWidth: 2,
                crosshairMarkerVisible: true,
                crosshairMarkerRadius: 6,
                crosshairMarkerBorderColor: '#f0b90b',
                crosshairMarkerBackgroundColor: '#f0b90b',
            });

            console.log('✅ Linha de preço atual adicionada');

            // Dados de teste removidos - aguardando blocos Renko reais da Binance

            // Responsividade
            window.addEventListener('resize', () => {
                this.chart.applyOptions({
                    width: chartContainer.clientWidth,
                    height: chartContainer.clientHeight,
                });
            });

        } catch (error) {
            console.error('❌ Erro ao criar gráfico:', error);
            console.error('Stack trace:', error.stack);
            alert('Erro ao criar o gráfico. Verifique o console para mais detalhes.');
        }
    }

    setupEventListeners() {
        const blockSizeInput = document.getElementById('blockSize');
        const zoomLevelInput = document.getElementById('zoomLevel');

        blockSizeInput.addEventListener('change', (e) => {
            this.blockSize = parseFloat(e.target.value);
            this.resetChart();
        });

        zoomLevelInput.addEventListener('input', (e) => {
            const zoomLevel = parseInt(e.target.value);
            this.chart.timeScale().setVisibleLogicalRange({
                from: Math.max(0, this.renkoBlocks.length - (zoomLevel * 20)),
                to: this.renkoBlocks.length
            });
        });
    }

    connectWebSocket() {
        const wsUrl = 'wss://stream.binance.com:9443/ws/btcusdt@trade';
        this.updateConnectionStatus('Conectando...', false);

        this.ws = new WebSocket(wsUrl);

        this.ws.onopen = () => {
            console.log('WebSocket conectado à Binance');
            this.updateConnectionStatus('Conectado', true);
        };

        this.ws.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                this.processTradeData(data);
            } catch (error) {
                console.error('Erro ao processar dados:', error);
            }
        };

        this.ws.onerror = (error) => {
            console.error('Erro no WebSocket:', error);
            this.updateConnectionStatus('Erro na conexão', false);
        };

        this.ws.onclose = () => {
            console.log('WebSocket desconectado');
            this.updateConnectionStatus('Desconectado', false);

            // Reconectar após 3 segundos
            setTimeout(() => {
                console.log('Tentando reconectar...');
                this.connectWebSocket();
            }, 3000);
        };
    }

    processTradeData(tradeData) {
        const price = parseFloat(tradeData.p);
        console.log(`💹 Novo trade recebido: $${price.toFixed(2)}`);

        this.currentPrice = price;
        this.updatePriceDisplay(price);
        this.updateCurrentPriceLine(price);

        // Processar bloco Renko
        this.processRenkoBlock(price);
    }

    processRenkoBlock(price) {
        // Se é o primeiro preço, definir como base e criar bloco inicial
        if (this.renkoBlocks.length === 0) {
            this.lastBlockPrice = Math.floor(price / this.blockSize) * this.blockSize;
            console.log(`🎯 Preço base definido: $${this.lastBlockPrice.toFixed(2)} (Tamanho bloco: $${this.blockSize})`);

            // Criar o primeiro bloco Renko (neutro) baseado no preço atual
            const currentTime = Date.now() / 1000;
            this.createRenkoBlock(
                this.lastBlockPrice,
                this.lastBlockPrice + this.blockSize,
                true, // Começar com verde
                currentTime
            );
            this.lastBlockPrice += this.blockSize;
            this.lastBlockDirection = 'up';
            this.updateChart();
            this.updateStats();
            return;
        }

        const currentTime = Date.now() / 1000;
        let blocksAdded = false;

        // Calcular a mudança de preço
        const priceChange = price - this.lastBlockPrice;

        console.log(`📊 Verificando: Preço atual: $${price.toFixed(2)}, Último bloco: $${this.lastBlockPrice.toFixed(2)}, Mudança: $${priceChange.toFixed(2)}, Última direção: ${this.lastBlockDirection}`);

        // Lógica de Renko com reversão
        if (this.lastBlockDirection === 'up') {
            // Se o último bloco foi para cima
            if (priceChange >= this.blockSize) {
                // Continua subindo - criar bloco verde
                console.log(`🟢 Continuando ALTA: $${this.lastBlockPrice.toFixed(2)} → $${(this.lastBlockPrice + this.blockSize).toFixed(2)}`);
                this.createRenkoBlock(this.lastBlockPrice, this.lastBlockPrice + this.blockSize, true, currentTime);
                this.lastBlockPrice += this.blockSize;
                blocksAdded = true;
            } else if (priceChange <= -(this.blockSize * 2)) {
                // Reversão para baixo - precisa quebrar 2 blocos para reverter
                console.log(`🔴 REVERSÃO para BAIXA: $${this.lastBlockPrice.toFixed(2)} → $${(this.lastBlockPrice - this.blockSize).toFixed(2)}`);
                this.createRenkoBlock(this.lastBlockPrice, this.lastBlockPrice - this.blockSize, false, currentTime);
                this.lastBlockPrice -= this.blockSize;
                this.lastBlockDirection = 'down';
                blocksAdded = true;
            }
        } else if (this.lastBlockDirection === 'down') {
            // Se o último bloco foi para baixo
            if (priceChange <= -this.blockSize) {
                // Continua descendo - criar bloco vermelho
                console.log(`🔴 Continuando BAIXA: $${this.lastBlockPrice.toFixed(2)} → $${(this.lastBlockPrice - this.blockSize).toFixed(2)}`);
                this.createRenkoBlock(this.lastBlockPrice, this.lastBlockPrice - this.blockSize, false, currentTime);
                this.lastBlockPrice -= this.blockSize;
                blocksAdded = true;
            } else if (priceChange >= (this.blockSize * 2)) {
                // Reversão para cima - precisa quebrar 2 blocos para reverter
                console.log(`🟢 REVERSÃO para ALTA: $${this.lastBlockPrice.toFixed(2)} → $${(this.lastBlockPrice + this.blockSize).toFixed(2)}`);
                this.createRenkoBlock(this.lastBlockPrice, this.lastBlockPrice + this.blockSize, true, currentTime);
                this.lastBlockPrice += this.blockSize;
                this.lastBlockDirection = 'up';
                blocksAdded = true;
            }
        }

        if (blocksAdded) {
            console.log(`📈 ${this.renkoBlocks.length} blocos no total, atualizando gráfico...`);
            this.updateChart();
            this.updateStats();
        } else {
            console.log(`⏸️ Preço dentro da faixa, aguardando movimento de $${this.blockSize * (this.lastBlockDirection === 'up' ? 1 : -1)} para continuar ou $${this.blockSize * (this.lastBlockDirection === 'up' ? -2 : 2)} para reverter`);
        }
    }

    createRenkoBlock(open, close, isGreen, time) {
        if (!open || !close || isNaN(open) || isNaN(close)) {
            console.warn('Dados inválidos para criar bloco Renko');
            return;
        }

        const block = {
            time: Math.floor(time) + this.renkoBlocks.length, // Usar índice sequencial para evitar sobreposição
            open: parseFloat(open.toFixed(2)),
            high: isGreen ? parseFloat(close.toFixed(2)) : parseFloat(open.toFixed(2)),
            low: isGreen ? parseFloat(open.toFixed(2)) : parseFloat(close.toFixed(2)),
            close: parseFloat(close.toFixed(2)),
            isGreen: isGreen
        };

        this.renkoBlocks.push(block);

        // Atualizar estatísticas
        this.stats.totalBlocks++;
        if (isGreen) {
            this.stats.greenBlocks++;
            this.stats.lastDirection = 'ALTA';
        } else {
            this.stats.redBlocks++;
            this.stats.lastDirection = 'BAIXA';
        }
    }

    updateChart() {
        console.log(`🔄 Atualizando gráfico com ${this.renkoBlocks.length} blocos`);

        if (this.candlestickSeries && this.renkoBlocks.length > 0) {
            console.log('📋 Dados dos blocos:', this.renkoBlocks);
            this.candlestickSeries.setData(this.renkoBlocks);

            // Auto-scroll para o último bloco
            this.chart.timeScale().scrollToRealTime();

            console.log('✅ Gráfico atualizado com sucesso');
        } else {
            console.warn('⚠️ Não foi possível atualizar o gráfico:', {
                candlestickSeries: !!this.candlestickSeries,
                blocksLength: this.renkoBlocks.length
            });
        }
    }

    updateCurrentPriceLine(price) {
        if (this.currentPriceLine && price && !isNaN(price)) {
            try {
                const currentTime = Math.floor(Date.now() / 1000) + this.renkoBlocks.length;
                this.currentPriceLine.setData([
                    { time: currentTime - 1, value: price },
                    { time: currentTime, value: price }
                ]);
            } catch (error) {
                console.warn('Erro ao atualizar linha de preço:', error);
            }
        }
    }

    updatePriceDisplay(price) {
        const currentPriceElement = document.getElementById('currentPrice');
        const priceChangeElement = document.getElementById('priceChange');

        if (currentPriceElement) {
            currentPriceElement.textContent = `$${price.toLocaleString('pt-BR', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            })}`;
        }

        // Calcular mudança de preço baseada no último bloco
        if (this.renkoBlocks.length > 0) {
            const lastBlock = this.renkoBlocks[this.renkoBlocks.length - 1];
            const priceChange = price - lastBlock.close;
            const percentChange = (priceChange / lastBlock.close) * 100;

            if (priceChangeElement) {
                const sign = priceChange >= 0 ? '+' : '';
                priceChangeElement.textContent = `${sign}${percentChange.toFixed(2)}%`;
                priceChangeElement.className = `price-change ${priceChange >= 0 ? 'price-up' : 'price-down'}`;
            }
        }
    }

    updateConnectionStatus(status, isConnected) {
        const statusElement = document.getElementById('connectionStatus');
        if (statusElement) {
            statusElement.textContent = status;

            const statusDot = document.querySelector('.status-dot');
            if (statusDot) {
                statusDot.style.background = isConnected ? '#0ecb81' : '#f6465d';
            }
        }
    }

    updateStats() {
        document.getElementById('totalBlocks').textContent = this.stats.totalBlocks;
        document.getElementById('greenBlocks').textContent = this.stats.greenBlocks;
        document.getElementById('redBlocks').textContent = this.stats.redBlocks;
        document.getElementById('lastDirection').textContent = this.stats.lastDirection || '-';

        // Atualizar cor do último movimento
        const lastDirectionElement = document.getElementById('lastDirection');
        if (this.stats.lastDirection === 'ALTA') {
            lastDirectionElement.style.color = '#0ecb81';
        } else if (this.stats.lastDirection === 'BAIXA') {
            lastDirectionElement.style.color = '#f6465d';
        }
    }

    resetChart() {
        this.renkoBlocks = [];
        this.lastBlockPrice = 0;
        this.lastBlockDirection = null;
        this.stats = {
            totalBlocks: 0,
            greenBlocks: 0,
            redBlocks: 0,
            lastDirection: null
        };

        if (this.candlestickSeries) {
            this.candlestickSeries.setData([]);
        }

        this.updateStats();
    }
}

// Inicializar a aplicação quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 DOM carregado, verificando bibliotecas...');

    // Verificar se a biblioteca LightweightCharts foi carregada
    console.log('Window object keys:', Object.keys(window).filter(key => key.includes('Light')));
    console.log('LightweightCharts object:', window.LightweightCharts);

    if (typeof LightweightCharts === 'undefined') {
        console.error('❌ Erro: Biblioteca LightweightCharts não foi carregada!');

        // Tentar carregar manualmente
        console.log('🔄 Tentando carregar biblioteca manualmente...');
        const script = document.createElement('script');
        script.src = 'https://unpkg.com/lightweight-charts@4.1.3/dist/lightweight-charts.standalone.production.js';
        script.onload = () => {
            console.log('✅ Biblioteca carregada manualmente!');
            initializeApp();
        };
        script.onerror = () => {
            console.error('❌ Falha ao carregar biblioteca manualmente');
            alert('Erro ao carregar a biblioteca de gráficos. Verifique sua conexão com internet.');
        };
        document.head.appendChild(script);
        return;
    }

    console.log('✅ Biblioteca LightweightCharts carregada com sucesso');
    initializeApp();
});

function initializeApp() {
    const renkoChart = new RenkoChart();

    // Expor para debug global (opcional)
    window.renkoChart = renkoChart;

    console.log('🚀 Gráfico Renko BTC/USDT iniciado!');
    console.log('📊 Conectando à API da Binance...');
}

// Tratamento de erros globais
window.addEventListener('error', (event) => {
    console.error('Erro na aplicação:', event.error);
});

window.addEventListener('unhandledrejection', (event) => {
    console.error('Promise rejeitada:', event.reason);
});
