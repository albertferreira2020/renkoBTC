# 🗄️ Configuração do Banco de Dados

Este diretório contém todos os scripts SQL necessários para configurar o banco de dados Supabase.

## 📂 Estrutura

### `/migrations/`
Scripts SQL para criação e modificação de tabelas:

1. **add_orderbook_fields.sql** - Adiciona campos do order book à tabela principal
2. **alter_orderbook_to_float8.sql** - Converte campos para FLOAT8 (precisão dupla)
3. **alter_orderbook_to_float8_safe.sql** - Versão segura da conversão FLOAT8
4. **round_orderbook_decimals.sql** - Arredonda decimais para otimização
5. **verify_float8_conversion.sql** - Verifica a conversão dos tipos

## 🚀 Como Executar

### 1. Ordem de Execução Recomendada:
```sql
-- 1. Primeiro, adicione os novos campos
\i add_orderbook_fields.sql

-- 2. Execute a conversão segura para FLOAT8
\i alter_orderbook_to_float8_safe.sql

-- 3. Arredonde os decimais
\i round_orderbook_decimals.sql

-- 4. Verifique a conversão
\i verify_float8_conversion.sql
```

### 2. Via Supabase Dashboard:
1. Acesse o Dashboard do Supabase
2. Vá para "SQL Editor"
3. Execute cada script na ordem acima
4. Verifique se não há erros

### 3. Via CLI do Supabase:
```bash
# Se estiver usando Supabase CLI local
supabase db reset
supabase db push
```

## ⚠️ Importante

- **Backup**: Sempre faça backup antes de executar migrações
- **Ordem**: Execute os scripts na ordem numérica
- **Verificação**: Use o script de verificação após cada migração
- **Rollback**: Tenha um plano de rollback para cada migração

## 📊 Estrutura da Tabela Principal

Após executar todas as migrações, a tabela `botbinance` terá:

### Campos Base:
- `id` - Identificador único
- `timestamp` - Data/hora do registro
- `price` - Preço do ativo
- `volume` - Volume negociado

### Campos Order Book:
- `best_bid_price` - Melhor preço de compra
- `best_bid_quantity` - Quantidade da melhor compra
- `best_ask_price` - Melhor preço de venda
- `best_ask_quantity` - Quantidade da melhor venda
- `spread` - Spread entre bid/ask
- `bid_liquidity` - Liquidez total das compras
- `ask_liquidity` - Liquidez total das vendas

## 🔧 Troubleshooting

### Erro de Precisão:
```sql
-- Se houver problemas de precisão, use:
SELECT * FROM verify_float8_conversion;
```

### Erro de Permissão:
```sql
-- Verifique as políticas RLS:
SELECT * FROM pg_policies WHERE tablename = 'botbinance';
```

### Performance:
```sql
-- Crie índices se necessário:
CREATE INDEX IF NOT EXISTS idx_botbinance_timestamp ON botbinance(timestamp);
CREATE INDEX IF NOT EXISTS idx_botbinance_price ON botbinance(price);
```
