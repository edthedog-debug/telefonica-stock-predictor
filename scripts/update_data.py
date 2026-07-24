import yfinance as yf
import json
import os
from datetime import datetime

def fetch_and_update():
    ticker_symbol = "TEF.MC"
    print(f"Obteniendo datos actualizados para {ticker_symbol}...")
    
    # Descargar histórico de 1 año
    stock = yf.Ticker(ticker_symbol)
    df = stock.history(period="1y")

    if df.empty:
        print("Error: No se obtuvieron datos de la API.")
        return

    # Preparar registros con el cierre nominal (coincidente con Google Finance)
    data_records = []
    for index, row in df.iterrows():
        date_str = index.strftime("%Y-%m-%d")
        
        data_records.append({
            "date": date_str,
            "close": round(float(row['Close']), 3),
            "open": round(float(row['Open']), 3),
            "high": round(float(row['High']), 3),
            "low": round(float(row['Low']), 3),
            "volume": int(row['Volume'])
        })

    # Ruta a la carpeta de datos
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    data_dir = os.path.join(base_dir, 'data')
    os.makedirs(data_dir, exist_ok=True)
    
    sample_data_path = os.path.join(data_dir, 'sample-data.json')

    # Guardar en sample-data.json
    with open(sample_data_path, 'w', encoding='utf-8') as f:
        json.dump(data_records, f, indent=2, ensure_ascii=False)

    print(f"Éxito: Se han guardado {len(data_records)} registros en {sample_data_path}.")

    # Actualizar predictions.json si existe
    predictions_path = os.path.join(data_dir, 'predictions.json')
    if os.path.exists(predictions_path):
        try:
            with open(predictions_path, 'r', encoding='utf-8') as f:
                pred_data = json.load(f)
            
            latest_entry = data_records[-1]
            pred_data['last_updated'] = latest_entry['date']
            pred_data['last_close'] = latest_entry['close']
            
            with open(predictions_path, 'w', encoding='utf-8') as f:
                json.dump(pred_data, f, indent=2, ensure_ascii=False)
            print(f"Éxito: `predictions.json` actualizado con la última cotización ({latest_entry['close']} €).")
        except Exception as e:
            print(f"Aviso: No se pudo actualizar predictions.json: {e}")

if __name__ == "__main__":
    fetch_and_update()
