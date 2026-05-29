import pandas as pd
import json

file1 = r"C:\monitorbcie\bases\5-  ACTUALIZACION SEGUIMIENTO  ABRIL -2026- BCIE (1).xlsx"

try:
    # Read without assuming header to see raw rows
    df1 = pd.read_excel(file1, header=None)
    
    info1 = {"sample": df1.head(10).to_dict('records')}
    
    with open("excel_info_2.json", "w", encoding='utf-8') as f:
        json.dump(info1, f, indent=4, default=str)
    
    print("Successfully read file1")
except Exception as e:
    print("Error:", e)
