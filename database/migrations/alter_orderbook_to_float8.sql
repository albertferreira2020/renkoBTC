-- Script SQL para alterar campos do order book para float8 (double precision)
-- Execute este script no editor SQL do Supabase ou em seu cliente PostgreSQL

-- Alterar campos de preços para float8
ALTER TABLE botbinance
ALTER COLUMN best_bid_price TYPE float8 USING best_bid_price::float8;

ALTER TABLE botbinance
ALTER COLUMN best_ask_price TYPE float8 USING best_ask_price::float8;

-- Alterar campos de quantidades para float8
ALTER TABLE botbinance
ALTER COLUMN best_bid_quantity TYPE float8 USING best_bid_quantity::float8;

ALTER TABLE botbinance
ALTER COLUMN best_ask_quantity TYPE float8 USING best_ask_quantity::float8;

-- Alterar campos de spread para float8
ALTER TABLE botbinance
ALTER COLUMN spread TYPE float8 USING spread::float8;

ALTER TABLE botbinance
ALTER COLUMN spread_percentage TYPE float8 USING spread_percentage::float8;

-- Alterar campos de liquidez para float8
ALTER TABLE botbinance
ALTER COLUMN bid_liquidity TYPE float8 USING bid_liquidity::float8;

ALTER TABLE botbinance
ALTER COLUMN ask_liquidity TYPE float8 USING ask_liquidity::float8;

ALTER TABLE botbinance
ALTER COLUMN total_liquidity TYPE float8 USING total_liquidity::float8;

-- Alterar campo de imbalance para float8
ALTER TABLE botbinance
ALTER COLUMN imbalance TYPE float8 USING imbalance::float8;

-- Alterar campo de preço médio ponderado para float8
ALTER TABLE botbinance
ALTER COLUMN weighted_mid_price TYPE float8 USING weighted_mid_price::float8;

-- Verificar a estrutura atualizada da tabela
SELECT
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE
    table_name = 'botbinance'
    AND column_name IN (
        'best_bid_price',
        'best_ask_price',
        'best_bid_quantity',
        'best_ask_quantity',
        'spread',
        'spread_percentage',
        'bid_liquidity',
        'ask_liquidity',
        'total_liquidity',
        'imbalance',
        'weighted_mid_price'
    )
ORDER BY column_name;

-- Comentário:
-- float8 é equivalente a DOUBLE PRECISION no PostgreSQL
-- Garante precisão de 15-17 dígitos decimais significativos
-- Adequado para valores monetários e cálculos financeiros precisos