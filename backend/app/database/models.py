USER_TABLE = """
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL
);
"""


GENERATION_HISTORY_TABLE = """
CREATE TABLE IF NOT EXISTS generation_history (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    prompt TEXT NOT NULL,
    rendering_style VARCHAR(100) NOT NULL,
    reference_strength INTEGER DEFAULT 50,
    resolution VARCHAR(20) NOT NULL,
    image_filename VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_history_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE
);
"""


EVALUATION_COLUMNS = """
ALTER TABLE generation_history
ADD COLUMN IF NOT EXISTS brightness FLOAT,
ADD COLUMN IF NOT EXISTS contrast FLOAT,
ADD COLUMN IF NOT EXISTS sharpness FLOAT,
ADD COLUMN IF NOT EXISTS quality VARCHAR(20);
"""


def create_tables(connection):
    cursor = connection.cursor()

    try:
        cursor.execute(USER_TABLE)
        cursor.execute(GENERATION_HISTORY_TABLE)
        cursor.execute(EVALUATION_COLUMNS)

        connection.commit()

    finally:
        cursor.close()