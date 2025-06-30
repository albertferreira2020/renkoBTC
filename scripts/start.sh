#!/bin/bash

# Script para iniciar o servidor local do gráfico Renko
# Para usar: chmod +x start.sh && ./start.sh

echo "🚀 Iniciando Gráfico Renko BTC/USDT..."
echo "📊 Servidor será iniciado na porta 8080"
echo ""

# Verificar se Python está instalado
if command -v python3 &> /dev/null; then
    echo "✅ Python3 encontrado"
    echo "🌐 Abrindo servidor em http://localhost:8080"
    echo ""
    echo "📝 Para parar o servidor: Ctrl+C"
    echo "🔗 Para acessar: http://localhost:8080"
    echo ""
    
    # Tentar abrir no navegador automaticamente (macOS)
    if [[ "$OSTYPE" == "darwin"* ]]; then
        sleep 2 && open http://localhost:8080 &
    fi
    
    # Iniciar servidor HTTP simples
    python3 -m http.server 8080
    
elif command -v python &> /dev/null; then
    echo "✅ Python encontrado"
    echo "🌐 Abrindo servidor em http://localhost:8080"
    echo ""
    
    # Tentar abrir no navegador automaticamente (macOS)
    if [[ "$OSTYPE" == "darwin"* ]]; then
        sleep 2 && open http://localhost:8080 &
    fi
    
    # Iniciar servidor HTTP simples
    python -m http.server 8080
    
else
    echo "❌ Python não encontrado!"
    echo ""
    echo "Para instalar Python:"
    echo "- macOS: brew install python3"
    echo "- Ubuntu/Debian: sudo apt install python3"
    echo "- Windows: Baixe de python.org"
    echo ""
    echo "Alternativamente, abra index.html diretamente no navegador"
    echo "(pode ter limitações de CORS)"
fi
