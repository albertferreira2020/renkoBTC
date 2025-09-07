#!/bin/bash

echo "🚀 Instalação Rápida - Gráfico Renko BTC"
echo "========================================"

# Verificar se pnpm está instalado
if ! command -v pnpm &> /dev/null; then
    echo "❌ pnpm não encontrado!"
    echo "📦 Instalando pnpm globalmente..."
    npm install -g pnpm
fi

echo "📦 Instalando dependências com pnpm..."
pnpm install

echo "🔧 Verificando arquivo .env..."
if [ ! -f .env ]; then
    echo "⚠️  Arquivo .env não encontrado!"
    echo "📝 Por favor, configure o arquivo .env com suas credenciais do PostgreSQL"
    echo "📋 Exemplo:"
    echo "   DB_HOST=37.27.214.207"
    echo "   DB_PORT=5432" 
    echo "   DB_NAME=btc"
    echo "   DB_USER=postgres"
    echo "   DB_PASSWORD=sua_senha"
    echo "   PORT=3000"
    exit 1
fi

echo "🗄️  Inicializando banco de dados..."
pnpm run init-db

echo ""
echo "✅ Instalação concluída!"
echo "🚀 Para iniciar o servidor:"
echo "   pnpm start"
echo ""
echo "📊 Acesse: http://localhost:3000"
