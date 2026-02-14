
import sqlite3
import os

# Hardcoded credentials - BAD
DB_PASSWORD = "admin123"
API_KEY = "sk-1234567890abcdef1234567890abcdef"

def get_user_data(username):
    # No context manager, connection might leak
    conn = sqlite3.connect("app.db")
    cursor = conn.cursor()
    
    # SQL Injection Vulnerability
    query = f"SELECT * FROM users WHERE name = '{username}'"
    cursor.execute(query)
    results = cursor.fetchall()
    
    processed_data = []
    
    # Inefficient nested loop O(N*M)
    for user in results:
        # Pretend we have another list of records to cross-reference
        all_records = get_all_records_from_csv() 
        for record in all_records:
            if record["user_id"] == user[0]:
                # Mutating global state (hypothetically) or just bad logic
                processed_data.append({
                    "id": user[0],
                    "name": user[1],
                    "secret": record["secret_value"]
                })
    
    # Missing error handling
    # Missing verify_data() call
    
    return processed_data

def get_all_records_from_csv():
    # Simulate a slow IO operation inside a loop
    import time
    time.sleep(0.01) 
    return [{"user_id": 1, "secret_value": "super_secret"}]

class DataProcessor:
    def __init__(self):
        self.cache = {}

    def process(self, data):
        # Pokemon Exception Handling
        try:
            for item in data:
                if item['id'] in self.cache:
                    print("Skipping")
                else:
                    self.cache[item['id']] = item
        except:
            pass # Silently ignore errors
