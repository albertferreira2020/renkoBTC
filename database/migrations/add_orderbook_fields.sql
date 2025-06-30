-- Script SQL para adicionar campos do Order Book à tabela botbinance existente
-- Execute este script no seu Supabase para habilitar o salvamento conjunto dos dados

-- Adicionar campos do order book à tabela botbinance existente
ALTER TABLE botbinance
ADD COLUMN IF NOT EXISTS best_bid_price NUMERIC(12, 2);

ALTER TABLE botbinance
ADD COLUMN IF NOT EXISTS best_bid_quantity NUMERIC(15, 8);

ALTER TABLE botbinance
ADD COLUMN IF NOT EXISTS best_ask_price NUMERIC(12, 2);

ALTER TABLE botbinance
ADD COLUMN IF NOT EXISTS best_ask_quantity NUMERIC(15, 8);

ALTER TABLE botbinance ADD COLUMN IF NOT EXISTS spread NUMERIC(12, 2);

ALTER TABLE botbinance
ADD COLUMN IF NOT EXISTS spread_percentage NUMERIC(8, 4);

ALTER TABLE botbinance
ADD COLUMN IF NOT EXISTS bid_liquidity NUMERIC(15, 2);

ALTER TABLE botbinance
ADD COLUMN IF NOT EXISTS ask_liquidity NUMERIC(15, 2);

ALTER TABLE botbinance
ADD COLUMN IF NOT EXISTS total_liquidity NUMERIC(15, 2);

ALTER TABLE botbinance
ADD COLUMN IF NOT EXISTS imbalance NUMERIC(8, 4);

ALTER TABLE botbinance
ADD COLUMN IF NOT EXISTS weighted_mid_price NUMERIC(12, 2);

-- Adicionar comentários nas novas colunas
COMMENT ON COLUMN botbinance.best_bid_price IS 'Melhor preço de compra (bid) do order book';

COMMENT ON COLUMN botbinance.best_bid_quantity IS 'Quantidade no melhor bid';

COMMENT ON COLUMN botbinance.best_ask_price IS 'Melhor preço de venda (ask) do order book';

COMMENT ON COLUMN botbinance.best_ask_quantity IS 'Quantidade no melhor ask';

COMMENT ON COLUMN botbinance.spread IS 'Diferença entre ask e bid (ask - bid)';

COMMENT ON COLUMN botbinance.spread_percentage IS 'Spread em percentual ((ask-bid)/mid_price * 100)';

COMMENT ON COLUMN botbinance.bid_liquidity IS 'Liquidez total dos top 10 bids (preço × quantidade)';

COMMENT ON COLUMN botbinance.ask_liquidity IS 'Liquidez total dos top 10 asks (preço × quantidade)';

COMMENT ON COLUMN botbinance.total_liquidity IS 'Liquidez total (bid_liquidity + ask_liquidity)';

COMMENT ON COLUMN botbinance.imbalance IS 'Desequilíbrio entre bids e asks (-1 a +1)';

COMMENT ON COLUMN botbinance.weighted_mid_price IS 'Preço médio ponderado por volume';

-- Criar índices para os novos campos (opcional, para performance em queries)
CREATE INDEX IF NOT EXISTS idx_botbinance_spread ON botbinance (spread_percentage);

CREATE INDEX IF NOT EXISTS idx_botbinance_liquidity ON botbinance (total_liquidity);

CREATE INDEX IF NOT EXISTS idx_botbinance_imbalance ON botbinance (imbalance);

-- Exemplo de query para verificar dados combinados
-- SELECT
--     created_at,
--     open, close, volume, reversal,
--     best_bid_price, best_ask_price, spread_percentage,
--     total_liquidity, imbalance
-- FROM botbinance
-- WHERE best_bid_price IS NOT NULL
-- ORDER BY created_at DESC
-- LIMIT 10;

-- Query para análise de reversões com contexto de order book
-- SELECT
--     created_at,
--     open, close,
--     CASE
--         WHEN reversal = 1 THEN 'Reversão Alta'
--         WHEN reversal = -1 THEN 'Reversão Baixa'
--         ELSE 'Continuação'
--     END as tipo_movimento,
--     spread_percentage,
--     total_liquidity,
--     imbalance,
--     CASE
--         WHEN imbalance > 0.3 THEN 'Forte pressão compradora'
--         WHEN imbalance < -0.3 THEN 'Forte pressão vendedora'
--         ELSE 'Equilibrado'
--     END as pressao_mercado
-- FROM botbinance
-- WHERE reversal IS NOT NULL
--   AND best_bid_price IS NOT NULL
-- ORDER BY created_at DESC;

-- Query para detectar anomalias de spread durante reversões
-- SELECT
--     created_at,
--     open, close, reversal,
--     spread_percentage,
--     total_liquidity
-- FROM botbinance
-- WHERE reversal IS NOT NULL
--   AND spread_percentage > 0.1  -- Spread > 0.1%
--   AND best_bid_price IS NOT NULL
-- ORDER BY spread_percentage DESC;

-- Estatísticas por hora com dados combinados
-- SELECT
--     DATE_TRUNC('hour', created_at) as hora,
--     COUNT(*) as total_blocos,
--     COUNT(CASE WHEN reversal = 1 THEN 1 END) as reversoes_alta,
--     COUNT(CASE WHEN reversal = -1 THEN 1 END) as reversoes_baixa,
--     AVG(spread_percentage) as spread_medio,
--     AVG(total_liquidity) as liquidez_media,
--     AVG(imbalance) as imbalance_medio
-- FROM botbinance
-- WHERE created_at >= NOW() - INTERVAL '24 hours'
--   AND best_bid_price IS NOT NULL
-- GROUP BY hora
-- ORDER BY hora DESC;