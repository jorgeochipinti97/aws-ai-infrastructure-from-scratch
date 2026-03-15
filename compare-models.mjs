import { BedrockRuntimeClient, InvokeModelCommand } from "@aws-sdk/client-bedrock-runtime";

const client = new BedrockRuntimeClient({ region: "us-east-1" });

const prompt = "Explain what is a REST API in exactly 3 lines";

const models = [
  {
    id: "amazon.nova-lite-v1:0",
    body: { messages: [{ role: "user", content: [{ text: prompt }] }] },
    extract: (r) => r.output.message.content[0].text
  },
  {
    id: "meta.llama3-8b-instruct-v1:0",
    body: { prompt: `<|begin_of_text|><|start_header_id|>user<|end_header_id|>\n${prompt}<|eot_id|><|start_header_id|>assistant<|end_header_id|>`, max_gen_len: 256 },
    extract: (r) => r.generation
  },
];

for (const model of models) {
  console.log(`\n--- Model: ${model.id} ---`);
  const start = Date.now();

  try {
    const response = await client.send(new InvokeModelCommand({
      modelId: model.id,
      contentType: "application/json",
      body: JSON.stringify(model.body)
    }));

    const result = JSON.parse(Buffer.from(response.body).toString());
    console.log("Response:", model.extract(result));
    console.log(`Time: ${Date.now() - start}ms`);
  } catch (err) {
    console.log(`Error: ${err.message}`);
    console.log(`Time: ${Date.now() - start}ms`);
  }
}
