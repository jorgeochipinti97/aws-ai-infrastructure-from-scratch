import pg from "pg";

const client = new pg.Client({
  host: process.env.DB_HOST || "YOUR_RDS_ENDPOINT",
  port: 5432,
  user: process.env.DB_USER || "postgres",
  password: process.env.DB_PASSWORD || "YOUR_PASSWORD",
  database: "postgres",
  ssl: { rejectUnauthorized: false }
});

await client.connect();

// Habilitar pgvector
await client.query("CREATE EXTENSION IF NOT EXISTS vector");

// Crear tabla de documentos con embeddings
await client.query(`
  CREATE TABLE IF NOT EXISTS documents (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    embedding vector(1024)
  )
`);

// Crear índice HNSW para búsqueda eficiente
await client.query(`
  CREATE INDEX IF NOT EXISTS documents_embedding_idx
  ON documents
  USING hnsw (embedding vector_cosine_ops)
`);

console.log("pgvector configured and table created");
await client.end();
