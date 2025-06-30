# Campo Reversal - Sistema Renko

## Descrição
O campo `reversal` foi adicionado à tabela `botbinance` para identificar blocos de reversão no gráfico Renko.

## Estrutura do Campo

### Tipo de Dados
- **Tipo**: `int2` (smallint)
- **Valores permitidos**: 
  - `1`: Reversão de alta (mudança de tendência de baixa para alta)
  - `-1`: Reversão de baixa (mudança de tendência de alta para baixa)
  - `null`: Bloco de continuação (não há mudança de tendência)

## Lógica de Implementação

### Critérios para Reversão
1. **Reversão de Alta (`reversal = 1`)**:
   - Ocorre quando a tendência anterior era de baixa (`lastBlockDirection = 'down'`)
   - O preço atual sobe mais de 2 blocos Renko (2 × blockSize) em relação ao último bloco
   - Exemplo: Se o blockSize é $10 e o último bloco foi $100, reversão ocorre se preço >= $120

2. **Reversão de Baixa (`reversal = -1`)**:
   - Ocorre quando a tendência anterior era de alta (`lastBlockDirection = 'up'`)
   - O preço atual desce mais de 2 blocos Renko (2 × blockSize) em relação ao último bloco
   - Exemplo: Se o blockSize é $10 e o último bloco foi $100, reversão ocorre se preço <= $80

3. **Continuação (`reversal = null`)**:
   - Blocos que seguem a mesma direção da tendência anterior
   - Primeiro bloco do sistema (não há tendência anterior)

## Implementação no Código

### Método createRenkoBlock
```javascript
createRenkoBlock(open, close, isGreen, time, volume = 0, reversal = null)
```

### Chamadas Atualizadas
```javascript
// Continuação de alta
this.createRenkoBlock(lastPrice, lastPrice + blockSize, true, time, volume, null);

// Reversão para baixa
this.createRenkoBlock(lastPrice, lastPrice - blockSize, false, time, volume, -1);

// Continuação de baixa
this.createRenkoBlock(lastPrice, lastPrice - blockSize, false, time, volume, null);

// Reversão para alta
this.createRenkoBlock(lastPrice, lastPrice + blockSize, true, time, volume, 1);
```

## Salvamento no Banco de Dados

### Tentativas de Salvamento (Fallback)
1. **Primeira tentativa**: Salva com todos os campos incluindo `reversal`
2. **Segunda tentativa**: Se `high/low` não existem, salva sem eles mas mantém `reversal`
3. **Terceira tentativa**: Se `reversal` não existe, salva sem ele
4. **Quarta tentativa**: Salva apenas campos básicos (`open`, `close`, `volume`)

### Estrutura SQL Recomendada
```sql
-- Adicionar coluna reversal à tabela existente
ALTER TABLE botbinance ADD COLUMN reversal int2;

-- Ou criar tabela completa
CREATE TABLE botbinance (
    id SERIAL PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    open NUMERIC(10,2) NOT NULL,
    close NUMERIC(10,2) NOT NULL,
    high NUMERIC(10,2),
    low NUMERIC(10,2),
    volume NUMERIC(15,2) DEFAULT 0,
    reversal int2
);
```

## Logs de Debug
O sistema registra nos logs quando uma reversão é detectada:
- `🔄⬆️ REVERSÃO ALTA` para reversão de baixa para alta
- `🔄⬇️ REVERSÃO BAIXA` para reversão de alta para baixa

## Análise de Dados
Com o campo `reversal` populado, é possível:
1. Identificar pontos de mudança de tendência
2. Calcular frequência de reversões
3. Analisar padrões de reversão em diferentes timeframes
4. Criar estratégias baseadas em reversões

## Exemplo de Query
```sql
-- Buscar todas as reversões
SELECT * FROM botbinance WHERE reversal IS NOT NULL ORDER BY created_at DESC;

-- Contar reversões por tipo
SELECT 
    reversal,
    COUNT(*) as quantidade,
    CASE 
        WHEN reversal = 1 THEN 'Reversão Alta'
        WHEN reversal = -1 THEN 'Reversão Baixa'
    END as tipo
FROM botbinance 
WHERE reversal IS NOT NULL 
GROUP BY reversal;
```

## Compatibilidade
- O sistema funciona mesmo se a coluna `reversal` não existir no banco
- Fallback automático garante que os dados continuem sendo salvos
- Logs informativos mostram qual estratégia de salvamento foi usada
