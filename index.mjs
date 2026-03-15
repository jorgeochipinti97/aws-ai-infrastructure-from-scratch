import { BedrockRuntimeClient, InvokeModelCommand } from "@aws-sdk/client-bedrock-runtime";

const client = new BedrockRuntimeClient({ region: "us-east-1" });

export const handler = async (event) => {
  const { prompt } = JSON.parse(event.body);

  const response = await client.send(new InvokeModelCommand({
    modelId: "amazon.nova-lite-v1:0",
    contentType: "application/json",
    body: JSON.stringify({
      messages: [{ role: "user", content: [{ text: prompt }] }]
    })
  }));

  const result = JSON.parse(Buffer.from(response.body).toString());

  return {
    statusCode: 200,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ response: result.output.message.content[0].text })
  };
};
