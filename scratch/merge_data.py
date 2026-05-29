import pandas as pd
import numpy as np
import re
import unidecode

file1 = r"C:\monitorbcie\bases\5-  ACTUALIZACION SEGUIMIENTO  ABRIL -2026- BCIE (1).xlsx"
file2 = r"C:\monitorbcie\bases\bdatos_bcie26.xlsx"
output_csv = r"C:\monitorbcie\bases\merged_bcie.csv"

def sanitize_column_name(col):
    # Convert to string
    col = str(col)
    # Remove accents
    col = unidecode.unidecode(col)
    # Convert to lowercase
    col = col.lower()
    # Replace spaces and special characters with underscore
    col = re.sub(r'[^a-z0-9]+', '_', col)
    # Remove leading/trailing underscores
    col = col.strip('_')
    return col

print("Reading files...")
df1 = pd.read_excel(file1, header=4)
df2 = pd.read_excel(file2)

print("Cleaning data...")
df1 = df1.dropna(subset=['CÓDIGO DEL CE'])
df2 = df2.dropna(subset=['Código'])

df1['CÓDIGO DEL CE'] = pd.to_numeric(df1['CÓDIGO DEL CE'], errors='coerce').fillna(0).astype(int)
df2['Código'] = pd.to_numeric(df2['Código'], errors='coerce').fillna(0).astype(int)

df1.set_index('CÓDIGO DEL CE', inplace=True)
df2.set_index('Código', inplace=True)

overlap = set(df1.columns).intersection(set(df2.columns))
df1_clean = df1.drop(columns=list(overlap))

merged = df2.join(df1_clean, how='outer')
merged = merged.reset_index().rename(columns={'index': 'codigo'})

# Sanitize all column names for Supabase compatibility
merged.columns = [sanitize_column_name(c) for c in merged.columns]

# Ensure codigo is integer
merged['codigo'] = merged['codigo'].astype(int)

# Save to CSV
merged.to_csv(output_csv, index=False, encoding='utf-8-sig')

print("Column names after sanitization:")
print(list(merged.columns))
print(f"Successfully merged {len(merged)} rows. Saved to {output_csv}")
