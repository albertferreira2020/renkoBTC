// Gráfico Renko em tempo real usando Lightweight Charts
// A biblioteca já está carregada via script tag no HTML

// RSICalculator será carregado do utils.js via script tag

class RenkoChart {
    constructor() {
        this.chart = null;
        this.rsiChart = null; // Gráfico separado para RSI
        this.candlestickSeries = null;
        this.rsiSeries = null; // Série para o gráfico RSI
        this.rsiData = []; // Dados do RSI para o gráfico
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

        // Configuração da API local - conecta ao PostgreSQL via servidor Node.js
        this.apiBaseUrl = 'http://localhost:3000/api';
        this.supabaseUrl = null; // Não usado mais
        this.supabaseKey = null; // Não usado mais

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

        // RSI - inicializar com verificação de segurança
        try {
            if (typeof RSICalculator !== 'undefined') {
                this.rsiCalculator = new RSICalculator(14); // Período padrão de 14
                console.log('✅ RSICalculator inicializado com sucesso');
            } else {
                console.warn('⚠️ RSICalculator não está disponível');
                this.rsiCalculator = null;
            }
        } catch (error) {
            console.warn('❌ Erro ao inicializar RSICalculator:', error);
            this.rsiCalculator = null;
        }
        this.rsiPeriod = 14;
        this.rsiHistory = [];

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
            console.log('✅ Configuração carregada - usando API local');

            // Testar conexão com a API local
            await this.testApiConnection();

            // Carregar dados históricos após configuração
            await this.loadHistoricalData();
        }
    }

    async testApiConnection() {
        try {
            console.log('🔍 Testando conexão com API local...');

            const response = await fetch(`${this.apiBaseUrl}/health`);
            const data = await response.json();

            if (data.status === 'ok') {
                console.log('✅ API local conectada com sucesso');
                console.log('📊 Banco PostgreSQL:', data.database);
            } else {
                console.warn('⚠️ Problema na conexão:', data);
            }
        } catch (error) {
            console.error('❌ Erro ao conectar com API local:', error);
        }
    }

    async checkTableStructure() {
        try {
            console.log('🔍 Verificando estrutura da tabela botbinance...');

            const response = await fetch(`${this.apiBaseUrl}/table-structure`);

            if (response.ok) {
                const columns = await response.json();
                console.log('📋 Estrutura da tabela:');
                columns.forEach(col => {
                    console.log(`  - ${col.column_name}: ${col.data_type} (${col.is_nullable})`);
                });
            } else {
                console.warn('⚠️ Não foi possível verificar estrutura da tabela');
            }

        } catch (error) {
            console.warn('⚠️ Erro ao verificar estrutura da tabela:', error);
        }
    }

    async loadHistoricalData() {
        try {
            console.log('📥 Carregando dados históricos do PostgreSQL...');
            this.updateHistoricalStatus('📥 Carregando...');

            const response = await fetch(`${this.apiBaseUrl}/historical-data?limit=1000`);

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
        // Não é mais necessário sincronizar dados periódicos 
        // pois novos dados são salvos em tempo real via API local
        console.log('🔄 Sincronização em tempo real ativa via API local');
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
    } createChart() {
        const chartContainer = document.getElementById('chart');
        const rsiChartContainer = document.getElementById('rsi-chart');

        console.log('📊 Criando gráficos principal e RSI...');
        console.log('Chart container:', chartContainer);
        console.log('RSI container:', rsiChartContainer);

        if (!chartContainer || !rsiChartContainer) {
            console.error('❌ Containers não encontrados!');
            setTimeout(() => this.createChart(), 200);
            return;
        }

        // Usar as dimensões naturais dos containers respeitando o flexbox
        const chartWidth = Math.max(chartContainer.clientWidth, 800);
        const chartHeight = chartContainer.clientHeight || 400; // Usar altura natural ou fallback
        const rsiWidth = Math.max(rsiChartContainer.clientWidth, 800);
        const rsiHeight = rsiChartContainer.clientHeight || 100; // Usar altura natural ou fallback

        console.log('Chart dimensions:', { chartWidth, chartHeight });
        console.log('RSI dimensions:', { rsiWidth, rsiHeight });

        if (chartWidth < 100 || chartHeight < 100) {
            console.warn('⚠️ Dimensões ainda muito pequenas, aguardando...');
            setTimeout(() => this.createChart(), 500);
            return;
        }

        console.log('📦 Tentando criar gráficos com LightweightCharts...');

        try {
            // Criar gráfico principal (Renko)
            this.createMainChart(chartContainer, chartWidth, chartHeight);

            // Criar gráfico RSI
            this.createRSIChart(rsiChartContainer, rsiWidth, rsiHeight);

            console.log('✅ Ambos os gráficos criados com sucesso!');

        } catch (error) {
            console.error('❌ Erro ao criar gráficos:', error);
            console.error('Stack trace:', error.stack);
            alert('Erro ao criar os gráficos. Verifique o console para mais detalhes.');
        }
    }

    createMainChart(chartContainer, width, height) {
        this.chart = LightweightCharts.createChart(chartContainer, {
            width: width,
            height: height,
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

        console.log('✅ Gráfico principal criado');

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

        // Responsividade para gráfico principal
        window.addEventListener('resize', () => {
            const newWidth = Math.max(chartContainer.clientWidth, 800);
            const newHeight = chartContainer.clientHeight || 400; // Usar altura natural
            this.chart.applyOptions({
                width: newWidth,
                height: newHeight,
            });
            if (this.rsiChart) {
                const rsiContainer = document.getElementById('rsi-chart');
                const rsiWidth = Math.max(rsiContainer.clientWidth, 800);
                const rsiHeight = rsiContainer.clientHeight || 100; // Usar altura natural
                this.rsiChart.applyOptions({
                    width: rsiWidth,
                    height: rsiHeight,
                });
            }
        });
    }

    createRSIChart(rsiChartContainer, width, height) {
        this.rsiChart = LightweightCharts.createChart(rsiChartContainer, {
            width: width,
            height: height,
            layout: {
                background: {
                    color: '#0d1421',
                },
                textColor: '#d1d4dc',
            },
            grid: {
                vertLines: {
                    color: 'rgba(197, 203, 206, 0.05)',
                },
                horzLines: {
                    color: 'rgba(197, 203, 206, 0.05)',
                },
            },
            rightPriceScale: {
                borderColor: 'rgba(197, 203, 206, 0.2)',
                textColor: '#d1d4dc',
                autoScale: false,
                scaleMargins: {
                    top: 0.1,
                    bottom: 0.1,
                },
                mode: 1, // Percentage mode
                visible: true,
                entireTextOnly: true,
                ticksVisible: true,
                borderVisible: true,
            },
            timeScale: {
                borderColor: 'rgba(197, 203, 206, 0.2)',
                textColor: '#d1d4dc',
                timeVisible: false,
                secondsVisible: false,
                visible: false, // Ocultar escala de tempo no RSI
            },
            crosshair: {
                mode: 1,
            },
            handleScroll: {
                mouseWheel: false,
                pressedMouseMove: false,
            },
            handleScale: {
                axisPressedMouseMove: false,
                mouseWheel: false,
                pinch: false,
            },
        });

        console.log('✅ Gráfico RSI criado');

        // Configurar escala RSI (0-100)
        this.rsiChart.priceScale('right').applyOptions({
            scaleMargins: {
                top: 0.1,
                bottom: 0.1,
            },
            autoScale: false,
        });

        // Adicionar série RSI
        this.rsiSeries = this.rsiChart.addLineSeries({
            color: '#f0b90b',
            lineWidth: 2,
            crosshairMarkerVisible: true,
            crosshairMarkerRadius: 4,
            crosshairMarkerBorderColor: '#f0b90b',
            crosshairMarkerBackgroundColor: '#f0b90b',
            priceFormat: {
                type: 'custom',
                formatter: (price) => price.toFixed(2),
            },
        });

        // Adicionar linhas de referência RSI (30, 50, 70)
        this.rsiChart.addLineSeries({
            color: 'rgba(246, 70, 93, 0.5)',
            lineWidth: 1,
            lineStyle: 2, // Dashed
            crosshairMarkerVisible: false,
            lastValueVisible: false,
            priceLineVisible: false,
        }).setData([{ time: Date.now() / 1000, value: 70 }]);

        this.rsiChart.addLineSeries({
            color: 'rgba(212, 212, 212, 0.3)',
            lineWidth: 1,
            lineStyle: 2,
            crosshairMarkerVisible: false,
            lastValueVisible: false,
            priceLineVisible: false,
        }).setData([{ time: Date.now() / 1000, value: 50 }]);

        this.rsiChart.addLineSeries({
            color: 'rgba(14, 203, 129, 0.5)',
            lineWidth: 1,
            lineStyle: 2,
            crosshairMarkerVisible: false,
            lastValueVisible: false,
            priceLineVisible: false,
        }).setData([{ time: Date.now() / 1000, value: 30 }]);

        console.log('✅ Série RSI e linhas de referência adicionadas');
    }

    setupEventListeners() {
        const blockSizeInput = document.getElementById('blockSize');
        const zoomLevelInput = document.getElementById('zoomLevel');
        const rsiPeriodInput = document.getElementById('rsiPeriod');

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

        rsiPeriodInput.addEventListener('change', (e) => {
            this.rsiPeriod = parseInt(e.target.value);
            try {
                if (typeof RSICalculator !== 'undefined') {
                    this.rsiCalculator = new RSICalculator(this.rsiPeriod);
                    console.log(`📊 RSI período alterado para: ${this.rsiPeriod}`);
                } else {
                    console.warn('⚠️ RSICalculator não está disponível para alteração de período');
                }
            } catch (error) {
                console.warn('❌ Erro ao alterar período do RSI:', error);
            }
            this.updateRSIDisplay();
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
        // Calcular RSI a cada novo preço (com verificação de segurança)
        let rsiValue = null;
        if (this.rsiCalculator && typeof this.rsiCalculator.addPrice === 'function') {
            try {
                rsiValue = this.rsiCalculator.addPrice(price);
                this.updateRSIDisplay(rsiValue);
            } catch (error) {
                console.warn('❌ Erro ao calcular RSI:', error);
                rsiValue = null;
            }
        }

        // Atualizar gráfico RSI se temos um valor válido e série disponível
        if (rsiValue !== null && rsiValue !== undefined && this.rsiSeries) {
            try {
                const currentTime = Date.now() / 1000;

                // Verificar se o valor é numérico válido
                if (typeof rsiValue === 'number' && !isNaN(rsiValue) && isFinite(rsiValue)) {
                    this.rsiData.push({
                        time: currentTime,
                        value: rsiValue
                    });

                    // Manter apenas os últimos 500 pontos RSI
                    if (this.rsiData.length > 500) {
                        this.rsiData.shift();
                    }

                    this.rsiSeries.setData(this.rsiData);
                    console.log(`📈 RSI gráfico atualizado: ${rsiValue.toFixed(2)}`);
                }
            } catch (error) {
                console.warn('❌ Erro ao atualizar gráfico RSI:', error);
            }
        }

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
            // Validar se o bloco é válido
            if (!block || !block.open || !block.close) {
                console.warn('Bloco inválido, não será registrado:', block);
                return;
            }

            // Preparar dados básicos para envio à API local
            let renkoData = {
                open: block.open,
                close: block.close,
                high: block.high || (block.isGreen ? block.close : block.open),
                low: block.low || (block.isGreen ? block.open : block.close),
                volume: block.volume || 0,
                reversal: block.reversal || 0
            };

            // Incluir dados do order book se disponíveis
            if (this.orderBookStats && this.orderBookStats.lastUpdate) {
                console.log('📊 Dados do order book disponíveis:', this.orderBookStats);
                renkoData = {
                    ...renkoData,
                    best_bid_price: Number(this.orderBookStats.bestBidPrice) || 0,
                    best_bid_quantity: Number(this.orderBookStats.bestBidQuantity) || 0,
                    best_ask_price: Number(this.orderBookStats.bestAskPrice) || 0,
                    best_ask_quantity: Number(this.orderBookStats.bestAskQuantity) || 0,
                    spread: Number(this.orderBookStats.spread) || 0,
                    spread_percentage: Number(this.orderBookStats.spreadPercentage) || 0,
                    bid_liquidity: Number(this.orderBookStats.bidLiquidity) || 0,
                    ask_liquidity: Number(this.orderBookStats.askLiquidity) || 0,
                    total_liquidity: Number(this.orderBookStats.totalLiquidity) || 0,
                    imbalance: Number(this.orderBookStats.imbalance) || 0,
                    weighted_mid_price: Number(this.orderBookStats.weightedMidPrice) || 0
                };
                console.log('📊 Incluindo dados do order book no registro');
            } else {
                console.warn('⚠️ Dados do order book não disponíveis:', {
                    orderBookStats: this.orderBookStats,
                    hasLastUpdate: this.orderBookStats ? !!this.orderBookStats.lastUpdate : false
                });
            }

            console.log('💾 Salvando bloco Renko no PostgreSQL:', renkoData);

            const response = await fetch(`${this.apiBaseUrl}/renko-data`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(renkoData)
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Erro ao salvar: ${response.status} - ${errorText}`);
            }

            const savedData = await response.json();
            console.log('✅ Bloco salvo com sucesso:', savedData);

            // Atualizar UI para mostrar que foi salvo
            this.updateSaveStatus(true);

        } catch (error) {
            console.error('❌ Erro ao registrar bloco no banco:', error);
            this.updateSaveStatus(false, error.message);
            // Continuar funcionamento mesmo se houver erro de salvamento
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

    updateRSIDisplay(rsiValue = null) {
        const rsiValueElement = document.getElementById('rsiValue');
        const rsiStatusElement = document.getElementById('rsiStatus');

        if (rsiValue !== null && rsiValue !== undefined) {
            // Atualizar valor do RSI
            rsiValueElement.textContent = rsiValue.toFixed(2);
            rsiValueElement.className = 'stat-value rsi-value';

            // Atualizar status do RSI (com verificação de segurança)
            let rsiLevel = 'NEUTRO';
            if (this.rsiCalculator && typeof this.rsiCalculator.getRSILevel === 'function') {
                try {
                    rsiLevel = this.rsiCalculator.getRSILevel();
                } catch (error) {
                    console.warn('❌ Erro ao obter nível RSI:', error);
                }
            }
            rsiStatusElement.textContent = rsiLevel;

            // Aplicar cores baseadas no nível
            rsiValueElement.classList.remove('rsi-overbought', 'rsi-oversold', 'rsi-neutral');
            rsiStatusElement.classList.remove('rsi-overbought', 'rsi-oversold', 'rsi-neutral');

            if (rsiLevel === 'SOBRECOMPRADO') {
                rsiValueElement.classList.add('rsi-overbought');
                rsiStatusElement.classList.add('rsi-overbought');
            } else if (rsiLevel === 'SOBREVENDIDO') {
                rsiValueElement.classList.add('rsi-oversold');
                rsiStatusElement.classList.add('rsi-oversold');
            } else {
                rsiValueElement.classList.add('rsi-neutral');
                rsiStatusElement.classList.add('rsi-neutral');
            }

            // Atualizar o label do período atual
            const periodLabel = document.querySelector('label[for="rsiPeriod"]');
            if (periodLabel) {
                periodLabel.textContent = `RSI (${this.rsiPeriod}):`;
            }

            console.log(`📊 RSI: ${rsiValue.toFixed(2)} (${rsiLevel})`);
        } else {
            rsiValueElement.textContent = '-';
            rsiStatusElement.textContent = '-';
            rsiValueElement.className = 'stat-value';
            rsiStatusElement.className = 'stat-value';
        }
    }

    processOrderBookData(data) {
        try {
            if (!data || !data.bids || !data.asks) {
                console.warn('❌ Dados do order book inválidos:', data);
                return;
            }

            // Processar bids (ofertas de compra) e asks (ofertas de venda) - tratar valores null/NaN
            const bids = data.bids.map(bid => ({
                price: parseFloat(bid[0]) || 0,
                quantity: parseFloat(bid[1]) || 0
            }));
            const asks = data.asks.map(ask => ({
                price: parseFloat(ask[0]) || 0,
                quantity: parseFloat(ask[1]) || 0
            }));

            if (bids.length === 0 || asks.length === 0) {
                console.warn('❌ Order book vazio');
                return;
            }

            // Melhor bid (maior preço de compra) e melhor ask (menor preço de venda)
            const bestBid = bids[0] || { price: 0, quantity: 0 };
            const bestAsk = asks[0] || { price: 0, quantity: 0 };

            // Calcular spread - tratar divisão por zero
            const spread = (bestAsk.price || 0) - (bestBid.price || 0);
            const spreadPercentage = bestBid.price > 0 ? (spread / bestBid.price) * 100 : 0;

            // Calcular liquidez (soma das quantidades nos primeiros níveis) - tratar valores null
            const bidLiquidity = bids.slice(0, 5).reduce((sum, bid) => {
                const price = bid.price || 0;
                const quantity = bid.quantity || 0;
                return sum + (price * quantity);
            }, 0);
            const askLiquidity = asks.slice(0, 5).reduce((sum, ask) => {
                const price = ask.price || 0;
                const quantity = ask.quantity || 0;
                return sum + (price * quantity);
            }, 0);
            const totalLiquidity = (bidLiquidity || 0) + (askLiquidity || 0);

            // Calcular imbalance (desequilíbrio entre bid/ask) - tratar divisão por zero
            const imbalance = totalLiquidity > 0 ? ((bidLiquidity - askLiquidity) / totalLiquidity) * 100 : 0;

            // Calcular preço médio ponderado - tratar divisão por zero
            const totalQuantity = (bestBid.quantity || 0) + (bestAsk.quantity || 0);
            const weightedMidPrice = totalQuantity > 0 ?
                (((bestBid.price || 0) * (bestAsk.quantity || 0)) + ((bestAsk.price || 0) * (bestBid.quantity || 0))) / totalQuantity : 0;

            // Atualizar estatísticas do order book com arredondamento para 2 casas decimais e tratamento de null
            this.orderBookStats = {
                bestBidPrice: Math.round((bestBid.price || 0) * 100) / 100,
                bestBidQuantity: Math.round((bestBid.quantity || 0) * 100) / 100,
                bestAskPrice: Math.round((bestAsk.price || 0) * 100) / 100,
                bestAskQuantity: Math.round((bestAsk.quantity || 0) * 100) / 100,
                spread: Math.round((spread || 0) * 100) / 100,
                spreadPercentage: Math.round((spreadPercentage || 0) * 100) / 100,
                bidLiquidity: Math.round((bidLiquidity || 0) * 100) / 100,
                askLiquidity: Math.round((askLiquidity || 0) * 100) / 100,
                totalLiquidity: Math.round((totalLiquidity || 0) * 100) / 100,
                imbalance: Math.round((imbalance || 0) * 10000) / 10000, // 4 casas decimais para maior precisão
                weightedMidPrice: Math.round((weightedMidPrice || 0) * 100) / 100,
                lastUpdate: new Date()
            };

            this.currentOrderBook = { bids, asks };
            this.lastOrderBookUpdate = Date.now();

            // Atualizar UI
            this.updateOrderBookDisplay();

            console.log(`📊 Order Book atualizado - Spread: $${spread.toFixed(2)} (${spreadPercentage.toFixed(3)}%), Liquidez: $${totalLiquidity.toFixed(0)}`);

        } catch (error) {
            console.error('❌ Erro ao processar dados do order book:', error);
        }
    }

    updateOrderBookStatus(status, isConnected) {
        const statusElement = document.getElementById('orderBookStatus');
        if (statusElement) {
            statusElement.textContent = status;
            statusElement.className = isConnected ? 'stat-value order-book-status success' : 'stat-value order-book-status error';
        }
    }

    updateOrderBookDisplay() {
        if (!this.orderBookStats || !this.orderBookStats.lastUpdate) {
            return;
        }

        // Atualizar display do spread com 2 casas decimais - tratar null
        const spreadElement = document.getElementById('spreadDisplay');
        if (spreadElement) {
            const spread = this.orderBookStats.spread || 0;
            const spreadPercentage = this.orderBookStats.spreadPercentage || 0;
            spreadElement.textContent = `$${spread.toFixed(2)} (${spreadPercentage.toFixed(2)}%)`;
        }

        // Atualizar display da liquidez com 2 casas decimais - tratar null
        const liquidityElement = document.getElementById('liquidityDisplay');
        if (liquidityElement) {
            const totalLiquidity = this.orderBookStats.totalLiquidity || 0;
            liquidityElement.textContent = `$${totalLiquidity.toFixed(2)}`;
        }

        // Atualizar display do imbalance - tratar null
        const imbalanceElement = document.getElementById('imbalanceDisplay');
        if (imbalanceElement) {
            const imbalanceValue = this.orderBookStats.imbalance || 0;
            const imbalanceText = `${imbalanceValue > 0 ? '+' : ''}${imbalanceValue.toFixed(1)}%`;
            imbalanceElement.textContent = imbalanceText;

            // Colorir baseado no imbalance
            if (imbalanceValue > 5) {
                imbalanceElement.style.color = '#0ecb81'; // Verde para mais bids
            } else if (imbalanceValue < -5) {
                imbalanceElement.style.color = '#f6465d'; // Vermelho para mais asks
            } else {
                imbalanceElement.style.color = '#ffffff'; // Neutro
            }
        }
    }

    resetChart() {
        this.renkoBlocks = [];
        this.lastBlockPrice = 0;
        this.lastBlockDirection = null;
        this.accumulatedVolume = 0;
        this.stats = {
            totalBlocks: 0,
            greenBlocks: 0,
            redBlocks: 0,
            lastDirection: null
        };

        // Reset RSI
        if (this.rsiCalculator && typeof this.rsiCalculator.reset === 'function') {
            try {
                this.rsiCalculator.reset();
            } catch (error) {
                console.warn('❌ Erro ao resetar RSI:', error);
            }
        }
        this.rsiData = [];
        this.updateRSIDisplay();

        if (this.candlestickSeries) {
            this.candlestickSeries.setData([]);
        }

        if (this.rsiSeries) {
            this.rsiSeries.setData([]);
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
