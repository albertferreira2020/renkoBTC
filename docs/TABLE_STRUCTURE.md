# 🗃️ Estrutura da Tabela Supabase - botbinance

## Problema Identificado

Os campos `high` e `low` não estão sendo salvos no banco de dados, possivelmente porque não existem na estrutura atual da tabela.

## 📊 Estrutura Necessária

### Tabela Atual (mínima)
```sql
CREATE TABLE botbinance (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    open DOUBLE PRECISION,
    close DOUBLE PRECISION,
    volume DOUBLE PRECISION
);
```

### Estrutura Completa Recomendada
```sql
CREATE TABLE botbinance (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    open DOUBLE PRECISION NOT NULL,
    close DOUBLE PRECISION NOT NULL,
    high DOUBLE PRECISION NOT NULL,
    low DOUBLE PRECISION NOT NULL,
    volume DOUBLE PRECISION DEFAULT 0
);
```

## 🔧 Scripts de Migração

### 1. Adicionar Colunas Missing
```sql
-- Adicionar coluna high se não existir
ALTER TABLE botbinance 
ADD COLUMN IF NOT EXISTS high DOUBLE PRECISION;

-- Adicionar coluna low se não existir
ALTER TABLE botbinance 
ADD COLUMN IF NOT EXISTS low DOUBLE PRECISION;

-- Atualizar valores null para dados existentes
UPDATE botbinance 
SET high = GREATEST(open, close),
    low = LEAST(open, close)
WHERE high IS NULL OR low IS NULL;

-- Tornar colunas obrigatórias
ALTER TABLE botbinance 
ALTER COLUMN high SET NOT NULL,
ALTER COLUMN low SET NOT NULL;
```

### 2. Verificar Estrutura Atual
```sql
-- Ver todas as colunas da tabela
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'botbinance';
```

## 💻 Implementação no Código

### Tratamento Inteligente
O código agora implementa fallback automático:

```javascript
// 1. Tenta salvar com todos os campos
const fullData = {
    created_at: new Date().toISOString(),
    open: block.open,
    close: block.close,
    high: block.high,
    low: block.low,
    volume: block.volume || 0
};

// 2. Se falhar por campos inexistentes, tenta sem high/low
if (error.includes('high') || error.includes('low')) {
    const fallbackData = {
        created_at: new Date().toISOString(),
        open: block.open,
        close: block.close,
        volume: block.volume || 0
    };
}
```

### Verificação Automática
```javascript
async checkTableStructure() {
    const response = await fetch(`${this.supabaseUrl}/botbinance?limit=1`);
    const data = await response.json();
    
    if (data.length > 0) {
        console.log('📋 Campos disponíveis:', Object.keys(data[0]));
    }
}
```

## 🎯 Dados do Bloco Renko

### Valores High/Low para Renko
```javascript
// Bloco Verde (alta)
high = close  // Preço final (maior)
low = open    // Preço inicial (menor)

// Bloco Vermelho (baixa)  
high = open   // Preço inicial (maior)
low = close   // Preço final (menor)
```

### Exemplo de Dados
```json
{
  "created_at": "2025-06-30T10:30:00.000Z",
  "open": 67500.50,
  "close": 67510.50,
  "high": 67510.50,    // close (bloco verde)
  "low": 67500.50,     // open (bloco verde)
  "volume": 125670.89
}
```

## ⚙️ Configuração do Supabase

### 1. Via Dashboard
1. Acessar o painel do Supabase
2. Ir para "Database" → "Tables"
3. Selecionar tabela `botbinance`
4. Clicar em "Edit table"
5. Adicionar colunas `high` e `low` (DOUBLE PRECISION)

### 2. Via SQL Editor
```sql
-- Executar no SQL Editor do Supabase
ALTER TABLE botbinance 
ADD COLUMN high DOUBLE PRECISION,
ADD COLUMN low DOUBLE PRECISION;

-- Preencher dados existentes
UPDATE botbinance 
SET high = CASE 
    WHEN close > open THEN close 
    ELSE open 
END,
low = CASE 
    WHEN close < open THEN close 
    ELSE open 
END
WHERE high IS NULL;
```

## 🔍 Troubleshooting

### Verificar se Funcionou
```javascript
// No console do navegador, deve aparecer:
"✅ Bloco Renko salvo no banco com sucesso (com high/low)"

// Ou se ainda não tem os campos:
"✅ Bloco Renko salvo no banco (sem high/low)"
```

### Logs Importantes
```javascript
console.log('📋 Campos disponíveis na tabela:', Object.keys(data[0]));
console.log('💾 Salvando bloco Renko no banco de dados:', renkoData);
```

## ✅ Verificação Final

### Dados Completos Esperados
Após a correção, cada registro deve ter:
- ✅ `id`: Auto-incremento
- ✅ `created_at`: Timestamp
- ✅ `open`: Preço abertura
- ✅ `close`: Preço fechamento  
- ✅ `high`: Preço máximo
- ✅ `low`: Preço mínimo
- ✅ `volume`: Volume real

### Query de Teste
```sql
SELECT id, created_at, open, close, high, low, volume 
FROM botbinance 
ORDER BY created_at DESC 
LIMIT 5;
```

**Após implementar as colunas `high` e `low` na tabela do Supabase, todos os dados dos blocos Renko serão salvos completamente!** 📊
