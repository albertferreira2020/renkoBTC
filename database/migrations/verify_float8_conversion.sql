-- Script de verificação pós-conversão para float8
-- Execute após aplicar o script de alteração dos campos

-- ==== VERIFICAÇÃO 1: ESTRUTURA DOS CAMPOS ====
SELECT
    column_name,
    data_type,
    numeric_precision,
    numeric_scale,
    is_nullable,
    CASE
        WHEN data_type = 'double precision' THEN '✅'
        WHEN data_type = 'numeric' THEN '⚠️ Ainda numeric'
        WHEN data_type = 'text' THEN '❌ Ainda text'
        ELSE '❓ Tipo desconhecido'
    END as status_conversao
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

-- ==== VERIFICAÇÃO 2: TESTE DE VALORES SEM ASPAS ====
-- Verificar se os valores aparecem como números puros (sem aspas)
SELECT
    created_at,
    best_bid_price,
    best_ask_price,
    spread,
    spread_percentage,
    total_liquidity,
    imbalance,
    weighted_mid_price
FROM botbinance
WHERE
    best_bid_price IS NOT NULL
ORDER BY created_at DESC
LIMIT 3;

-- ==== VERIFICAÇÃO 3: TESTE DE OPERAÇÕES MATEMÁTICAS ====
-- Se os campos foram convertidos corretamente, operações matemáticas devem funcionar
SELECT
    'Teste matemático' as teste,
    AVG(best_bid_price) as media_bid,
    SUM(total_liquidity) as soma_liquidez,
    MAX(spread_percentage) as max_spread,
    MIN(imbalance) as min_imbalance
FROM botbinance
WHERE
    created_at >= NOW() - INTERVAL '1 hour'
    AND best_bid_price IS NOT NULL;

-- ==== VERIFICAÇÃO 4: CONTAGEM DE REGISTROS ====
SELECT
    COUNT(*) as total_registros,
    COUNT(best_bid_price) as com_bid_price,
    COUNT(spread) as com_spread,
    COUNT(total_liquidity) as com_liquidez,
    ROUND(
        COUNT(best_bid_price)::float / COUNT(*)::float * 100,
        2
    ) as percentual_com_orderbook
FROM botbinance
WHERE
    created_at >= NOW() - INTERVAL '24 hours';

-- ==== VERIFICAÇÃO 5: ÚLTIMOS REGISTROS DETALHADOS ====
-- Para inspecionar visualmente se não há aspas duplas
SELECT created_at, open,
close, '|' as separador, best_bid_price, best_ask_price, spread, '|' as separador2, bid_liquidity, ask_liquidity, total_liquidity, '|' as separador3, imbalance, weighted_mid_price
FROM botbinance
ORDER BY created_at DESC
LIMIT 5;

-- ==== RESULTADO ESPERADO ====
/*
✅ SUCESSO se:
- data_type = 'double precision' para todos os campos
- Valores aparecem SEM aspas duplas
- Operações matemáticas funcionam sem erro
- Percentual de registros com order book > 0%

❌ PROBLEMA se:
- data_type ainda for 'text' ou 'character varying'
- Valores aparecerem com aspas duplas: "107249.50"
- Operações matemáticas gerarem erro
- Campos aparecerem como NULL quando deveriam ter valores
*/