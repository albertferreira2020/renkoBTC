// Gráfico Renko em tempo real usando Lightweight Charts
// A biblioteca já está carregada via script tag no HTML

class RenkoChart {
    constructor() {
        this.chart = null;
        this.candlestickSeries = null;
        this.reversalMarkers = []; // Array para armazenar marcadores
        this.ws = null;
        this.currentPrice = 0;
        this.blockSize = 10; // Aumentar para $10 para melhor visualização
        this.renkoBlocks = [];
        this.lastBlockPrice = 0;
        this.lastBlockDirection = null; // 'up', 'down', ou null
        this.currentVolume = 0;
        this.accumulatedVolume = 0; // Volume acumulado para o bloco atual
        this.stats = {
            totalBlocks: 0,
            greenBlocks: 0,
            redBlocks: 0,
            lastDirection: null
        };

        // Configuração do Supabase - será carregada do arquivo config
        this.supabaseUrl = null;
        this.supabaseKey = null;

        // Order Book WebSocket e dados - sempre habilitado por padrão
        this.orderBookWs = null;
        this.currentOrderBook = null;
        this.orderBookEnabled = true; // Sempre habilitado, sem controles de UI
        this.lastOrderBookUpdate = 0;
        this.orderBookStats = {
            spread: 0,
            spreadPercentage: 0,
            bidLiquidity: 0,
            askLiquidity: 0,
            totalLiquidity: 0,
            imbalance: 0,
            lastUpdate: null
        };

        this.init();
    } init() {
        // Aguardar um pouco para garantir que o CSS foi aplicado
        setTimeout(() => {
            this.loadConfig();
            this.createChart();
            this.setupEventListeners();
            this.connectWebSocket();

            // Conectar order book automaticamente (sempre habilitado)
            this.connectOrderBookWebSocket();
        }, 100);
    }

    async loadConfig() {
        // Aguardar configuração ser carregada
        if (window.appConfig) {
            await window.appConfig.loadConfig();
            this.supabaseUrl = window.appConfig.getSupabaseUrl();
            this.supabaseKey = window.appConfig.getSupabaseKey();
            console.log('✅ Configuração do Supabase carregada');

            // Testar estrutura da tabela
            await this.checkTableStructure();

            // Carregar dados históricos após configuração
            await this.loadHistoricalData();
        }
    }

