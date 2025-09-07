const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Configuração do banco PostgreSQL usando variáveis de ambiente
const pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    ssl: false,
    connectionTimeoutMillis: 5000,
    idleTimeoutMillis: 30000,
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('.'));

// Servir arquivos estáticos
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// API para obter dados históricos
app.get('/api/historical-data', async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 1000;

        // Ajustar query conforme a estrutura da tabela do banco
        const query = `
            SELECT * FROM botbinance 
            ORDER BY created_at ASC 
            LIMIT $1
        `;

        const result = await pool.query(query, [limit]);
        res.json(result.rows);
    } catch (error) {
        console.error('Erro ao buscar dados históricos:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// API para salvar novos dados
app.post('/api/renko-data', async (req, res) => {
    try {
        // console.log('📥 Dados recebidos no servidor:', req.body);

        const {
            open, close, high, low, volume, reversal,
            best_bid_price, best_bid_quantity, best_ask_price, best_ask_quantity,
            spread, spread_percentage, bid_liquidity, ask_liquidity,
            total_liquidity, imbalance, weighted_mid_price
        } = req.body;

        // console.log('📊 Order book dados extraídos:', {
        //     best_bid_price, best_bid_quantity, best_ask_price, best_ask_quantity,
        //     spread, spread_percentage, bid_liquidity, ask_liquidity,
        //     total_liquidity, imbalance, weighted_mid_price
        // });

        const query = `
            INSERT INTO botbinance (
                open, close, high, low, volume, reversal,
                best_bid_price, best_bid_quantity, best_ask_price, best_ask_quantity,
                spread, spread_percentage, bid_liquidity, ask_liquidity,
                total_liquidity, imbalance, weighted_mid_price, created_at
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, NOW())
            RETURNING *
        `;

        const values = [
            open, close, high, low, volume || 0, reversal || 0,
            best_bid_price || 0, best_bid_quantity || 0,
            best_ask_price || 0, best_ask_quantity || 0,
            spread || 0, spread_percentage || 0,
            bid_liquidity || 0, ask_liquidity || 0,
            total_liquidity || 0, imbalance || 0, weighted_mid_price || 0
        ];

        // console.log('💾 Valores para inserção:', values);

        const result = await pool.query(query, values);
        // console.log('✅ Dados salvos no banco:', result.rows[0]);
        res.json(result.rows[0]);
    } catch (error) {
        console.error('Erro ao salvar dados:', error);
        res.status(500).json({ error: 'Erro interno do servidor', details: error.message });
    }
});

// API para verificar estrutura da tabela
app.get('/api/table-structure', async (req, res) => {
    try {
        const query = `
            SELECT column_name, data_type, is_nullable
            FROM information_schema.columns 
            WHERE table_name = 'botbinance'
            ORDER BY ordinal_position
        `;

        const result = await pool.query(query);
        res.json(result.rows);
    } catch (error) {
        console.error('Erro ao verificar estrutura da tabela:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// Teste de conexão
app.get('/api/health', async (req, res) => {
    try {
        const result = await pool.query('SELECT NOW()');
        res.json({
            status: 'ok',
            database: 'connected',
            timestamp: result.rows[0].now
        });
    } catch (error) {
        console.error('Erro de conexão:', error);
        res.status(500).json({
            status: 'error',
            database: 'disconnected',
            error: error.message
        });
    }
});

// Iniciar servidor
app.listen(PORT, () => {
    console.log(`🚀 Servidor rodando em http://localhost:${PORT}`);
    console.log(`📊 Interface do gráfico Renko disponível em http://localhost:${PORT}`);
});

// Testar conexão com banco na inicialização
pool.connect()
    .then(() => console.log('✅ Conectado ao banco PostgreSQL'))
    .catch(err => console.error('❌ Erro ao conectar ao banco PostgreSQL:', err));
