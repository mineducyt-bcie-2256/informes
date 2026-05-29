import pandas as pd
import json

file1 = r"C:\monitorbcie\bases\5-  ACTUALIZACION SEGUIMIENTO  ABRIL -2026- BCIE (1).xlsx"
file2 = r"C:\monitorbcie\bases\bdatos_bcie26.xlsx"

try:
    df1 = pd.read_excel(file1)
    df2 = pd.read_excel(file2)
    
    info1 = {"columns": df1.columns.tolist(), "sample": df1.head(2).to_dict('records')}
    info2 = {"columns": df2.columns.tolist(), "sample": df2.head(2).to_dict('records')}
    
    with open("excel_info.json", "w", encoding='utf-8') as f:
        json.dump({"file1": info1, "file2": info2}, f, indent=4, default=str)
    
    print("Successfully read files and wrote info to excel_info.json")
except Exception as e:
    print("Error:", e)
