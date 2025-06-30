# Correção dos Marcadores de Reversão - Apenas Seta Menor

## Problema Identificado

O sistema estava criando dois tipos de marcadores visuais para reversões no gráfico Renko:
1. **Seta grande** - usando a propriedade `shape: 'arrowUp'/'arrowDown'` da biblioteca LightweightCharts
2. **Seta pequena** - usando emojis na propriedade `text: '⬆'/'⬇'`

Isso resultava em dois ícones sobrepostos no gráfico, causando poluição visual.

## Solução Implementada

Removida a propriedade `shape` dos marcadores, mantendo apenas o `text` com emojis de setas menores.

### Antes:
```javascript
this.reversalMarkers.push({
    time: block.time,
    position: 'aboveBar',
    color: '#0ecb81',
    shape: 'arrowUp',    // ← REMOVIDO (seta grande)
    text: '⬆',           // ← MANTIDO (seta pequena)
    size: 2
});
```

### Depois:
```javascript
this.reversalMarkers.push({
    time: block.time,
    position: 'aboveBar',
    color: '#0ecb81',
    text: '⬆',           // ← Apenas seta pequena
    size: 2
});
```

## Funções Corrigidas

1. **`addReversalMarker(block)`** - Adiciona marcador quando um novo bloco de reversão é criado
2. **`updateReversalMarkers()`** - Reconstrói todos os marcadores dos blocos históricos
3. **`addTestReversalMarkers()`** - Função de teste (usa `updateReversalMarkers` já corrigida)

## Resultado

- ✅ Apenas uma seta pequena (emoji) por reversão
- ✅ Visual mais limpo e menos poluído
- ✅ Cores mantidas: verde (⬆) para alta, vermelho (⬇) para baixa
- ✅ Posicionamento mantido: acima do bloco para alta, abaixo para baixa

## Tipos de Reversão

- **Reversão de Alta** (`reversal: 1`): Seta verde ⬆ acima do bloco
- **Reversão de Baixa** (`reversal: -1`): Seta vermelha ⬇ abaixo do bloco
- **Continuação** (`reversal: null`): Sem marcador

Os marcadores agora mostram apenas a seta pequena, proporcionando uma visualização mais clara das reversões no gráfico Renko.
