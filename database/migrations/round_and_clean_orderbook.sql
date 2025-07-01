-- Script SQL para criar trigger que arredonda valores do order book e converte NULL para 0
-- Execute após as migrações de conversão para float8 e após round_orderbook_decimals.sql

-- ==== FUNÇÃO DE TRIGGER ATUALIZADA ====
CREATE OR REPLACE FUNCTION round_and_clean_orderbook_values()
RETURNS TRIGGER AS $$
BEGIN
    -- Arredondar preços para 2 casas decimais e converter NULL para 0
    IF NEW.best_bid_price IS NULL THEN
        NEW.best_bid_price := 0;
    ELSE
        NEW.best_bid_price := ROUND(NEW.best_bid_price::numeric, 2);
    END IF;
    
    IF NEW.best_ask_price IS NULL THEN
        NEW.best_ask_price := 0;
    ELSE
        NEW.best_ask_price := ROUND(NEW.best_ask_price::numeric, 2);
    END IF;
    
    -- Arredondar quantidades para 2 casas decimais e converter NULL para 0
    IF NEW.best_bid_quantity IS NULL THEN
        NEW.best_bid_quantity := 0;
    ELSE
        NEW.best_bid_quantity := ROUND(NEW.best_bid_quantity::numeric, 2);
    END IF;
    
    IF NEW.best_ask_quantity IS NULL THEN
        NEW.best_ask_quantity := 0;
    ELSE
        NEW.best_ask_quantity := ROUND(NEW.best_ask_quantity::numeric, 2);
    END IF;
    
    -- Arredondar spread para 2 casas decimais e converter NULL para 0
    IF NEW.spread IS NULL THEN
        NEW.spread := 0;
    ELSE
        NEW.spread := ROUND(NEW.spread::numeric, 2);
    END IF;
    
    IF NEW.spread_percentage IS NULL THEN
        NEW.spread_percentage := 0;
    ELSE
        NEW.spread_percentage := ROUND(NEW.spread_percentage::numeric, 2);
    END IF;
    
    -- Arredondar liquidez para 2 casas decimais e converter NULL para 0
    IF NEW.bid_liquidity IS NULL THEN
        NEW.bid_liquidity := 0;
    ELSE
        NEW.bid_liquidity := ROUND(NEW.bid_liquidity::numeric, 2);
    END IF;
    
    IF NEW.ask_liquidity IS NULL THEN
        NEW.ask_liquidity := 0;
    ELSE
        NEW.ask_liquidity := ROUND(NEW.ask_liquidity::numeric, 2);
    END IF;
    
    IF NEW.total_liquidity IS NULL THEN
        NEW.total_liquidity := 0;
    ELSE
        NEW.total_liquidity := ROUND(NEW.total_liquidity::numeric, 2);
    END IF;
    
    -- Arredondar preço médio ponderado para 2 casas decimais e converter NULL para 0
    IF NEW.weighted_mid_price IS NULL THEN
        NEW.weighted_mid_price := 0;
    ELSE
        NEW.weighted_mid_price := ROUND(NEW.weighted_mid_price::numeric, 2);
    END IF;
    
    -- Imbalance com 4 casas decimais e converter NULL para 0
    IF NEW.imbalance IS NULL THEN
        NEW.imbalance := 0;
    ELSE
        NEW.imbalance := ROUND(NEW.imbalance::numeric, 4);
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ==== APLICAR O NOVO TRIGGER ====
-- Remover trigger anterior
DROP TRIGGER IF EXISTS trigger_round_orderbook_values ON botbinance;

DROP TRIGGER IF EXISTS trigger_round_and_clean_orderbook_values ON botbinance;

-- Criar novo trigger
CREATE TRIGGER trigger_round_and_clean_orderbook_values
    BEFORE INSERT OR UPDATE ON botbinance
    FOR EACH ROW
    EXECUTE FUNCTION round_and_clean_orderbook_values();

-- ==== VERIFICAR FUNCIONAMENTO ====
-- O trigger será aplicado automaticamente em novos registros
-- Para testar, você pode inserir um registro com valores NULL:

/*
INSERT INTO botbinance (
created_at, open, high, low, close, volume,
best_bid_price, spread, total_liquidity
) VALUES (
NOW(), 100000, 100010, 99990, 100005, 1000,
NULL, NULL, NULL  -- Estes valores serão convertidos para 0
);
*/

-- ==== COMENTÁRIOS ====
/*
FUNCIONALIDADES DO TRIGGER:
✅ Arredonda todos os valores monetários para 2 casas decimais
✅ Arredonda imbalance para 4 casas decimais  
✅ Converte valores NULL para 0 automaticamente
✅ Aplica-se a INSERT e UPDATE
✅ Garante consistência de dados

RESULTADO ESPERADO:
- Valores NULL viram 0.00
- Valores com muitas casas decimais são arredondados
- Dados sempre consistentes no banco
- Interface nunca exibe "null" ou "NaN"
*/