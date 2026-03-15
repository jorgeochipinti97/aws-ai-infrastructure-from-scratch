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

async function searchDocuments(query, topK = 2) {
  const queryEmbedding = await getEmbedding(query);
  const result = await db.query(
    `SELECT title, content, 1 - (embedding <=> $1::vector) as similarity
     FROM documents
     ORDER BY embedding <=> $1::vector
     LIMIT $2`,
    [`[${queryEmbedding.join(",")}]`, topK]
  );
  return result.rows;
}

async function askWithRAG(question) {
  console.log(`Question: "${question}"\n`);

  const docs = await searchDocuments(question);
  console.log("Retrieved documents:");
  docs.forEach(d => console.log(`  - "${d.title}" (similarity: ${parseFloat(d.similarity).toFixed(4)})`));

  const context = docs.map(d => d.content).join("\n\n");

  const response = await bedrock.send(new InvokeModelCommand({
    modelId: "amazon.nova-lite-v1:0",
    contentType: "application/json",
    body: JSON.stringify({
      messages: [{
        role: "user",
        content: [{ text: `Based on the following context, answer the question.

Context:
${context}

Question: ${question}

Answer concisely based only on the context provided.` }]
      }]
    })
  }));

  const result = JSON.parse(Buffer.from(response.body).toString());
  return result.output.message.content[0].text;
}

await db.connect();

const questions = [
  "How much does Lambda cost?",
  "What storage options does S3 have?",
  "Which AI models are available in Bedrock?"
];

for (const q of questions) {
  const answer = await askWithRAG(q);
  console.log(`\nAnswer: ${answer}\n`);
  console.log("---");
}

await db.end();
