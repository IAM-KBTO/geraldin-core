#!/bin/bash

# Acepta argumentos como: play-pause, next, previous
COMANDO=$1

if [ -z "$COMANDO" ]; then
    echo "Error: Debes especificar una acción (play-pause, next, previous)."
    exit 1
fi

playerctl $COMANDO
echo "Comando multimedia '$COMANDO' ejecutado."