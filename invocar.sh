#!/bin/bash

# Ruta absoluta a tu proyecto
PROYECTO="/home/cabeto/Proyectos/geraldin-core"
cd $PROYECTO

# 1. Comprobar si el cerebro (Node.js) está corriendo. Si no, lo levantamos en modo silencioso.
if ! pgrep -f "node index.js" > /dev/null; then
    # Lo lanzamos en segundo plano para que no bloquee nada
    nohup node index.js > log_geraldine.txt 2>&1 &
    
    # Le damos 2 segundos al servidor para que levante los WebSockets y la API
    sleep 2 
fi

# 2. Abrir la interfaz visual (el Holograma en Vivaldi Modo App)
vivaldi-stable --app="file://$PROYECTO/ui.html" &
# Pequeña pausa para asegurar que el navegador cargó el HTML
sleep 1 

# 3. El Toque en el Hombro: Disparamos el endpoint oculto para activar el micrófono y la visión
curl -s http://localhost:3000/activar > /dev/null`