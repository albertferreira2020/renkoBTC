# 📊 Indicador RSI (Relative Strength Index)

## 🎯 Visão Geral

O RSI (Relative Strength Index) é um indicador de momentum que mede a velocidade e magnitude das mudanças de preço. Foi desenvolvido por J. Welles Wilder Jr. e é amplamente utilizado para identificar condições de sobrecompra e sobrevenda.

## 🧮 Como Funciona

### Fórmula do RSI:
```
RSI = 100 - (100 / (1 + RS))
RS = Média de Ganhos / Média de Perdas
```

### Interpretação:
- **RSI > 70**: Sobrecomprado (possível sinal de venda)
- **RSI < 30**: Sobrevendido (possível sinal de compra)
- **30 ≤ RSI ≤ 70**: Zona neutra

## 🔧 Implementação no Projeto

### Classe RSICalculator
Localizada em `src/js/utils.js`, a classe implementa:

- **Período configurável** (padrão: 14)
- **Cálculo em tempo real** com cada novo preço
- **Média móvel suavizada** (EMA) para maior precisão
- **Classificação automática** (Sobrecomprado/Sobrevendido/Neutro)

### Integração com Interface
- **Controle de período**: Ajustável de 5 a 50 períodos
- **Exibição em tempo real**: Valor atual e status
- **Cores dinâmicas**: Visual diferenciado por nível
- **Reset automático**: Quando o gráfico é redefinido

## 📈 Características da Implementação

### ✨ Funcionalidades:
1. **Cálculo Progressivo**: RSI calculado a cada novo preço recebido
2. **Otimização de Memória**: Mantém apenas dados necessários
3. **Indicação Visual**: Cores diferentes para cada nível
4. **Período Personalizável**: Configuração dinâmica via interface

### 🎨 Interface Visual:
- **RSI Value**: Exibido com fonte monoespaçada para melhor leitura
- **Status Colors**:
  - 🔴 Vermelho: Sobrecomprado (RSI ≥ 70)
  - 🟢 Verde: Sobrevendido (RSI ≤ 30)
  - ⚪ Branco: Neutro (30 < RSI < 70)

## 🛠️ Configuração

### Ajustar Período do RSI:
1. Use o controle "RSI Período" na interface
2. Valores recomendados:
   - **5-9**: Período curto (mais sensível)
   - **14**: Período padrão (equilibrado)
   - **21-50**: Período longo (menos sensível)

### Interpretação dos Sinais:
- **Sobrecomprado**: Considere possibilidade de reversão para baixo
- **Sobrevendido**: Considere possibilidade de reversão para cima
- **Neutro**: Sem sinal claro de reversão

## 📊 Uso com Gráfico Renko

### Combinação Eficaz:
- **Renko**: Mostra mudanças significativas de preço
- **RSI**: Indica força do momentum
- **Juntos**: Confirmação de sinais de entrada/saída

### Estratégias Sugeridas:
1. **Reversão**: RSI sobrecomprado + bloco Renko vermelho
2. **Confirmação**: RSI neutro + sequência de blocos na mesma direção
3. **Entrada**: RSI sobrevendido + primeiro bloco verde após sequência vermelha

## ⚡ Performance

### Otimizações Implementadas:
- **Cálculo Incremental**: Apenas novos dados processados
- **Histórico Limitado**: Mantém últimos 100 valores RSI
- **Memória Controlada**: Remove dados antigos automaticamente

### Monitoramento:
- Console log a cada cálculo RSI
- Indicação visual em tempo real
- Atualização automática do período

## 🔍 Debug e Troubleshooting

### Console Logs:
```javascript
📊 RSI: 65.32 (NEUTRO)
📊 RSI: 72.18 (SOBRECOMPRADO)
📊 RSI: 28.94 (SOBREVENDIDO)
```

### Verificações:
1. **Dados Suficientes**: RSI requer pelo menos período+1 preços
2. **Cálculo Correto**: Verifique médias de ganhos/perdas
3. **Interface Atualizada**: Confirme elementos DOM existem

## 🚀 Próximas Melhorias

### Funcionalidades Futuras:
- [ ] Gráfico RSI separado
- [ ] Alertas automáticos
- [ ] Múltiplos períodos simultâneos
- [ ] Histórico de sinais
- [ ] Backtesting integrado

### Melhorias de Interface:
- [ ] Mini-gráfico do RSI
- [ ] Indicadores visuais no gráfico principal
- [ ] Configurações avançadas
- [ ] Export de dados RSI
