# Gráfico Renko BTC/USDT Simplificado

Sistem2. Dados históricos serão carregados do PostgreSQL 3. Novos blocos Renko
serão salvos automaticamente no banco

## 🛠️ Scripts Disponíveis

- `pnpm start` - Inicia o servidor de produção
- `pnpm run dev` - Inicia o servidor em modo desenvolvimento
- `pnpm run init-db` - Inicializa/cria as tabelas do banco
- `pnpm run setup` - Instala todas as dependências

## 🗂️ Estrutura Simplificada

```
├── src/
│   └── js/
│       ├── config.js      # Configurações do projeto
│       ├── script.js      # Lógica principal do gráfico
│       └── utils.js       # Utilitários e RSI
├── server.js              # Servidor Node.js + API
├── index.html             # Interface web
├── init-database.js       # Script de inicialização do BD
├── package.json           # Dependências e scripts
└── .env                   # Configurações do banco
```

## 🔧 API Endpoints

- `GET /api/health` - Status da conexão com banco
- `GET /api/historical-data` - Dados históricos Renko
- `POST /api/renko-data` - Salvar novo bloco Renko
- `GET /api/table-structure` - Estrutura da tabela

## 📈 Recursos

- ✅ Gráficos Renko em tempo real
- ✅ Indicador RSI
- ✅ Conexão direta ao PostgreSQL
- ✅ WebSocket Binance para dados em tempo real
- ✅ Interface web responsiva
- ✅ Salvamento automático no bancosimplificado para exibição de gráficos Renko
  do Bitcoin em tempo real, conectado diretamente ao banco PostgreSQL.

## 🚀 Instalação e Configuração

### Pré-requisitos

- Node.js (>= 14.0.0)
- pnpm (>= 7.0.0)
- Acesso ao banco PostgreSQL

### 1. Instalar dependências

```bash
pnpm install
```

### 2. Configurar banco de dados

1. Edite o arquivo `.env` com suas configurações do PostgreSQL:
   ```env
   DB_HOST=37.27.214.207
   DB_PORT=5432
   DB_NAME=btc
   DB_USER=postgres
   DB_PASSWORD=xxxx
   PORT=3000
   ```

### 3. Inicializar tabelas do banco

```bash
pnpm run init-db
```

### 4. Iniciar o servidor

```bash
pnpm start
```

## 📊 Uso

1. Acesse `http://localhost:3000` no navegador
2. O gráfico será carregado automaticamente
3. Dados históricos serão carregados do PostgreSQL
4. Novos blocos Renko serão salvos automaticamente no banco

## 🗂️ Estrutura do Projeto

```
├── server.js              # Servidor Node.js com API REST
├── init-database.js       # Script para criar tabelas
├── index.html             # Interface web
├── src/
│   └── js/
│       ├── config.js      # Configurações
│       ├── script.js      # Lógica principal do gráfico
│       └── utils.js       # Utilitários (RSI, etc.)
├── .env                   # Configurações do banco (não versionado)
├── .env.example          # Exemplo de configurações
└── package.json          # Dependências
```

## 🔧 API Endpoints

- `GET /` - Interface web
- `GET /api/health` - Status da conexão
- `GET /api/historical-data` - Dados históricos
- `POST /api/renko-data` - Salvar novo bloco
- `GET /api/table-structure` - Estrutura da tabela

## 📈 Funcionalidades

- ✅ Gráfico Renko em tempo real
- ✅ Conexão WebSocket com Binance
- ✅ Indicador RSI
- ✅ Order Book em tempo real
- ✅ Salvamento automático no PostgreSQL
- ✅ Interface responsiva
- ✅ Marcadores de reversão

## 🛠️ Comandos Disponíveis

```bash
npm start       # Iniciar servidor
npm run init-db # Inicializar banco de dados
npm run dev     # Modo desenvolvimento
```

## 📋 Requisitos

- Node.js 14+
- PostgreSQL
- Conexão com internet (para WebSocket Binance)
