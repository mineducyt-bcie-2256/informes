import pandas as pd
import numpy as np

csv_file = r"C:\monitorbcie\bases\merged_bcie.csv"
sql_file = r"C:\monitorbcie\bases\init.sql"

df = pd.read_csv(csv_file)

# Drop duplicates based on 'codigo'
df = df.drop_duplicates(subset=['codigo'])

# Fill NaNs
df = df.fillna('NULL')

def get_sql_type(dtype):
    if pd.api.types.is_integer_dtype(dtype):
        return "BIGINT"
    elif pd.api.types.is_float_dtype(dtype):
        return "FLOAT"
    else:
        return "TEXT"

columns = []
for col in df.columns:
    if col == 'codigo':
        columns.append(f"{col} BIGINT PRIMARY KEY")
    else:
        columns.append(f'"{col}" {get_sql_type(df[col].dtype)}')

create_table = f"DROP TABLE IF EXISTS centros_educativos;\nCREATE TABLE centros_educativos (\n  {', '.join(columns)}\n);\n\n"

insert_stmts = []
for index, row in df.iterrows():
    vals = []
    for val in row:
        if val == 'NULL':
            vals.append('NULL')
        elif isinstance(val, str):
            # escape single quotes
            val = val.replace("'", "''")
            vals.append(f"'{val}'")
        else:
            vals.append(str(val))
    
    insert_stmts.append(f"INSERT INTO centros_educativos ({', '.join(['\"'+c+'\"' for c in df.columns])}) VALUES ({', '.join(vals)});")

with open(sql_file, "w", encoding="utf-8") as f:
    f.write(create_table)
    f.write("\n".join(insert_stmts))

print(f"SQL generated! Removed duplicates, final count: {len(df)}")
