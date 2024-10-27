import mysql.connector

try:
    mydb = mysql.connector.connect(host="database-1.c3wi062ay6x9.us-east-1.rds.amazonaws.com",user="xy63",password="77854105yxCH")

    print("Successfully connected to the database")
except mysql.connector.Error as e:
    
    print(f"Error: {e}")
