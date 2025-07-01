-- Script SQL para converter valores NULL do order book para 0
-- Execute após as migrações de conversão para float8

-- ==== PASSO 1: Converter valores NULL existentes para 0 ====

-- Campos de preços
UPDATE botbinance
SET
    best_bid_price = 0
WHERE
    best_bid_price IS NULL;

UPDATE botbinance
SET
    best_ask_price = 0
WHERE
    best_ask_price IS NULL;

-- Campos de quantidades
UPDATE botbinance
SET
    best_bid_quantity = 0
WHERE
    best_bid_quantity IS NULL;

UPDATE botbinance
SET
    best_ask_quantity = 0
WHERE
    best_ask_quantity IS NULL;

-- Campos de spread
UPDATE botbinance SET spread = 0 WHERE spread IS NULL;

UPDATE botbinance
SET
    spread_percentage = 0
WHERE
    spread_percentage IS NULL;

-- Campos de liquidez
UPDATE botbinance SET bid_liquidity = 0 WHERE bid_liquidity IS NULL;

UPDATE botbinance SET ask_liquidity = 0 WHERE ask_liquidity IS NULL;

UPDATE botbinance
SET
    total_liquidity = 0
WHERE
    total_liquidity IS NULL;

-- Campo de imbalance
UPDATE botbinance SET imbalance = 0 WHERE imbalance IS NULL;

-- Campo de preço médio ponderado
UPDATE botbinance
SET
    weighted_mid_price = 0
WHERE
    weighted_mid_price IS NULL;

-- ==== PASSO 2: Alterar colunas para NOT NULL com DEFAULT 0 ====

-- Alterar campos para NOT NULL com default 0 (opcional)
-- Descomente as linhas abaixo se quiser garantir que novos registros não aceitem NULL

/*
ALTER TABLE botbinance ALTER COLUMN best_bid_price SET NOT NULL;
ALTER TABLE botbinance ALTER COLUMN best_bid_price SET DEFAULT 0;

ALTER TABLE botbinance ALTER COLUMN best_ask_price SET NOT NULL;
ALTER TABLE botbinance ALTER COLUMN best_ask_price SET DEFAULT 0;

ALTER TABLE botbinance ALTER COLUMN best_bid_quantity SET NOT NULL;
ALTER TABLE botbinance ALTER COLUMN best_bid_quantity SET DEFAULT 0;

ALTER TABLE botbinance ALTER COLUMN best_ask_quantity SET NOT NULL;
ALTER TABLE botbinance ALTER COLUMN best_ask_quantity SET DEFAULT 0;

ALTER TABLE botbinance ALTER COLUMN spread SET NOT NULL;
ALTER TABLE botbinance ALTER COLUMN spread SET DEFAULT 0;

ALTER TABLE botbinance ALTER COLUMN spread_percentage SET NOT NULL;
ALTER TABLE botbinance ALTER COLUMN spread_percentage SET DEFAULT 0;

ALTER TABLE botbinance ALTER COLUMN bid_liquidity SET NOT NULL;
ALTER TABLE botbinance ALTER COLUMN bid_liquidity SET DEFAULT 0;

ALTER TABLE botbinance ALTER COLUMN ask_liquidity SET NOT NULL;
ALTER TABLE botbinance ALTER COLUMN ask_liquidity SET DEFAULT 0;

ALTER TABLE botbinance ALTER COLUMN total_liquidity SET NOT NULL;
ALTER TABLE botbinance ALTER COLUMN total_liquidity SET DEFAULT 0;

ALTER TABLE botbinance ALTER COLUMN imbalance SET NOT NULL;
ALTER TABLE botbinance ALTER COLUMN imbalance SET DEFAULT 0;

ALTER TABLE botbinance ALTER COLUMN weighted_mid_price SET NOT NULL;
ALTER TABLE botbinance ALTER COLUMN weighted_mid_price SET DEFAULT 0;
*/

-- ==== PASSO 3: Verificar os resultados ====
SELECT
    COUNT(*) as total_records,
    COUNT(best_bid_price) as records_with_bid_price,
    COUNT(spread) as records_with_spread,
    COUNT(total_liquidity) as records_with_liquidity
FROM botbinance
WHERE
    created_at >= NOW() - INTERVAL '1 day';

-- Mostrar alguns registros para verificação
SELECT
    created_at,
    best_bid_price,
    best_ask_price,
    spread,
    total_liquidity,
    imbalance
FROM botbinance
WHERE
    created_at >= NOW() - INTERVAL '1 hour'
ORDER BY created_at DESC
LIMIT 5;

-- ==== COMENTÁRIOS ====
/*
RESULTADO ESPERADO:
- Todos os valores NULL dos campos do order book convertidos para 0
- Campos numéricos com valores válidos (0.00, 12345.67, etc.)
- Sem valores NULL nos campos do order book
- Cálculos e queries funcionando normalmente

BENEFÍCIOS:
✅ Elimina erros de NULL em cálculos
✅ Interface sempre exibe valores válidos
✅ Compatibilidade com toFixed() e operações matemáticas
✅ Dados consistentes para análises
*/