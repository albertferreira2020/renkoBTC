#!/usr/bin/env node

const { Pool } = require('pg');
require('dotenv').config();

// Configuração do banco PostgreSQL
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

// SQL para criar a tabela botbinance
const createTableSQL = `
CREATE TABLE IF NOT EXISTS botbinance (
    id SERIAL PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    open DECIMAL(12,2) NOT NULL,
    close DECIMAL(12,2) NOT NULL,
    high DECIMAL(12,2),
    low DECIMAL(12,2),
    volume DECIMAL(15,2) DEFAULT 0,
    reversal INTEGER DEFAULT 0,
    
    -- Campos do Order Book (opcionais)
    best_bid_price DECIMAL(12,2),
    best_bid_quantity DECIMAL(15,2),
    best_ask_price DECIMAL(12,2),
    best_ask_quantity DECIMAL(15,2),
    spread DECIMAL(12,2),
    spread_percentage DECIMAL(8,4),
    bid_liquidity DECIMAL(18,2),
    ask_liquidity DECIMAL(18,2),
    total_liquidity DECIMAL(18,2),
    imbalance DECIMAL(8,4),
    weighted_mid_price DECIMAL(12,2)
);
`;

// SQL para criar índices para melhor performance
const createIndexesSQL = `
CREATE INDEX IF NOT EXISTS idx_botbinance_created_at ON botbinance(created_at);
CREATE INDEX IF NOT EXISTS idx_botbinance_open_close ON botbinance(open, close);
`;

async function initializeDatabase() {
    try {
        console.log('🔗 Conectando ao banco PostgreSQL...');

        // Testar conexão
        await pool.query('SELECT NOW()');
        console.log('✅ Conexão estabelecida com sucesso');

        // Criar tabela
        console.log('📊 Criando tabela botbinance...');
        await pool.query(createTableSQL);
        console.log('✅ Tabela botbinance criada/verificada');

        // Criar índices
        console.log('🔍 Criando índices...');
        await pool.query(createIndexesSQL);
        console.log('✅ Índices criados/verificados');

        // Verificar estrutura da tabela
        console.log('📋 Verificando estrutura da tabela...');
        const result = await pool.query(`
            SELECT column_name, data_type, is_nullable, column_default
            FROM information_schema.columns 
            WHERE table_name = 'botbinance'
            ORDER BY ordinal_position
        `);

        console.log('\n📊 Estrutura da tabela botbinance:');
        console.log('┌────────────────────────┬──────────────────┬──────────┬─────────────────┐');
        console.log('│ Campo                  │ Tipo             │ Nullable │ Default         │');
        console.log('├────────────────────────┼──────────────────┼──────────┼─────────────────┤');

        result.rows.forEach(row => {
            const campo = row.column_name.padEnd(22);
            const tipo = row.data_type.padEnd(16);
            const nullable = row.is_nullable.padEnd(8);
            const defaultVal = (row.column_default || '').padEnd(15);
            console.log(`│ ${campo} │ ${tipo} │ ${nullable} │ ${defaultVal} │`);
        });

        console.log('└────────────────────────┴──────────────────┴──────────┴─────────────────┘');

        // Verificar se há dados na tabela
        const countResult = await pool.query('SELECT COUNT(*) as total FROM botbinance');
        const totalRecords = countResult.rows[0].total;
        console.log(`\n📈 Total de registros na tabela: ${totalRecords}`);

        if (totalRecords > 0) {
            // Mostrar alguns registros de exemplo
            const sampleResult = await pool.query(`
                SELECT created_at, open, close, volume, reversal 
                FROM botbinance 
                ORDER BY created_at DESC 
                LIMIT 3
            `);

            console.log('\n📊 Últimos 3 registros:');
            sampleResult.rows.forEach((row, index) => {
                console.log(`${index + 1}. ${row.created_at} - Open: ${row.open}, Close: ${row.close}, Volume: ${row.volume}`);
            });
        }

        console.log('\n🎉 Banco de dados inicializado com sucesso!');

    } catch (error) {
        console.error('❌ Erro ao inicializar banco de dados:', error);
        process.exit(1);
    } finally {
        await pool.end();
        console.log('🔚 Conexão fechada');
    }
}

// Executar inicialização
if (require.main === module) {
    initializeDatabase();
}

module.exports = { initializeDatabase };