    async checkTableStructure() {
        try {
            if (!this.supabaseUrl || !this.supabaseKey) {
                return;
            }

            console.log('🔍 Verificando estrutura da tabela botbinance...');

            // Fazer uma consulta simples para verificar os campos disponíveis
            const response = await fetch(`${this.supabaseUrl}/botbinance?limit=1`, {
                method: 'GET',
                headers: {
                    'apikey': this.supabaseKey,
                    'Authorization': `Bearer ${this.supabaseKey}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const data = await response.json();
                if (data.length > 0) {
                    console.log('📋 Campos disponíveis na tabela:', Object.keys(data[0]));
                } else {
                    console.log('📊 Tabela vazia, não é possível verificar estrutura');
                }
            }

        } catch (error) {
            console.warn('⚠️ Erro ao verificar estrutura da tabela:', error);
        }
    }

    async loadHistoricalData() {
        try {
            if (!this.supabaseUrl || !this.supabaseKey) {
                console.warn('Configuração do Supabase não disponível para carregar dados históricos');
                this.updateHistoricalStatus('❌ Config ausente', false);
                return;
            }

            console.log('📥 Carregando dados históricos do Supabase...');
            this.updateHistoricalStatus('📥 Carregando...');

            const response = await fetch(`${this.supabaseUrl}/botbinance?order=created_at.asc&limit=1000`, {
                method: 'GET',
                headers: {
                    'apikey': this.supabaseKey,
                    'Authorization': `Bearer ${this.supabaseKey}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Erro HTTP ${response.status}: ${errorText}`);
            }

            const historicalData = await response.json();
            console.log(`📊 ${historicalData.length} registros históricos encontrados`);

            if (historicalData.length > 0) {
                this.populateChartWithHistoricalData(historicalData);
                this.updateHistoricalStatus(`✅ ${historicalData.length} blocos`);
            } else {
                this.updateHistoricalStatus('📊 Nenhum dado');
            }

        } catch (error) {
            console.error('❌ Erro ao carregar dados históricos:', error);
            this.updateHistoricalStatus('❌ Erro carregamento', false);
            // Continuar mesmo se houver erro ao carregar dados históricos
        }
    }

    populateChartWithHistoricalData(historicalData) {
        try {
            console.log('🔄 Populando gráfico com dados históricos...');

            // Converter dados do Supabase para formato do gráfico
            const chartData = historicalData.map((record, index) => {
                const timestamp = new Date(record.created_at).getTime() / 1000;
                const isGreen = record.close > record.open;

                return {
                    time: Math.floor(timestamp) + index, // Evitar sobreposição de timestamps
                    open: parseFloat(record.open),
                    high: isGreen ? parseFloat(record.close) : parseFloat(record.open),
                    low: isGreen ? parseFloat(record.open) : parseFloat(record.close),
                    close: parseFloat(record.close),
                    volume: record.volume ? parseFloat(record.volume) : 0,
                    reversal: record.reversal !== null && record.reversal !== undefined ? record.reversal : 0, // Garantir 0 quando não houver reversão
                    isGreen: isGreen
                };
            });

            // Atualizar array de blocos Renko
            this.renkoBlocks = chartData;

            // Configurar estado baseado no último bloco histórico
            if (chartData.length > 0) {
                const lastBlock = chartData[chartData.length - 1];
                this.lastBlockPrice = lastBlock.close;
                this.lastBlockDirection = lastBlock.isGreen ? 'up' : 'down';

                // Atualizar estatísticas
                this.stats.totalBlocks = chartData.length;
                this.stats.greenBlocks = chartData.filter(block => block.isGreen).length;
                this.stats.redBlocks = chartData.filter(block => !block.isGreen).length;
                this.stats.lastDirection = this.lastBlockDirection === 'up' ? 'ALTA' : 'BAIXA';
            }

            // Atualizar gráfico
            this.updateChart();
            this.updateStats();

            // Debug: verificar se há reversões nos dados históricos
            const historicalReversals = this.renkoBlocks.filter(block => block.reversal !== 0);
            console.log(`🔍 Reversões encontradas nos dados históricos: ${historicalReversals.length}`);
            if (historicalReversals.length > 0) {
                console.log('📋 Primeiras reversões:', historicalReversals.slice(0, 3));
            }

            console.log(`✅ Gráfico populado com ${chartData.length} blocos históricos`);
            console.log(`🎯 Último preço: $${this.lastBlockPrice}, Direção: ${this.lastBlockDirection}`);

            // Iniciar monitoramento periódico de novos dados
            this.startPeriodicDataSync();

        } catch (error) {
            console.error('❌ Erro ao popular gráfico com dados históricos:', error);
        }
    }

    startPeriodicDataSync() {
        // Sincronizar dados a cada 30 segundos para pegar novos registros
        setInterval(async () => {
            await this.syncNewData();
        }, 30000); // 30 segundos

        console.log('🔄 Sincronização periódica iniciada (30s)');
    }

    async syncNewData() {
        try {
            if (!this.supabaseUrl || !this.supabaseKey || this.renkoBlocks.length === 0) {
                return;
            }

            // Buscar apenas dados mais recentes que o último bloco local
            const lastLocalBlock = this.renkoBlocks[this.renkoBlocks.length - 1];
            const lastTimestamp = new Date(lastLocalBlock.time * 1000).toISOString();

            const response = await fetch(`${this.supabaseUrl}/botbinance?created_at=gt.${lastTimestamp}&order=created_at.asc`, {
                method: 'GET',
                headers: {
                    'apikey': this.supabaseKey,
                    'Authorization': `Bearer ${this.supabaseKey}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                console.warn('Erro na sincronização de dados:', response.status);
                return;
            }

            const newData = await response.json();

            if (newData.length > 0) {
                console.log(`📥 ${newData.length} novos registros encontrados na sincronização`);

                // Adicionar novos dados sem duplicar
                newData.forEach((record, index) => {
                    const timestamp = new Date(record.created_at).getTime() / 1000;
                    const isGreen = record.close > record.open;

                    const newBlock = {
                        time: Math.floor(timestamp) + this.renkoBlocks.length + index,
                        open: parseFloat(record.open),
                        high: isGreen ? parseFloat(record.close) : parseFloat(record.open),
                        low: isGreen ? parseFloat(record.open) : parseFloat(record.close),
                        close: parseFloat(record.close),
                        isGreen: isGreen
                    };

                    this.renkoBlocks.push(newBlock);

                    // Atualizar estatísticas
                    this.stats.totalBlocks++;
                    if (isGreen) {
                        this.stats.greenBlocks++;
                        this.stats.lastDirection = 'ALTA';
                    } else {
                        this.stats.redBlocks++;
                        this.stats.lastDirection = 'BAIXA';
                    }

                    // Atualizar estado
                    this.lastBlockPrice = newBlock.close;
                    this.lastBlockDirection = isGreen ? 'up' : 'down';
                });

                // Atualizar gráfico
                this.updateChart();
                this.updateStats();
            }

        } catch (error) {
            console.warn('Erro na sincronização periódica:', error);
        }
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

    connectOrderBookWebSocket() {
        // Usar depth10@1000ms para equilibrar dados vs performance
        const orderBookWsUrl = 'wss://stream.binance.com:9443/ws/btcusdt@depth10@1000ms';
        console.log('📊 Conectando ao Order Book WebSocket...');

        this.updateOrderBookStatus('Conectando...', true);

        this.orderBookWs = new WebSocket(orderBookWsUrl);

        this.orderBookWs.onopen = () => {
            console.log('📊 Order Book WebSocket conectado');
            this.updateOrderBookStatus('Conectado', true);
        };

        this.orderBookWs.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                this.processOrderBookData(data);
            } catch (error) {
                console.error('❌ Erro ao processar dados do order book:', error);
            }
        };

        this.orderBookWs.onerror = (error) => {
            console.error('❌ Erro no Order Book WebSocket:', error);
            this.updateOrderBookStatus('Erro na conexão', false);
        };

        this.orderBookWs.onclose = () => {
            console.log('📊 Order Book WebSocket desconectado');
            this.updateOrderBookStatus('Desconectado', false);

            if (this.orderBookEnabled) {
                // Reconectar após 5 segundos
                setTimeout(() => {
                    console.log('📊 Tentando reconectar Order Book...');
                    this.connectOrderBookWebSocket();
                }, 5000);
            }
        };
    }

    processTradeData(tradeData) {
        const price = parseFloat(tradeData.p);
        const quantity = parseFloat(tradeData.q); // Volume da transação
        const volume = price * quantity; // Volume em USDT

        console.log(`💹 Novo trade recebido: $${price.toFixed(2)}, Qtd: ${quantity}, Volume: $${volume.toFixed(2)}`);

        this.currentPrice = price;
        this.currentVolume = volume;
        this.updatePriceDisplay(price);
        this.updateCurrentPriceLine(price);

        // Processar bloco Renko
        this.processRenkoBlock(price, volume);

        // Atualizar estatísticas para mostrar volume acumulado
        this.updateStats();
    }

    processRenkoBlock(price, volume = 0) {
        // Acumular volume para o bloco atual
        this.accumulatedVolume += volume;

        // Se é o primeiro preço e não temos dados históricos, definir como base e criar bloco inicial
        if (this.renkoBlocks.length === 0) {
            this.lastBlockPrice = Math.floor(price / this.blockSize) * this.blockSize;
            console.log(`🎯 Preço base definido: $${this.lastBlockPrice.toFixed(2)} (Tamanho bloco: $${this.blockSize})`);

            // Criar o primeiro bloco Renko (neutro) baseado no preço atual
            const currentTime = Date.now() / 1000;
            this.createRenkoBlock(
                this.lastBlockPrice,
                this.lastBlockPrice + this.blockSize,
                true, // Começar com verde
                currentTime,
                this.accumulatedVolume,
                0 // Primeiro bloco não é reversão
            );
            this.lastBlockPrice += this.blockSize;
            this.lastBlockDirection = 'up';
            this.accumulatedVolume = 0; // Reset volume após criar bloco
            this.updateChart();
            this.updateStats();
            return;
        }

        // Se já temos dados históricos, usar o último preço do histórico como referência
        if (this.lastBlockPrice === 0 && this.renkoBlocks.length > 0) {
            const lastHistoricalBlock = this.renkoBlocks[this.renkoBlocks.length - 1];
            this.lastBlockPrice = lastHistoricalBlock.close;
            this.lastBlockDirection = lastHistoricalBlock.isGreen ? 'up' : 'down';
            console.log(`🔄 Continuando do último bloco histórico: $${this.lastBlockPrice.toFixed(2)}, Direção: ${this.lastBlockDirection}`);
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
                // Continua subindo - criar bloco verde (continuação)
                console.log(`🟢 Continuando ALTA: $${this.lastBlockPrice.toFixed(2)} → $${(this.lastBlockPrice + this.blockSize).toFixed(2)}`);
                this.createRenkoBlock(this.lastBlockPrice, this.lastBlockPrice + this.blockSize, true, currentTime, this.accumulatedVolume, 0);
                this.lastBlockPrice += this.blockSize;
                this.accumulatedVolume = 0; // Reset volume após criar bloco
                blocksAdded = true;
            } else if (priceChange <= -(this.blockSize * 2)) {
                // Reversão para baixo - precisa quebrar 2 blocos para reverter
                console.log(`🔴 REVERSÃO para BAIXA: $${this.lastBlockPrice.toFixed(2)} → $${(this.lastBlockPrice - this.blockSize).toFixed(2)}`);
                this.createRenkoBlock(this.lastBlockPrice, this.lastBlockPrice - this.blockSize, false, currentTime, this.accumulatedVolume, -1);
                this.lastBlockPrice -= this.blockSize;
                this.lastBlockDirection = 'down';
                this.accumulatedVolume = 0; // Reset volume após criar bloco
                blocksAdded = true;
            }
        } else if (this.lastBlockDirection === 'down') {
            // Se o último bloco foi para baixo
            if (priceChange <= -this.blockSize) {
                // Continua descendo - criar bloco vermelho (continuação)
                console.log(`🔴 Continuando BAIXA: $${this.lastBlockPrice.toFixed(2)} → $${(this.lastBlockPrice - this.blockSize).toFixed(2)}`);
                this.createRenkoBlock(this.lastBlockPrice, this.lastBlockPrice - this.blockSize, false, currentTime, this.accumulatedVolume, 0);
                this.lastBlockPrice -= this.blockSize;
                this.accumulatedVolume = 0; // Reset volume após criar bloco
                blocksAdded = true;
            } else if (priceChange >= (this.blockSize * 2)) {
                // Reversão para cima - precisa quebrar 2 blocos para reverter
                console.log(`🟢 REVERSÃO para ALTA: $${this.lastBlockPrice.toFixed(2)} → $${(this.lastBlockPrice + this.blockSize).toFixed(2)}`);
                this.createRenkoBlock(this.lastBlockPrice, this.lastBlockPrice + this.blockSize, true, currentTime, this.accumulatedVolume, 1);
                this.lastBlockPrice += this.blockSize;
                this.lastBlockDirection = 'up';
                this.accumulatedVolume = 0; // Reset volume após criar bloco
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

    createRenkoBlock(open, close, isGreen, time, volume = 0, reversal = 0) {
        if (!open || !close || isNaN(open) || isNaN(close)) {
            console.warn('Dados inválidos para criar bloco Renko');
            return;
        }

        // Garantir que reversal seja sempre um número (0 se for null/undefined)
        const reversalValue = reversal !== null && reversal !== undefined ? reversal : 0;

        const block = {
            time: Math.floor(time) + this.renkoBlocks.length, // Usar índice sequencial para evitar sobreposição
            open: parseFloat(open.toFixed(2)),
            high: isGreen ? parseFloat(close.toFixed(2)) : parseFloat(open.toFixed(2)),
            low: isGreen ? parseFloat(open.toFixed(2)) : parseFloat(close.toFixed(2)),
            close: parseFloat(close.toFixed(2)),
            volume: parseFloat(volume.toFixed(2)),
            reversal: reversalValue, // 1 para reversão alta, -1 para reversão baixa, 0 para continuação
            isGreen: isGreen
        };

        const reversalText = reversalValue === 1 ? ' 🔄⬆️ REVERSÃO ALTA' :
            reversalValue === -1 ? ' 🔄⬇️ REVERSÃO BAIXA' : '';

        console.log(`📦 Criando bloco Renko: ${isGreen ? '🟢' : '🔴'} $${open.toFixed(2)} → $${close.toFixed(2)}, Volume: $${volume.toFixed(2)}${reversalText}`);

        this.renkoBlocks.push(block);

        // Adicionar marcador de reversão se necessário
        if (reversalValue !== 0) {
            this.addReversalMarker(block);
        }

        // Registrar bloco no Supabase
        this.registerBlockInSupabase(block);

        // Atualizar estatísticas
        this.stats.totalBlocks++;
        if (isGreen) {
            this.stats.greenBlocks++;
            this.stats.lastDirection = 'ALTA';
        } else {
            this.stats.redBlocks++;
            this.stats.lastDirection = 'BAIXA';
        }
    } addReversalMarker(block) {
        if (!this.candlestickSeries) {
            console.warn('⚠️ Série principal não inicializada');
            return;
        }

        // Garantir que reversal seja tratado como número
        const reversalValue = block.reversal !== null && block.reversal !== undefined ? block.reversal : 0;

        if (reversalValue === 1) {
            // Reversão de alta - marcador verde acima do bloco
            console.log(`📍 Adicionando marcador de reversão ALTA em $${block.close.toFixed(2)}`);
            this.reversalMarkers.push({
                time: block.time,
                position: 'aboveBar',
                color: '#0ecb81',
                text: '⬆',
                size: 2
            });
        } else if (reversalValue === -1) {
            // Reversão de baixa - marcador vermelho abaixo do bloco
            console.log(`📍 Adicionando marcador de reversão BAIXA em $${block.close.toFixed(2)}`);
            this.reversalMarkers.push({
                time: block.time,
                position: 'belowBar',
                color: '#f6465d',
                text: '⬇',
                size: 2
            });
        }

        // Aplicar todos os marcadores à série principal
        this.updateAllMarkers();
    }

    updateAllMarkers() {
        if (!this.candlestickSeries) {
            console.warn('⚠️ Série principal não disponível para marcadores');
            return;
        }

        try {
            console.log(`🔍 Aplicando ${this.reversalMarkers.length} marcadores:`, this.reversalMarkers);

            // Aplicar todos os marcadores de uma vez
            this.candlestickSeries.setMarkers(this.reversalMarkers);
            console.log(`✅ ${this.reversalMarkers.length} marcadores aplicados com sucesso`);
        } catch (error) {
            console.error('❌ Erro ao aplicar marcadores:', error);
            console.log('Dados dos marcadores:', this.reversalMarkers);
        }
    }

    updateReversalMarkers() {
        // Reconstruir array de marcadores baseado nos blocos
        this.reversalMarkers = [];

        this.renkoBlocks.forEach(block => {
            // Garantir que reversal seja tratado como número
            const reversalValue = block.reversal !== null && block.reversal !== undefined ? block.reversal : 0;

            if (reversalValue === 1) {
                this.reversalMarkers.push({
                    time: block.time,
                    position: 'aboveBar',
                    color: '#0ecb81',
                    text: '⬆',
                    size: 2
                });
            } else if (reversalValue === -1) {
                this.reversalMarkers.push({
                    time: block.time,
                    position: 'belowBar',
                    color: '#f6465d',
                    text: '⬇',
                    size: 2
                });
            }
        });

        // Aplicar marcadores à série principal
        this.updateAllMarkers();
    }

    async registerBlockInSupabase(block) {
        try {
            // Verificar se a configuração está disponível
            if (!this.supabaseUrl || !this.supabaseKey) {
                console.warn('Configuração do Supabase não encontrada, pulando salvamento');
                return;
            }

            // Validar se o bloco é válido
            if (!block || !block.open || !block.close) {
                console.warn('Bloco inválido, não será registrado:', block);
                return;
            }

            // Primeiro tentar com todos os campos incluindo order book
            let renkoData = {
                created_at: new Date().toISOString(),
                open: block.open,
                close: block.close,
                high: block.high,
                low: block.low,
                volume: block.volume || 0,
                reversal: block.reversal // Incluir campo reversal
            };

            // Adicionar dados do order book se disponíveis
            if (this.orderBookStats && this.orderBookStats.lastUpdate) {
                renkoData = {
                    ...renkoData,
                    // Campos do order book - garantir valores numéricos sem aspas
                    best_bid_price: Number(this.orderBookStats.bestBidPrice) || null,
                    best_bid_quantity: Number(this.orderBookStats.bestBidQuantity) || null,
                    best_ask_price: Number(this.orderBookStats.bestAskPrice) || null,
                    best_ask_quantity: Number(this.orderBookStats.bestAskQuantity) || null,
                    spread: Number(this.orderBookStats.spread) || null,
                    spread_percentage: Number(this.orderBookStats.spreadPercentage) || null,
                    bid_liquidity: Number(this.orderBookStats.bidLiquidity) || null,
                    ask_liquidity: Number(this.orderBookStats.askLiquidity) || null,
                    total_liquidity: Number(this.orderBookStats.totalLiquidity) || null,
                    imbalance: Number(this.orderBookStats.imbalance) || null,
                    weighted_mid_price: Number(this.orderBookStats.weightedMidPrice) || null
                };
                console.log('📊 Incluindo dados do order book no registro (como números, sem aspas)');
            }

            console.log('�💾 Salvando bloco Renko com order book no banco de dados:', renkoData);

            const response = await fetch(`${this.supabaseUrl}/botbinance`, {
                method: 'POST',
                headers: {
                    'apikey': this.supabaseKey,
                    'Authorization': `Bearer ${this.supabaseKey}`,
                    'Content-Type': 'application/json',
                    'Prefer': 'return=minimal'
                },
                body: JSON.stringify(renkoData)
            });

            if (!response.ok) {
                const errorText = await response.text();

                // Se erro for sobre campos inexistentes, tentar com campos básicos
                if (errorText.includes('high') || errorText.includes('low') ||
                    errorText.includes('best_bid') || errorText.includes('spread') ||
                    errorText.includes('liquidity') || errorText.includes('imbalance')) {
                    console.warn('⚠️ Alguns campos não existem, tentando apenas com campos básicos...');

                    renkoData = {
                        created_at: new Date().toISOString(),
                        open: block.open,
                        close: block.close,
                        volume: block.volume || 0,
                        reversal: block.reversal // Manter reversal no fallback básico
                    };

                    const fallbackResponse = await fetch(`${this.supabaseUrl}/botbinance`, {
                        method: 'POST',
                        headers: {
                            'apikey': this.supabaseKey,
                            'Authorization': `Bearer ${this.supabaseKey}`,
                            'Content-Type': 'application/json',
                            'Prefer': 'return=minimal'
                        },
                        body: JSON.stringify(renkoData)
                    });

                    if (!fallbackResponse.ok) {
                        const fallbackErrorText = await fallbackResponse.text();

                        // Se ainda falhar e for sobre reversal, tentar sem ele
                        if (fallbackErrorText.includes('reversal')) {
                            console.warn('⚠️ Campo reversal não existe, tentando sem ele...');

                            renkoData = {
                                created_at: new Date().toISOString(),
                                open: block.open,
                                close: block.close,
                                volume: block.volume || 0
                            };

                            const finalFallbackResponse = await fetch(`${this.supabaseUrl}/botbinance`, {
                                method: 'POST',
                                headers: {
                                    'apikey': this.supabaseKey,
                                    'Authorization': `Bearer ${this.supabaseKey}`,
                                    'Content-Type': 'application/json',
                                    'Prefer': 'return=minimal'
                                },
                                body: JSON.stringify(renkoData)
                            });

                            if (!finalFallbackResponse.ok) {
                                const finalErrorText = await finalFallbackResponse.text();
                                throw new Error(`Erro HTTP ${finalFallbackResponse.status}: ${finalErrorText}`);
                            }

                            console.log('✅ Bloco Renko salvo no banco (apenas campos básicos)');
                        } else {
                            throw new Error(`Erro HTTP ${fallbackResponse.status}: ${fallbackErrorText}`);
                        }
                    } else {
                        console.log('✅ Bloco Renko salvo no banco (campos básicos + reversal)');
                    }
                } else if (errorText.includes('reversal')) {
                    // Se erro for especificamente sobre reversal, tentar sem ele mas com order book
                    console.warn('⚠️ Campo reversal não existe, tentando sem ele...');

                    renkoData = {
                        created_at: new Date().toISOString(),
                        open: block.open,
                        close: block.close,
                        high: block.high,
                        low: block.low,
                        volume: block.volume || 0
                    };

                    // Incluir order book se disponível
                    if (this.orderBookStats && this.orderBookStats.lastUpdate) {
                        renkoData = {
                            ...renkoData,
                            best_bid_price: Number(this.orderBookStats.bestBidPrice) || null,
                            best_bid_quantity: Number(this.orderBookStats.bestBidQuantity) || null,
                            best_ask_price: Number(this.orderBookStats.bestAskPrice) || null,
                            best_ask_quantity: Number(this.orderBookStats.bestAskQuantity) || null,
                            spread: Number(this.orderBookStats.spread) || null,
                            spread_percentage: Number(this.orderBookStats.spreadPercentage) || null,
                            bid_liquidity: Number(this.orderBookStats.bidLiquidity) || null,
                            ask_liquidity: Number(this.orderBookStats.askLiquidity) || null,
                            total_liquidity: Number(this.orderBookStats.totalLiquidity) || null,
                            imbalance: Number(this.orderBookStats.imbalance) || null,
                            weighted_mid_price: Number(this.orderBookStats.weightedMidPrice) || null
                        };
                    }

                    const reversalFallbackResponse = await fetch(`${this.supabaseUrl}/botbinance`, {
                        method: 'POST',
                        headers: {
                            'apikey': this.supabaseKey,
                            'Authorization': `Bearer ${this.supabaseKey}`,
                            'Content-Type': 'application/json',
                            'Prefer': 'return=minimal'
                        },
                        body: JSON.stringify(renkoData)
                    });

                    if (!reversalFallbackResponse.ok) {
                        const reversalErrorText = await reversalFallbackResponse.text();
                        throw new Error(`Erro HTTP ${reversalFallbackResponse.status}: ${reversalErrorText}`);
                    }

                    console.log('✅ Bloco Renko salvo no banco (sem reversal)');
                } else {
                    throw new Error(`Erro HTTP ${response.status}: ${errorText}`);
                }
            } else {
                console.log('✅ Bloco Renko salvo no banco com sucesso (com high/low)');
            }

            // Atualizar UI para mostrar que foi salvo
            this.updateSaveStatus(true);

        } catch (error) {
            console.error('❌ Erro ao salvar bloco Renko no banco:', error);
            this.updateSaveStatus(false, error.message);
        }
    }

    updateSaveStatus(success, errorMessage = '') {
        const statusElement = document.getElementById('saveStatus');
        if (statusElement) {
            if (success) {
                statusElement.innerHTML = '✅ Salvo no BD';
                statusElement.className = 'save-status success';
            } else {
                statusElement.innerHTML = `❌ Erro BD: ${errorMessage}`;
                statusElement.className = 'save-status error';
            }

            // Limpar status após 3 segundos
            setTimeout(() => {
                statusElement.innerHTML = '';
                statusElement.className = 'save-status';
            }, 3000);
        }
    }

    updateHistoricalStatus(status, isSuccess = true) {
        const statusElement = document.getElementById('historicalStatus');
        if (statusElement) {
            statusElement.innerHTML = status;
            statusElement.className = isSuccess ? 'historical-status success' : 'historical-status error';
        }
    }

    updateChart() {
        console.log(`🔄 Atualizando gráfico com ${this.renkoBlocks.length} blocos`);

        if (this.candlestickSeries && this.renkoBlocks.length > 0) {
            console.log('📋 Dados dos blocos:', this.renkoBlocks);
            this.candlestickSeries.setData(this.renkoBlocks);

            // Atualizar marcadores de reversão
            this.updateReversalMarkers();

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

        // Atualizar volume acumulado atual
        const currentVolumeElement = document.getElementById('currentVolume');
        if (currentVolumeElement) {
            currentVolumeElement.textContent = `$${this.accumulatedVolume.toLocaleString('pt-BR', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            })}`;
        }

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
        this.accumulatedVolume = 0; // Reset volume acumulado
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

    // Método para testar marcadores (apenas para debug)
    addTestReversalMarkers() {
        if (this.renkoBlocks.length < 3) {
            console.log('🧪 Não há blocos suficientes para teste de marcadores');
            return;
        }

        // Adicionar marcadores de teste aos últimos blocos
        const testBlocks = this.renkoBlocks.slice(-3);

        // Simular uma reversão de alta no penúltimo bloco
        if (testBlocks.length >= 2) {
            testBlocks[testBlocks.length - 2].reversal = 1;
            console.log('🧪 Adicionado marcador de teste: REVERSÃO ALTA');
        }

        // Simular uma reversão de baixa no último bloco
        if (testBlocks.length >= 1) {
            testBlocks[testBlocks.length - 1].reversal = -1;
            console.log('🧪 Adicionado marcador de teste: REVERSÃO BAIXA');
        }

        // Atualizar marcadores
        this.updateReversalMarkers();
        console.log('🧪 Marcadores de teste aplicados! Verifique o gráfico.');
    }

    processOrderBookData(orderBookData) {
        if (!orderBookData.bids || !orderBookData.asks) {
            console.warn('⚠️ Dados de order book inválidos');
            return;
        }

        this.currentOrderBook = orderBookData;
        this.lastOrderBookUpdate = Date.now();

        // Calcular métricas do order book
        const metrics = this.calculateOrderBookMetrics(orderBookData);
        this.orderBookStats = {
            ...metrics,
            lastUpdate: new Date().toISOString()
        };

        console.log(`📊 Order Book atualizado: Spread: ${metrics.spreadPercentage.toFixed(4)}%, Imbalance: ${metrics.imbalance.toFixed(4)}, Liquidez: $${metrics.totalLiquidity.toFixed(0)}`);

        // Atualizar UI
        this.updateOrderBookDisplay();
    }

    calculateOrderBookMetrics(orderBookData) {
        const bids = orderBookData.bids.map(bid => ({
            price: parseFloat(bid[0]),
            quantity: parseFloat(bid[1])
        }));

        const asks = orderBookData.asks.map(ask => ({
            price: parseFloat(ask[0]),
            quantity: parseFloat(ask[1])
        }));

        // Melhores preços
        const bestBid = bids[0];
        const bestAsk = asks[0];

        // Spread
        const spread = bestAsk.price - bestBid.price;
        const midPrice = (bestBid.price + bestAsk.price) / 2;
        const spreadPercentage = (spread / midPrice) * 100;

        // Liquidez agregada (top 10 níveis)
        const bidLiquidity = bids.reduce((sum, bid) => sum + (bid.price * bid.quantity), 0);
        const askLiquidity = asks.reduce((sum, ask) => sum + (ask.price * ask.quantity), 0);
        const totalLiquidity = bidLiquidity + askLiquidity;

        // Imbalance (-1 a +1, onde +1 = mais bids, -1 = mais asks)
        const imbalance = (bidLiquidity - askLiquidity) / totalLiquidity;

        // Preço médio ponderado
        const weightedMidPrice = (bestBid.price * bestAsk.quantity + bestAsk.price * bestBid.quantity) /
            (bestBid.quantity + bestAsk.quantity);

        return {
            lastUpdateId: orderBookData.lastUpdateId,
            bestBidPrice: Math.round(bestBid.price * 100) / 100,
            bestBidQuantity: Math.round(bestBid.quantity * 100) / 100,
            bestAskPrice: Math.round(bestAsk.price * 100) / 100,
            bestAskQuantity: Math.round(bestAsk.quantity * 100) / 100,
            spread: Math.round(spread * 100) / 100,
            spreadPercentage: Math.round(spreadPercentage * 100) / 100,
            bidLiquidity: Math.round(bidLiquidity * 100) / 100,
            askLiquidity: Math.round(askLiquidity * 100) / 100,
            totalLiquidity: Math.round(totalLiquidity * 100) / 100,
            imbalance: Math.round(imbalance * 10000) / 10000, // 4 casas para imbalance (valor pequeno)
            weightedMidPrice: Math.round(weightedMidPrice * 100) / 100,
            midPrice: Math.round(midPrice * 100) / 100
        };
    }

    updateOrderBookStatus(status, isSuccess = true) {
        const statusElement = document.getElementById('orderBookStatus');
        if (statusElement) {
            statusElement.innerHTML = status;
            statusElement.className = isSuccess ? 'order-book-status success' : 'order-book-status error';
        }
    }

    updateOrderBookDisplay() {
        if (!this.orderBookStats.lastUpdate) return;

        // Atualizar elementos da UI se existirem
        const spreadElement = document.getElementById('spreadDisplay');
        if (spreadElement) {
            spreadElement.innerHTML = `Spread: ${this.orderBookStats.spreadPercentage.toFixed(2)}%`;
        }

        const liquidityElement = document.getElementById('liquidityDisplay');
        if (liquidityElement) {
            liquidityElement.innerHTML = `Liquidez: $${this.orderBookStats.totalLiquidity.toFixed(2)}`;
        }

        const imbalanceElement = document.getElementById('imbalanceDisplay');
        if (imbalanceElement) {
            const imbalanceText = this.orderBookStats.imbalance > 0 ?
                `Mais Bids (+${(this.orderBookStats.imbalance * 100).toFixed(2)}%)` :
                `Mais Asks (${(this.orderBookStats.imbalance * 100).toFixed(2)}%)`;
            imbalanceElement.innerHTML = `Imbalance: ${imbalanceText}`;
        }
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
    // Expor instância globalmente para controles da UI
    window.renkoChart = new RenkoChart();

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
