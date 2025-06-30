-- Script SQL para garantir que campos do order book tenham no máximo 2 casas decimais
-- Execute após converter os campos para float8

-- ==== PASSO 1: Atualizar registros existentes para 2 casas decimais ====
UPDATE botbinance
SET
    best_bid_price = ROUND(best_bid_price::numeric, 2)
WHERE
    best_bid_price IS NOT NULL;

UPDATE botbinance
SET
    best_ask_price = ROUND(best_ask_price::numeric, 2)
WHERE
    best_ask_price IS NOT NULL;

UPDATE botbinance
SET
    best_bid_quantity = ROUND(best_bid_quantity::numeric, 2)
WHERE
    best_bid_quantity IS NOT NULL;

UPDATE botbinance
SET
    best_ask_quantity = ROUND(best_ask_quantity::numeric, 2)
WHERE
    best_ask_quantity IS NOT NULL;

UPDATE botbinance
SET
    spread = ROUND(spread::numeric, 2)
WHERE
    spread IS NOT NULL;

UPDATE botbinance
SET
    spread_percentage = ROUND(spread_percentage::numeric, 2)
WHERE
    spread_percentage IS NOT NULL;

UPDATE botbinance
SET
    bid_liquidity = ROUND(bid_liquidity::numeric, 2)
WHERE
    bid_liquidity IS NOT NULL;

UPDATE botbinance
SET
    ask_liquidity = ROUND(ask_liquidity::numeric, 2)
WHERE
    ask_liquidity IS NOT NULL;

UPDATE botbinance
SET
    total_liquidity = ROUND(total_liquidity::numeric, 2)
WHERE
    total_liquidity IS NOT NULL;

UPDATE botbinance
SET
    weighted_mid_price = ROUND(
        weighted_mid_price::numeric,
        2
    )
WHERE
    weighted_mid_price IS NOT NULL;

-- Imbalance pode ter 4 casas decimais (valores pequenos entre -1 e 1)
UPDATE botbinance
SET
    imbalance = ROUND(imbalance::numeric, 4)
WHERE
    imbalance IS NOT NULL;

-- ==== PASSO 2: Criar funções de trigger para garantir 2 casas decimais ====
CREATE OR REPLACE FUNCTION round_orderbook_values()
RETURNS TRIGGER AS $$
BEGIN
    -- Arredondar preços para 2 casas decimais
    IF NEW.best_bid_price IS NOT NULL THEN
        NEW.best_bid_price := ROUND(NEW.best_bid_price::numeric, 2);
    END IF;
    
    IF NEW.best_ask_price IS NOT NULL THEN
        NEW.best_ask_price := ROUND(NEW.best_ask_price::numeric, 2);
    END IF;
    
    IF NEW.best_bid_quantity IS NOT NULL THEN
        NEW.best_bid_quantity := ROUND(NEW.best_bid_quantity::numeric, 2);
    END IF;
    
    IF NEW.best_ask_quantity IS NOT NULL THEN
        NEW.best_ask_quantity := ROUND(NEW.best_ask_quantity::numeric, 2);
    END IF;
    
    IF NEW.spread IS NOT NULL THEN
        NEW.spread := ROUND(NEW.spread::numeric, 2);
    END IF;
    
    IF NEW.spread_percentage IS NOT NULL THEN
        NEW.spread_percentage := ROUND(NEW.spread_percentage::numeric, 2);
    END IF;
    
    IF NEW.bid_liquidity IS NOT NULL THEN
        NEW.bid_liquidity := ROUND(NEW.bid_liquidity::numeric, 2);
    END IF;
    
    IF NEW.ask_liquidity IS NOT NULL THEN
        NEW.ask_liquidity := ROUND(NEW.ask_liquidity::numeric, 2);
    END IF;
    
    IF NEW.total_liquidity IS NOT NULL THEN
        NEW.total_liquidity := ROUND(NEW.total_liquidity::numeric, 2);
    END IF;
    
    IF NEW.weighted_mid_price IS NOT NULL THEN
        NEW.weighted_mid_price := ROUND(NEW.weighted_mid_price::numeric, 2);
    END IF;
    
    -- Imbalance com 4 casas decimais
    IF NEW.imbalance IS NOT NULL THEN
        NEW.imbalance := ROUND(NEW.imbalance::numeric, 4);
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ==== PASSO 3: Criar trigger para aplicar automaticamente ====
DROP TRIGGER IF EXISTS trigger_round_orderbook_values ON botbinance;

CREATE TRIGGER trigger_round_orderbook_values
    BEFORE INSERT OR UPDATE ON botbinance
    FOR EACH ROW
    EXECUTE FUNCTION round_orderbook_values();

-- ==== PASSO 4: Verificar os dados atualizados ====
SELECT
    created_at,
    best_bid_price,
    best_ask_price,
    spread,
    spread_percentage,
    total_liquidity,
    imbalance
FROM botbinance
WHERE
    best_bid_price IS NOT NULL
ORDER BY created_at DESC
LIMIT 5;

-- ==== COMENTÁRIOS ====
/*
RESULTADO ESPERADO:
- Todos os valores monetários com exatamente 2 casas decimais
- Imbalance com 4 casas decimais (valores entre -1 e 1)
- Trigger automático para novos registros
- Dados históricos atualizados

EXEMPLO:
best_bid_price: 107249.50 (sempre 2 casas)
spread: 0.01 (sempre 2 casas)
imbalance: 0.2547 (4 casas para precisão)
*/