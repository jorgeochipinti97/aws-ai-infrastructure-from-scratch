import { BedrockRuntimeClient, InvokeModelCommand } from "@aws-sdk/client-bedrock-runtime";

const client = new BedrockRuntimeClient({ region: "us-east-1" });

async function askLLM(prompt) {
  const response = await client.send(new InvokeModelCommand({
    modelId: "amazon.nova-lite-v1:0",
    contentType: "application/json",
    body: JSON.stringify({
      messages: [{ role: "user", content: [{ text: prompt }] }]
    })
  }));

  const result = JSON.parse(Buffer.from(response.body).toString());
  return result.output.message.content[0].text;
}

const answer = await askLLM("What is serverless in 2 lines?");
console.log(answer);
