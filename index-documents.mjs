import pg from "pg";
import { BedrockRuntimeClient, InvokeModelCommand } from "@aws-sdk/client-bedrock-runtime";

const bedrock = new BedrockRuntimeClient({ region: "us-east-1" });
const db = new pg.Client({
  host: process.env.DB_HOST || "YOUR_RDS_ENDPOINT",
  port: 5432,
  user: process.env.DB_USER || "postgres",
  password: process.env.DB_PASSWORD || "YOUR_PASSWORD",
  database: "postgres",
  ssl: { rejectUnauthorized: false }
});

async function getEmbedding(text) {
  const response = await bedrock.send(new InvokeModelCommand({
    modelId: "amazon.titan-embed-text-v2:0",
    contentType: "application/json",
    body: JSON.stringify({ inputText: text })
  }));
  return JSON.parse(Buffer.from(response.body).toString()).embedding;
}

await db.connect();
await db.query("DELETE FROM documents");

const documents = [
  {
    title: "Lambda Pricing",
    content: "AWS Lambda charges based on the number of requests and the duration of code execution. The first 1 million requests per month are free. After that, it costs $0.20 per million requests. Duration is charged in 1ms increments based on memory allocated."
  },
  {
    title: "S3 Storage Classes",
    content: "Amazon S3 offers multiple storage classes: S3 Standard for frequently accessed data, S3 Intelligent-Tiering for automatic cost optimization, S3 Glacier for archival. Standard costs approximately $0.023 per GB per month in us-east-1."
  },
  {
    title: "Bedrock Models",
    content: "Amazon Bedrock provides access to foundation models from Amazon (Titan, Nova), Anthropic (Claude), Meta (Llama), and others. Nova Lite is the most economical for text generation. Titan Embeddings is used for generating vector representations of text."
  },
  {
    title: "API Gateway",
    content: "Amazon API Gateway is a fully managed service for creating REST and HTTP APIs. HTTP APIs cost $1.00 per million requests. It supports CORS, authorization, throttling, and integrates directly with Lambda."
  },
  {
    title: "DynamoDB Basics",
    content: "Amazon DynamoDB is a serverless NoSQL database with single-digit millisecond latency. It supports key-value and document data models. On-demand pricing charges $1.25 per million write requests and $0.25 per million read requests."
  }
];

for (const doc of documents) {
  console.log(`Indexing: "${doc.title}"`);
  const embedding = await getEmbedding(doc.content);
  await db.query(
    "INSERT INTO documents (title, content, embedding) VALUES ($1, $2, $3)",
    [doc.title, doc.content, `[${embedding.join(",")}]`]
  );
}

console.log(`\nIndexed ${documents.length} documents in PostgreSQL`);
await db.end();
