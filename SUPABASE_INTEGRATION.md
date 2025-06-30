# Integração com Supabase - Gráfico Renko BTC

## Configuração do Banco de Dados

A aplicação está configurada para salvar automaticamente cada bloco Renko criado na tabela `botbinance` do Supabase.

### Configurações

- **URL do Supabase**: `http://37.27.214.207:8097/rest/v1`
- **Tabela**: `botbinance`
- **API Key**: Configurada no código

### Estrutura dos Dados Salvos

Cada bloco Renko salvo contém os seguintes campos:

```json
{
  "created_at": "2025-06-30T10:30:00.000Z",
  "open": 67500.50,
  "close": 67510.50,
  "high": 67510.50,
  "low": 67500.50,
  "volume": 0
}
```

### Campos da Tabela

Baseado na estrutura da tabela `botbinance`:

- `id` (int8): Chave primária auto-incrementada
- `created_at` (timestamptz): Timestamp de criação do bloco
- `open` (float8): Preço de abertura do bloco Renko
- `close` (float8): Preço de fechamento do bloco Renko
- `high` (float8): Preço máximo do bloco
- `low` (float8): Preço mínimo do bloco
- `volume` (float8): Volume (atualmente configurado como 0)

### Funcionamento

1. **Criação de Bloco**: Sempre que um novo bloco Renko é criado (baseado no movimento de preço do BTC), o método `registerBlockInSupabase()` é chamado.

2. **Validação**: O sistema valida se o bloco contém dados válidos antes de tentar salvar.

3. **Envio para API**: Os dados são enviados via POST para a API REST do Supabase.

4. **Feedback Visual**: O status do salvamento é exibido na interface:
   - ✅ Verde: Bloco salvo com sucesso
   - ❌ Vermelho: Erro ao salvar (com mensagem de erro)

### Status de Salvamento

O status do banco de dados é exibido em tempo real na seção de estatísticas:
- **Status BD**: Mostra se o último bloco foi salvo com sucesso ou se houve erro

### Logs

Todos os eventos de salvamento são registrados no console do navegador:
- `💾 Salvando bloco Renko no banco de dados:` - Início do processo
- `✅ Bloco Renko salvo no banco com sucesso` - Sucesso
- `❌ Erro ao salvar bloco Renko no banco:` - Erro com detalhes

### Tratamento de Erros

O sistema inclui tratamento robusto de erros:
- Validação de dados antes do envio
- Verificação de resposta HTTP
- Exibição de mensagens de erro específicas
- Timeout automático das mensagens de status

### Exemplo de Uso

```javascript
// Exemplo de dados que são salvos automaticamente
const blockData = {
  created_at: new Date().toISOString(),
  open: 67500.50,
  close: 67510.50,
  high: 67510.50,
  low: 67500.50,
  volume: 0
};
```

### Considerações

- O campo `volume` está atualmente configurado como 0, mas pode ser ajustado no futuro se dados de volume estiverem disponíveis
- Cada bloco Renko é salvo individualmente, garantindo que todos os movimentos sejam registrados
- A aplicação continua funcionando mesmo se houver problemas de conectividade com o banco (não bloqueia a interface)
