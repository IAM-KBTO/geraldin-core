#!/bin/bash
echo "=== REPORTE DEL SISTEMA ==="
echo "RAM:" && free -h | awk '/^Mem:/ {print $3 "/" $2}'
echo "DISCO ROOT:" && df -h / | awk 'NR==2 {print $4 " libre"}'