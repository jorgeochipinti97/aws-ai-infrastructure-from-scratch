import { BedrockRuntimeClient, InvokeModelCommand } from "@aws-sdk/client-bedrock-runtime";

const client = new BedrockRuntimeClient({ region: "us-east-1" });

async function getEmbedding(text) {
  const response = await client.send(new InvokeModelCommand({
    modelId: "amazon.titan-embed-text-v2:0",
    contentType: "application/json",
    body: JSON.stringify({ inputText: text })
  }));
  const result = JSON.parse(Buffer.from(response.body).toString());
  return result.embedding;
}

const embedding = await getEmbedding("What is cloud computing?");
console.log("Dimensions:", embedding.length);
console.log("First 5 values:", embedding.slice(0, 5));
