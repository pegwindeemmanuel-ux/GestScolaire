import pymysql
from pymysql.cursors import DictCursor

DB_HOST = "127.0.0.1"
DB_PORT = 3306
DB_USER = "root"
DB_PASSWORD = ""
DB_NAME = "edugest_pro"

# Un seul curseur dict global (connexion unique par appel)
def get_db():
    conn = pymysql.connect(
        host=DB_HOST,
        port=DB_PORT,
        user=DB_USER,
        password=DB_PASSWORD,
        database=DB_NAME,
        cursorclass=DictCursor,
        autocommit=False,
        charset="utf8mb4",
    )
    return conn
