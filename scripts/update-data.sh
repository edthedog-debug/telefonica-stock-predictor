#!/bin/bash
set -e

echo "Iniciando actualización de precios..."
python3 scripts/update_data.py
echo "Proceso completado correctamente."
