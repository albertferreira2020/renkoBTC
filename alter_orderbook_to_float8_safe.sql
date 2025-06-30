-- Script SQL SEGURO para alterar campos do order book para float8
-- Inclui backup, verificações e rollback em caso de erro

-- ==== PASSO 1: VERIFICAÇÃO INICIAL ====
-- Verificar estrutura atual da tabela
SELECT 
    column_name, 
    data_type, 
    character_maximum_length,
    numeric_precision,
    numeric_scale,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'botbinance' 
  AND column_name IN (
    'best_bid_price', 'best_ask_price', 'best_bid_quantity', 'best_ask_quantity',
    'spread', 'spread_percentage', 'bid_liquidity', 'ask_liquidity', 
    'total_liquidity', 'imbalance', 'weighted_mid_price'
  )
ORDER BY column_name;

-- ==== PASSO 2: CRIAR BACKUP (OPCIONAL) ====
-- Criar tabela de backup antes das alterações
-- CREATE TABLE botbinance_backup_orderbook AS 
-- SELECT * FROM botbinance WHERE created_at >= NOW() - INTERVAL '1 day';

-- ==== PASSO 3: INICIAR TRANSAÇÃO ====
BEGIN;

-- ==== PASSO 4: ALTERAÇÕES DOS CAMPOS ====

-- Campos de preços
ALTER TABLE botbinance 
ALTER COLUMN best_bid_price TYPE float8 USING CASE 
    WHEN best_bid_price IS NULL THEN NULL 
    ELSE best_bid_price::float8 
END;

ALTER TABLE botbinance 
ALTER COLUMN best_ask_price TYPE float8 USING CASE 
    WHEN best_ask_price IS NULL THEN NULL 
    ELSE best_ask_price::float8 
END;

-- Campos de quantidades
ALTER TABLE botbinance 
ALTER COLUMN best_bid_quantity TYPE float8 USING CASE 
    WHEN best_bid_quantity IS NULL THEN NULL 
    ELSE best_bid_quantity::float8 
END;

ALTER TABLE botbinance 
ALTER COLUMN best_ask_quantity TYPE float8 USING CASE 
    WHEN best_ask_quantity IS NULL THEN NULL 
    ELSE best_ask_quantity::float8 
END;

-- Campos de spread
ALTER TABLE botbinance 
ALTER COLUMN spread TYPE float8 USING CASE 
    WHEN spread IS NULL THEN NULL 
    ELSE spread::float8 
END;

ALTER TABLE botbinance 
ALTER COLUMN spread_percentage TYPE float8 USING CASE 
    WHEN spread_percentage IS NULL THEN NULL 
    ELSE spread_percentage::float8 
END;

-- Campos de liquidez
ALTER TABLE botbinance 
ALTER COLUMN bid_liquidity TYPE float8 USING CASE 
    WHEN bid_liquidity IS NULL THEN NULL 
    ELSE bid_liquidity::float8 
END;

ALTER TABLE botbinance 
ALTER COLUMN ask_liquidity TYPE float8 USING CASE 
    WHEN ask_liquidity IS NULL THEN NULL 
    ELSE ask_liquidity::float8 
END;

ALTER TABLE botbinance 
ALTER COLUMN total_liquidity TYPE float8 USING CASE 
    WHEN total_liquidity IS NULL THEN NULL 
    ELSE total_liquidity::float8 
END;

-- Campo de imbalance
ALTER TABLE botbinance 
ALTER COLUMN imbalance TYPE float8 USING CASE 
    WHEN imbalance IS NULL THEN NULL 
    ELSE imbalance::float8 
END;

-- Campo de preço médio ponderado
ALTER TABLE botbinance 
ALTER COLUMN weighted_mid_price TYPE float8 USING CASE 
    WHEN weighted_mid_price IS NULL THEN NULL 
    ELSE weighted_mid_price::float8 
END;

-- ==== PASSO 5: VERIFICAÇÃO PÓS-ALTERAÇÃO ====
-- Verificar se as alterações foram aplicadas corretamente
SELECT 
    column_name, 
    data_type, 
    numeric_precision,
    numeric_scale,
    is_nullable,
    CASE 
        WHEN data_type = 'double precision' THEN '✅ Convertido para float8'
        ELSE '❌ Não convertido'
    END as status
FROM information_schema.columns 
WHERE table_name = 'botbinance' 
  AND column_name IN (
    'best_bid_price', 'best_ask_price', 'best_bid_quantity', 'best_ask_quantity',
    'spread', 'spread_percentage', 'bid_liquidity', 'ask_liquidity', 
    'total_liquidity', 'imbalance', 'weighted_mid_price'
  )
ORDER BY column_name;

-- ==== PASSO 6: TESTE DE DADOS ====
-- Testar alguns registros para garantir que os dados não foram corrompidos
SELECT 
    created_at,
    best_bid_price,
    spread,
    total_liquidity,
    imbalance
FROM botbinance 
WHERE best_bid_price IS NOT NULL 
ORDER BY created_at DESC 
LIMIT 5;

-- ==== PASSO 7: COMMIT OU ROLLBACK ====
-- Se tudo estiver correto, confirme a transação:
COMMIT;

-- Se houver problemas, desfaça as alterações:
-- ROLLBACK;

-- ==== INFORMAÇÕES TÉCNICAS ====
/*
TIPO float8 (DOUBLE PRECISION):
- Precisão: 15-17 dígitos decimais significativos
- Faixa: ±1.7976931348623157E+308
- Tamanho: 8 bytes
- Adequado para: valores monetários, cálculos financeiros precisos

VANTAGENS da conversão:
✅ Elimina aspas duplas em valores numéricos
✅ Melhor performance em cálculos matemáticos
✅ Compatibilidade com bibliotecas JavaScript (Number)
✅ Índices mais eficientes para consultas numéricas
*/
