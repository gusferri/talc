#!/usr/bin/env python3
"""
Script para obtener la estructura completa de la base de datos TALC
Incluye todas las tablas, columnas, relaciones y datos existentes
"""

import os
import sys
from dotenv import load_dotenv
import mysql.connector
from mysql.connector import Error

# Cargar variables de entorno
load_dotenv()

def get_connection():
    """Obtiene conexión a la base de datos"""
    try:
        connection = mysql.connector.connect(
            host=os.getenv("DB_HOST"),
            user=os.getenv("DB_USER"),
            password=os.getenv("DB_PASS"),
            database=os.getenv("DB_NAME")
        )
        return connection
    except Error as e:
        print(f"❌ Error conectando a la base de datos: {e}")
        return None

def get_all_tables(connection):
    """Obtiene todas las tablas de la base de datos"""
    cursor = connection.cursor()
    cursor.execute("SHOW TABLES")
    tables = [table[0] for table in cursor.fetchall()]
    cursor.close()
    return tables

def get_table_structure(connection, table_name):
    """Obtiene la estructura completa de una tabla"""
    cursor = connection.cursor(dictionary=True)
    
    # Obtener estructura de columnas
    cursor.execute(f"DESCRIBE {table_name}")
    columns = cursor.fetchall()
    
    # Obtener CREATE TABLE statement
    cursor.execute(f"SHOW CREATE TABLE {table_name}")
    create_statement = cursor.fetchone()['Create Table']
    
    # Obtener información de índices
    cursor.execute(f"SHOW INDEX FROM {table_name}")
    indexes = cursor.fetchall()
    
    # Obtener información de foreign keys
    cursor.execute(f"""
        SELECT 
            COLUMN_NAME,
            REFERENCED_TABLE_NAME,
            REFERENCED_COLUMN_NAME
        FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
        WHERE TABLE_SCHEMA = '{os.getenv("DB_NAME")}' 
        AND TABLE_NAME = '{table_name}' 
        AND REFERENCED_TABLE_NAME IS NOT NULL
    """)
    foreign_keys = cursor.fetchall()
    
    cursor.close()
    
    return {
        'columns': columns,
        'create_statement': create_statement,
        'indexes': indexes,
        'foreign_keys': foreign_keys
    }

def get_table_data_sample(connection, table_name, limit=5):
    """Obtiene una muestra de datos de una tabla"""
    cursor = connection.cursor(dictionary=True)
    cursor.execute(f"SELECT * FROM {table_name} LIMIT {limit}")
    data = cursor.fetchall()
    cursor.close()
    return data

def get_table_count(connection, table_name):
    """Obtiene el número de registros en una tabla"""
    cursor = connection.cursor()
    cursor.execute(f"SELECT COUNT(*) FROM {table_name}")
    count = cursor.fetchone()[0]
    cursor.close()
    return count

def main():
    """Función principal"""
    print("🔍 Obteniendo estructura de la base de datos TALC...")
    print("=" * 80)
    
    # Conectar a la base de datos
    connection = get_connection()
    if not connection:
        print("❌ No se pudo conectar a la base de datos")
        return
    
    print("✅ Conexión exitosa a la base de datos")
    print(f"📊 Base de datos: {os.getenv('DB_NAME')}")
    print(f"🌐 Host: {os.getenv('DB_HOST')}")
    print(f"👤 Usuario: {os.getenv('DB_USER')}")
    print("=" * 80)
    
    # Obtener todas las tablas
    tables = get_all_tables(connection)
    print(f"📋 Tablas encontradas: {len(tables)}")
    print(f"📋 Lista de tablas: {', '.join(tables)}")
    print("=" * 80)
    
    # Analizar cada tabla
    for table_name in tables:
        print(f"\n🔍 Analizando tabla: {table_name}")
        print("-" * 60)
        
        # Obtener estructura
        structure = get_table_structure(connection, table_name)
        
        # Mostrar columnas
        print("📝 Columnas:")
        for col in structure['columns']:
            print(f"  - {col['Field']}: {col['Type']} {'(NULL)' if col['Null'] == 'YES' else '(NOT NULL)'} {'(KEY)' if col['Key'] else ''}")
        
        # Mostrar foreign keys
        if structure['foreign_keys']:
            print("🔗 Foreign Keys:")
            for fk in structure['foreign_keys']:
                print(f"  - {fk['COLUMN_NAME']} -> {fk['REFERENCED_TABLE_NAME']}.{fk['REFERENCED_COLUMN_NAME']}")
        
        # Obtener conteo de registros
        count = get_table_count(connection, table_name)
        print(f"📊 Registros: {count}")
        
        # Mostrar muestra de datos si hay registros
        if count > 0:
            sample_data = get_table_data_sample(connection, table_name, 3)
            print("📋 Muestra de datos:")
            for i, row in enumerate(sample_data, 1):
                print(f"  {i}. {row}")
        
        print("-" * 60)
    
    # Mostrar CREATE TABLE statements
    print("\n🔧 CREATE TABLE STATEMENTS:")
    print("=" * 80)
    for table_name in tables:
        structure = get_table_structure(connection, table_name)
        print(f"\n-- Tabla: {table_name}")
        print(structure['create_statement'] + ";")
    
    connection.close()
    print("\n✅ Análisis completado")

if __name__ == "__main__":
    main() 