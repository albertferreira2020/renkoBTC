# Scripts SQL para Conversão de Campos Order Book para float8

## 📋 Arquivos Criados

1. **`alter_orderbook_to_float8.sql`** - Script básico de conversão
2. **`alter_orderbook_to_float8_safe.sql`** - Script seguro com backup e transações
3. **`verify_float8_conversion.sql`** - Script de verificação pós-conversão

## 🚀 Como Executar

### Opção 1: Script Básico (Mais Rápido)
```sql
-- Execute o arquivo: alter_orderbook_to_float8.sql
-- Converte todos os campos de uma vez
```

### Opção 2: Script Seguro (Recomendado)
```sql
-- Execute o arquivo: alter_orderbook_to_float8_safe.sql
-- Inclui verificações e possibilidade de rollback
```

## 📊 Campos que Serão Convertidos

| Campo | Tipo Atual | Tipo Novo | Descrição |
|-------|------------|-----------|-----------|
| `best_bid_price` | text/numeric | float8 | Melhor preço de compra |
| `best_ask_price` | text/numeric | float8 | Melhor preço de venda |
| `best_bid_quantity` | text/numeric | float8 | Quantidade do melhor bid |
| `best_ask_quantity` | text/numeric | float8 | Quantidade do melhor ask |
| `spread` | text/numeric | float8 | Diferença bid-ask |
| `spread_percentage` | text/numeric | float8 | Spread em percentual |
| `bid_liquidity` | text/numeric | float8 | Liquidez total dos bids |
| `ask_liquidity` | text/numeric | float8 | Liquidez total dos asks |
| `total_liquidity` | text/numeric | float8 | Liquidez total |
| `imbalance` | text/numeric | float8 | Desequilíbrio bid/ask |
| `weighted_mid_price` | text/numeric | float8 | Preço médio ponderado |

## ⚠️ Antes de Executar

1. **Faça backup** dos dados importantes
2. **Teste em ambiente de desenvolvimento** se possível
3. **Execute durante horário de baixo uso** se em produção
4. **Tenha plano de rollback** preparado

## ✅ Verificação Pós-Conversão

Execute o script `verify_float8_conversion.sql` para confirmar:

- ✅ Campos convertidos para `double precision`
- ✅ Valores sem aspas duplas
- ✅ Operações matemáticas funcionando
- ✅ Dados preservados corretamente

## 🎯 Benefícios da Conversão

- **Elimina aspas duplas** nos valores salvos
- **Melhora performance** em cálculos e consultas
- **Compatibilidade total** com JavaScript `Number()`
- **Índices mais eficientes** para campos numéricos
- **Validação automática** de tipos pelo banco

## 🔧 Exemplo de Uso no Supabase

1. Acesse o **SQL Editor** no painel do Supabase
2. Copie e cole o conteúdo de `alter_orderbook_to_float8_safe.sql`
3. Execute o script
4. Verifique os resultados com `verify_float8_conversion.sql`

## 📝 Logs Esperados

Após a conversão, os logs do JavaScript devem mostrar:
```javascript
📊 Incluindo dados do order book no registro (como números, sem aspas)
```

E no banco de dados os valores devem aparecer como:
```
107249.50  // ✅ Sem aspas
```

Em vez de:
```
"107249.50"  // ❌ Com aspas
```
