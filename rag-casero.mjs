import { BedrockRuntimeClient, InvokeModelCommand } from "@aws-sdk/client-bedrock-runtime";
import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";

const bedrock = new BedrockRuntimeClient({ region: "us-east-1" });
const s3 = new S3Client({ region: "us-east-1" });
const BUCKET = "mi-ai-platform-storage";

async function getEmbedding(text) {
  const response = await bedrock.send(new InvokeModelCommand({
    modelId: "amazon.titan-embed-text-v2:0",
    contentType: "application/json",
    body: JSON.stringify({ inputText: text })
  }));
  return JSON.parse(Buffer.from(response.body).toString()).embedding;
}

function cosineSimilarity(a, b) {
  let dot = 0, normA = 0, normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

async function indexDocuments(documents) {
  const index = [];
  for (const doc of documents) {
    console.log(`Indexing: "${doc.title}"`);
    const embedding = await getEmbedding(doc.content);
    index.push({ ...doc, embedding });
  }
  await s3.send(new PutObjectCommand({
    Bucket: BUCKET,
    Key: "rag/vector-index.json",
    Body: JSON.stringify(index),
    ContentType: "application/json"
  }));
  console.log(`\nIndexed ${index.length} documents in S3`);
}

async function search(query, topK = 2) {
  const res = await s3.send(new GetObjectCommand({
    Bucket: BUCKET, Key: "rag/vector-index.json"
  }));
  const index = JSON.parse(await res.Body.transformToString());
  const queryEmbedding = await getEmbedding(query);

  return index
    .map(doc => ({ ...doc, score: cosineSimilarity(queryEmbedding, doc.embedding) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, topK);
}

async function askWithRAG(question) {
  const relevantDocs = await search(question);

  console.log("\nRelevant documents found:");
  relevantDocs.forEach(d => console.log(`  - "${d.title}" (score: ${d.score.toFixed(4)})`));

  const context = relevantDocs.map(d => d.content).join("\n\n");

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

console.log("=== STEP 1: Indexing documents ===\n");
await indexDocuments(documents);

console.log("\n=== STEP 2: Asking with RAG ===\n");
const answer = await askWithRAG("How much does Lambda cost?");
console.log("\nAnswer:", answer);
