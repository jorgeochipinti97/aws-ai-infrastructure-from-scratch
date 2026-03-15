import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";

const client = new S3Client({ region: "us-east-1" });
const BUCKET = "mi-ai-platform-storage";

// Guardar conversación
async function saveConversation(sessionId, messages) {
  await client.send(new PutObjectCommand({
    Bucket: BUCKET,
    Key: `conversations/${sessionId}.json`,
    Body: JSON.stringify(messages),
    ContentType: "application/json"
  }));
  console.log("Conversación guardada");
}

// Recuperar conversación
async function getConversation(sessionId) {
  try {
    const response = await client.send(new GetObjectCommand({
      Bucket: BUCKET,
      Key: `conversations/${sessionId}.json`
    }));
    const body = await response.Body.transformToString();
    return JSON.parse(body);
  } catch {
    return []; // Nueva conversación
  }
}

// Probar
await saveConversation("session-001", [{ role: "user", content: "Hola" }]);
const history = await getConversation("session-001");
console.log(history);
