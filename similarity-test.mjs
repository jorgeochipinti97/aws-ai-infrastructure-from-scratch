import { BedrockRuntimeClient, InvokeModelCommand } from "@aws-sdk/client-bedrock-runtime";

const client = new BedrockRuntimeClient({ region: "us-east-1" });

async function getEmbedding(text) {
  const response = await client.send(new InvokeModelCommand({
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

const texts = [
  "How do I deploy a web application?",
  "What are the steps to publish a website?",
  "How to cook pasta carbonara?"
];

const queryEmbedding = await getEmbedding("How to deploy my app to the cloud?");

for (const text of texts) {
  const textEmbedding = await getEmbedding(text);
  const similarity = cosineSimilarity(queryEmbedding, textEmbedding);
  console.log(`"${text}" → similarity: ${similarity.toFixed(4)}`);
}
