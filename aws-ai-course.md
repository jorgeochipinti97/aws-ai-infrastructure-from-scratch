# AWS AI Engineering
## Guía de Ejercicios Prácticos

> **Programa de Formación Técnica Aplicada**  
> Nivel: Intermedio — Desarrollador Next.js con base en AWS  
> Modalidad: Hands-on · CLI-first · Proyecto real  
> Duración estimada: 4–6 semanas  
> Presupuesto AWS estimado: ~$10–30 USD total

---

## Índice de Contenidos

- [Módulo I — Setup y configuración base](#módulo-i--setup-y-configuración-base)
- [Módulo II — S3: almacenamiento estructurado](#módulo-ii--s3-almacenamiento-estructurado)
- [Módulo III — Amazon Bedrock: tu primer LLM](#módulo-iii--amazon-bedrock-tu-primer-llm)
- [Módulo IV — Lambda: funciones serverless](#módulo-iv--lambda-funciones-serverless)
- [Módulo V — API Gateway: exposición de endpoints](#módulo-v--api-gateway-exposición-de-endpoints)
- [Módulo VI — Integración final con Next.js](#módulo-vi--integración-final-con-nextjs)
- [Módulo VII — RAG Casero: entendiendo embeddings](#módulo-vii--rag-casero-entendiendo-embeddings)
- [Módulo VIII — RAG Profesional: pgvector en RDS](#módulo-viii--rag-profesional-pgvector-en-rds)

---

## Módulo I — Setup y Configuración Base

*Antes de tocar cualquier servicio de AI, es necesario establecer una base segura: credenciales correctamente configuradas, un usuario con permisos mínimos y alertas de billing activas.*

---

### Ejercicio 1.1 — Instalar y verificar AWS CLI

**Objetivo:** Tener la CLI de AWS funcionando en tu máquina.  
**Conceptos:** Herramientas de desarrollo, entorno local

La AWS CLI es la herramienta principal de trabajo. Toda la infraestructura puede ser creada, modificada y eliminada desde la terminal sin necesidad de la consola web.

```bash
# macOS — instalar via Homebrew
brew install awscli

# Verificar instalación exitosa
aws --version
```

**✅ Resultado esperado:**
```
aws-cli/2.x.x Python/3.x.x Darwin/x86_64
```

---

### Ejercicio 1.2 — Crear usuario IAM con permisos mínimos

**Objetivo:** Entender qué es IAM creando tu primer usuario con permisos limitados.  
**Conceptos:** IAM, usuarios, políticas, principio de mínimo privilegio

> 💡 **¿Qué es IAM?**  
> Identity and Access Management es el sistema de permisos de AWS. Funciona igual que los roles en tu app: admin, usuario, solo-lectura. Regla fundamental: **nunca trabajar con el usuario root**. Siempre crear un usuario específico con solo los permisos que necesita.

```bash
# Crear el usuario
aws iam create-user --user-name dev-ai-platform

# Asignar permisos para Bedrock
aws iam attach-user-policy \
  --user-name dev-ai-platform \
  --policy-arn arn:aws:iam::aws:policy/AmazonBedrockFullAccess

# Crear access keys para usar en CLI
aws iam create-access-key --user-name dev-ai-platform
```

> ⚠️ **Importante:** Las access keys que aparecen en el output solo se muestran una vez. Guardalas antes de cerrar la terminal.

---

### Ejercicio 1.3 — Configurar credenciales locales

**Objetivo:** Conectar la CLI con tu nuevo usuario IAM.  
**Conceptos:** Autenticación, perfiles de AWS

```bash
# Configurar con las keys del ejercicio anterior
aws configure

# Te va a pedir:
# AWS Access Key ID: [la que guardaste]
# AWS Secret Access Key: [la que guardaste]
# Default region name: us-east-1
# Default output format: json

# Verificar que todo funciona
aws sts get-caller-identity
```

**✅ Resultado esperado:**
```json
{
  "UserId": "XXXX",
  "Account": "123456789012",
  "Arn": "arn:aws:iam::123456789012:user/dev-ai-platform"
}
```

---

### Ejercicio 1.4 — Configurar alertas de billing

**Objetivo:** Asegurar que ningún experimento genere gastos inesperados.  
**Conceptos:** CloudWatch, alarmas, billing

Antes de usar cualquier servicio pago, configurar alertas es una práctica profesional obligatoria.

```bash
# Crear alarma que avise cuando el gasto supere $10
aws cloudwatch put-metric-alarm \
  --alarm-name "billing-alert-10" \
  --metric-name EstimatedCharges \
  --namespace "AWS/Billing" \
  --statistic Maximum \
  --period 86400 \
  --threshold 10 \
  --comparison-operator GreaterThanThreshold \
  --dimensions Name=Currency,Value=USD \
  --region us-east-1
```

**✅ Resultado esperado:** Sin errores. Alarma visible en CloudWatch → Alarms.

---

## Módulo II — S3: Almacenamiento Estructurado

*S3 es el sistema de almacenamiento central de tu plataforma. Aquí vivirán los archivos que suban tus usuarios y el historial de conversaciones con los modelos.*

---

### Ejercicio 2.1 — Crear bucket con configuración segura

**Objetivo:** Aprovisionar almacenamiento con versionado y acceso privado.  
**Conceptos:** S3, buckets, versionado, control de acceso

```bash
# Crear bucket (el nombre debe ser único globalmente en AWS)
aws s3api create-bucket \
  --bucket mi-ai-platform-storage \
  --region us-east-1

# Activar versionado (permite recuperar archivos eliminados o versiones anteriores)
aws s3api put-bucket-versioning \
  --bucket mi-ai-platform-storage \
  --versioning-configuration Status=Enabled

# Bloquear acceso público por completo
aws s3api put-public-access-block \
  --bucket mi-ai-platform-storage \
  --public-access-block-configuration \
  BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true
```

---

### Ejercicio 2.2 — Operaciones básicas con archivos

**Objetivo:** Dominar las operaciones CRUD sobre S3 desde la CLI.  
**Conceptos:** Objetos, prefijos, rutas en S3

```bash
# Subir un archivo
aws s3 cp archivo.txt s3://mi-ai-platform-storage/uploads/

# Listar contenido del bucket
aws s3 ls s3://mi-ai-platform-storage/

# Descargar archivo
aws s3 cp s3://mi-ai-platform-storage/uploads/archivo.txt ./descargado.txt

# Eliminar archivo
aws s3 rm s3://mi-ai-platform-storage/uploads/archivo.txt
```

> 📌 **Aplicación práctica:** En tu plataforma vas a guardar el historial de conversaciones como archivos JSON con esta estructura: `conversations/{userId}/{sessionId}.json`. Esto te da persistencia sin necesitar una base de datos al inicio.

---

### Ejercicio 2.3 — Guardar y recuperar JSON desde Node.js

**Objetivo:** Integrar S3 con código Node.js para persistir datos de la aplicación.  
**Conceptos:** AWS SDK, operaciones asíncronas, serialización JSON

```bash
npm install @aws-sdk/client-s3
```

```javascript
// s3-test.mjs
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
```

```bash
node s3-test.mjs
```

---

## Módulo III — Amazon Bedrock: Tu Primer LLM

*Bedrock es el corazón de tu plataforma. Te da acceso a los mejores modelos de lenguaje del mundo mediante una sola API, sin gestionar GPUs ni servidores.*

---

### Ejercicio 3.1 — Habilitar modelos (única vez en la consola)

**Objetivo:** Activar los modelos que vas a usar durante el curso.  
**Conceptos:** Model access, proveedores, términos de uso

> ⚠️ **Requiere consola web:** Este es el único paso que no puede hacerse por CLI. Cada modelo requiere aceptar los términos del proveedor (Anthropic, Meta, Amazon) de forma manual.

**Pasos:**
1. Ir a AWS Console → Amazon Bedrock → Model access
2. Solicitar acceso a **Amazon Nova Lite** (el más económico para práctica)
3. Solicitar acceso a **Meta Llama 3** (open source, muy barato)
4. Solicitar acceso a **Anthropic Claude Haiku** (mejor balance calidad/precio)
5. Esperar aprobación (generalmente instantánea)

---

### Ejercicio 3.2 — Primera invocación a un LLM por CLI

**Objetivo:** Hablarle a un modelo de lenguaje directamente desde la terminal.  
**Conceptos:** Inferencia, tokens, invocación de modelos

```bash
# Crear el archivo de prompt
echo '{"inputText": "Explicame qué es AWS en una oración"}' > prompt.json

# Invocar Amazon Nova Lite
aws bedrock-runtime invoke-model \
  --model-id amazon.nova-lite-v1:0 \
  --body file://prompt.json \
  --region us-east-1 \
  response.json

# Ver la respuesta
cat response.json
```

**✅ Resultado esperado:** Un JSON con la respuesta del modelo. Primera llamada a un LLM en producción completada.

---

### Ejercicio 3.3 — Integrar Bedrock con Node.js

**Objetivo:** Llamar a un LLM desde código JavaScript.  
**Conceptos:** AWS SDK, Bedrock Runtime, procesamiento de respuestas

```bash
npm install @aws-sdk/client-bedrock-runtime
```

```javascript
// bedrock-test.mjs
import { BedrockRuntimeClient, InvokeModelCommand } from "@aws-sdk/client-bedrock-runtime";

const client = new BedrockRuntimeClient({ region: "us-east-1" });

async function askLLM(prompt) {
  const response = await client.send(new InvokeModelCommand({
    modelId: "amazon.nova-lite-v1:0",
    contentType: "application/json",
    body: JSON.stringify({
      messages: [{ role: "user", content: prompt }]
    })
  }));

  const result = JSON.parse(Buffer.from(response.body).toString());
  return result.output.message.content[0].text;
}

const answer = await askLLM("¿Qué es serverless en 2 líneas?");
console.log(answer);
```

```bash
node bedrock-test.mjs
```

---

### Ejercicio 3.4 — Comparar modelos y costos

**Objetivo:** Entender las diferencias de calidad y costo entre modelos disponibles.  
**Conceptos:** Trade-off calidad/costo, selección de modelos

```javascript
// compare-models.mjs
import { BedrockRuntimeClient, InvokeModelCommand } from "@aws-sdk/client-bedrock-runtime";

const client = new BedrockRuntimeClient({ region: "us-east-1" });

const models = [
  "amazon.nova-lite-v1:0",       // Más barato
  "meta.llama3-8b-instruct-v1:0", // Open source
];

const prompt = "Explicá qué es una API REST en exactamente 3 líneas";

for (const modelId of models) {
  console.log(`\n--- Modelo: ${modelId} ---`);
  const start = Date.now();

  const response = await client.send(new InvokeModelCommand({
    modelId,
    contentType: "application/json",
    body: JSON.stringify({
      messages: [{ role: "user", content: prompt }]
    })
  }));

  const result = JSON.parse(Buffer.from(response.body).toString());
  console.log("Respuesta:", result);
  console.log(`Tiempo: ${Date.now() - start}ms`);
}
```

---

## Módulo IV — Lambda: Funciones Serverless

*Lambda es el backend de tu plataforma. Funciona exactamente como las API routes de Next.js pero en la infraestructura de AWS, pagando solo por ejecución.*

---

### Ejercicio 4.1 — Crear un rol IAM para Lambda

**Objetivo:** Entender cómo los servicios de AWS se autentican entre sí.  
**Conceptos:** Roles IAM, trust policies, permisos de servicio a servicio

> 💡 **¿Por qué necesita un rol?**  
> Lambda necesita permisos para hablar con Bedrock y S3. En IAM, los servicios de AWS usan *roles* (no usuarios) para obtener permisos temporales. Es más seguro que hardcodear credenciales en el código.

```bash
# Crear la trust policy
cat > trust-policy.json << 'EOF'
{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Principal": { "Service": "lambda.amazonaws.com" },
    "Action": "sts:AssumeRole"
  }]
}
EOF

# Crear el rol
aws iam create-role \
  --role-name lambda-ai-role \
  --assume-role-policy-document file://trust-policy.json

# Darle permisos de Bedrock y S3
aws iam attach-role-policy \
  --role-name lambda-ai-role \
  --policy-arn arn:aws:iam::aws:policy/AmazonBedrockFullAccess

aws iam attach-role-policy \
  --role-name lambda-ai-role \
  --policy-arn arn:aws:iam::aws:policy/AmazonS3FullAccess

# Agregar permisos de logs (buena práctica)
aws iam attach-role-policy \
  --role-name lambda-ai-role \
  --policy-arn arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole
```

---

### Ejercicio 4.2 — Escribir y deployar tu primera Lambda

**Objetivo:** Crear y deployar una función serverless que llama a Bedrock.  
**Conceptos:** Handler, evento, respuesta, deployment package

```javascript
// index.mjs
import { BedrockRuntimeClient, InvokeModelCommand } from "@aws-sdk/client-bedrock-runtime";

const client = new BedrockRuntimeClient({ region: "us-east-1" });

export const handler = async (event) => {
  const { prompt } = JSON.parse(event.body);

  const response = await client.send(new InvokeModelCommand({
    modelId: "amazon.nova-lite-v1:0",
    contentType: "application/json",
    body: JSON.stringify({
      messages: [{ role: "user", content: prompt }]
    })
  }));

  const result = JSON.parse(Buffer.from(response.body).toString());

  return {
    statusCode: 200,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ response: result })
  };
};
```

```bash
# Empaquetar la función
zip function.zip index.mjs

# Obtener el ARN del rol
aws iam get-role \
  --role-name lambda-ai-role \
  --query 'Role.Arn' \
  --output text

# Crear la función Lambda
aws lambda create-function \
  --function-name ai-platform-handler \
  --runtime nodejs20.x \
  --role arn:aws:iam::TU_CUENTA:role/lambda-ai-role \
  --handler index.handler \
  --zip-file fileb://function.zip \
  --timeout 30
```

---

### Ejercicio 4.3 — Invocar Lambda desde CLI y actualizar código

**Objetivo:** Probar la función y aprender el ciclo de actualización.  
**Conceptos:** Invocación síncrona, actualización de código, logs

```bash
# Crear payload de prueba
echo '{"body": "{\"prompt\": \"¿Qué es serverless?\"}"}' > test-event.json

# Invocar la función
aws lambda invoke \
  --function-name ai-platform-handler \
  --payload file://test-event.json \
  output.json

# Ver la respuesta
cat output.json

# Ver logs de la función
aws logs tail /aws/lambda/ai-platform-handler --follow

# Actualizar el código después de hacer cambios
zip function.zip index.mjs
aws lambda update-function-code \
  --function-name ai-platform-handler \
  --zip-file fileb://function.zip
```

**✅ Resultado esperado:** Un JSON con `statusCode: 200` y la respuesta del LLM.

---

## Módulo V — API Gateway: Exposición de Endpoints

*API Gateway convierte tu Lambda en un endpoint HTTP accesible desde cualquier lugar del mundo. Es la puerta de entrada pública de tu plataforma.*

---

### Ejercicio 5.1 — Crear API HTTP

**Objetivo:** Exponer la Lambda como un endpoint REST.  
**Conceptos:** API HTTP, rutas, CORS, stages

```bash
# Crear la API
aws apigatewayv2 create-api \
  --name ai-platform-api \
  --protocol-type HTTP \
  --cors-configuration \
  AllowOrigins='["*"]',AllowMethods='["POST","GET"]',AllowHeaders='["*"]'

# Guardar el ApiId que devuelve el comando (lo vas a necesitar)
# Ejemplo: abc123def
```

---

### Ejercicio 5.2 — Conectar API con Lambda

**Objetivo:** Crear la integración entre el endpoint HTTP y la función Lambda.  
**Conceptos:** Integraciones, Lambda proxy, rutas

```bash
# Crear integración con la Lambda
aws apigatewayv2 create-integration \
  --api-id TU_API_ID \
  --integration-type AWS_PROXY \
  --integration-uri \
  arn:aws:lambda:us-east-1:TU_CUENTA:function:ai-platform-handler \
  --payload-format-version 2.0

# Crear la ruta POST /chat
aws apigatewayv2 create-route \
  --api-id TU_API_ID \
  --route-key "POST /chat" \
  --target integrations/TU_INTEGRATION_ID

# Dar permisos a API Gateway para invocar Lambda
aws lambda add-permission \
  --function-name ai-platform-handler \
  --statement-id apigateway-invoke \
  --action lambda:InvokeFunction \
  --principal apigateway.amazonaws.com

# Deploy a stage prod
aws apigatewayv2 create-stage \
  --api-id TU_API_ID \
  --stage-name prod \
  --auto-deploy
```

---

### Ejercicio 5.3 — Probar el endpoint con curl

**Objetivo:** Verificar que el flujo completo funciona end-to-end.  
**Conceptos:** HTTP, testing de APIs, headers

```bash
# Tu URL pública queda así:
# https://TU_API_ID.execute-api.us-east-1.amazonaws.com/prod/chat

curl -X POST \
  https://TU_API_ID.execute-api.us-east-1.amazonaws.com/prod/chat \
  -H "Content-Type: application/json" \
  -d '{"prompt": "Explicame AWS en 2 líneas"}'
```

**✅ Resultado esperado:** La respuesta del LLM llegando desde un endpoint HTTP real en producción. Tu API de AI está viva.

---

## Módulo VI — Integración Final con Next.js

*El último paso: conectar tu plataforma Next.js con toda la infraestructura AWS construida. Este es el núcleo del producto.*

---

### Ejercicio 6.1 — Crear API route en Next.js

**Objetivo:** Conectar el frontend con la infraestructura AWS.  
**Conceptos:** App Router, Server Actions, variables de entorno

```bash
# .env.local
AWS_API_URL=https://TU_API_ID.execute-api.us-east-1.amazonaws.com/prod
```

```typescript
// app/api/chat/route.ts
export async function POST(request: Request) {
  const { prompt } = await request.json();

  const response = await fetch(
    `${process.env.AWS_API_URL}/chat`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt })
    }
  );

  const data = await response.json();
  return Response.json(data);
}
```

---

### Ejercicio 6.2 — Extender Lambda con historial en S3

**Objetivo:** Agregar memoria a las conversaciones usando S3 como persistencia.  
**Conceptos:** Conversational context, stateless functions, persistencia externa

```javascript
// index.mjs — Lambda con historial
import { BedrockRuntimeClient, InvokeModelCommand } from "@aws-sdk/client-bedrock-runtime";
import { S3Client, GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";

const bedrock = new BedrockRuntimeClient({ region: "us-east-1" });
const s3 = new S3Client({ region: "us-east-1" });
const BUCKET = "mi-ai-platform-storage";

async function getHistory(sessionId) {
  try {
    const res = await s3.send(new GetObjectCommand({
      Bucket: BUCKET,
      Key: `conversations/${sessionId}.json`
    }));
    const body = await res.Body.transformToString();
    return JSON.parse(body);
  } catch {
    return [];
  }
}

async function saveHistory(sessionId, messages) {
  await s3.send(new PutObjectCommand({
    Bucket: BUCKET,
    Key: `conversations/${sessionId}.json`,
    Body: JSON.stringify(messages),
    ContentType: "application/json"
  }));
}

export const handler = async (event) => {
  const { prompt, sessionId = "default" } = JSON.parse(event.body);

  // Recuperar historial previo
  const history = await getHistory(sessionId);

  // Agregar el nuevo mensaje
  history.push({ role: "user", content: prompt });

  // Llamar al LLM con todo el contexto
  const response = await bedrock.send(new InvokeModelCommand({
    modelId: "amazon.nova-lite-v1:0",
    contentType: "application/json",
    body: JSON.stringify({ messages: history })
  }));

  const result = JSON.parse(Buffer.from(response.body).toString());
  const reply = result.output.message.content[0].text;

  // Guardar el historial actualizado
  history.push({ role: "assistant", content: reply });
  await saveHistory(sessionId, history);

  return {
    statusCode: 200,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ response: reply, sessionId })
  };
};
```

---

### Ejercicio 6.3 — Proyecto integrador final

**Objetivo:** Construir un componente de chat completo en Next.js conectado a toda la infraestructura.  
**Conceptos:** Estado, streaming, UX de chat

**Lista de tareas:**

- [ ] Crear componente `<Chat />` en Next.js con input y lista de mensajes
- [ ] Conectar el componente con `/api/chat` usando `fetch`
- [ ] Manejar estado de loading mientras espera respuesta
- [ ] Persistir el `sessionId` en `localStorage` para mantener contexto entre recargas
- [ ] Mostrar historial de la conversación recuperado desde S3
- [ ] Agregar manejo de errores con mensajes amigables
- [ ] Probar múltiples turns de conversación con contexto acumulado
- [ ] Deployar en Vercel y verificar que llama correctamente a AWS

> 🎯 **Al completar este ejercicio** tenés funcionando el núcleo de tu plataforma: un sistema de chat con AI que persiste conversaciones, serverless, escalable y por menos de $5/mes para miles de usuarios.

---

## Módulo VII — RAG Casero: Entendiendo Embeddings

*Antes de usar herramientas profesionales, necesitás entender qué pasa por dentro. Este módulo te enseña qué es un embedding, cómo funciona la similitud coseno y el flujo completo de RAG — todo con código manual. NO es producción, es educación.*

---

### Ejercicio 7.1 — Generar embeddings con Titan

**Objetivo:** Entender qué es un embedding: un vector numérico que representa el significado de un texto.
**Conceptos:** Embeddings, vectores, representación semántica

> 💡 **¿Qué es un embedding?**
> Es un array de números (ej: [0.12, -0.45, 0.78, ...]) que representa el "significado" de un texto. Textos similares producen vectores similares. Esto permite buscar por significado, no por palabras exactas.

```bash
npm install @aws-sdk/client-bedrock-runtime
```

```javascript
// embedding-test.mjs
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
```

```bash
node embedding-test.mjs
```

**✅ Resultado esperado:** Un vector de 1024 dimensiones. Cada número representa una faceta del significado del texto.

---

### Ejercicio 7.2 — Similitud coseno: buscar por significado

**Objetivo:** Entender cómo se comparan dos embeddings para determinar si son "parecidos".
**Conceptos:** Similitud coseno, distancia vectorial, búsqueda semántica

```javascript
// similarity-test.mjs
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

// Comparar textos
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
```

**✅ Resultado esperado:** Los textos sobre deploy tendrán similitud alta (~0.8+), el de cocina tendrá similitud baja (~0.3). Eso es búsqueda semántica.

---

### Ejercicio 7.3 — RAG completo casero: documentos + búsqueda + respuesta

**Objetivo:** Armar el flujo completo de RAG de forma manual para entender cada paso.
**Conceptos:** Chunking, indexación, retrieval, prompt augmentation

> ⚠️ **Esto NO es producción.** Estamos guardando vectores en un JSON y haciendo fuerza bruta. No escala. Pero te enseña exactamente qué hace un sistema RAG por dentro.

```javascript
// rag-casero.mjs
import { BedrockRuntimeClient, InvokeModelCommand } from "@aws-sdk/client-bedrock-runtime";
import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";

const bedrock = new BedrockRuntimeClient({ region: "us-east-1" });
const s3 = new S3Client({ region: "us-east-1" });
const BUCKET = "mi-ai-platform-storage";

// --- Paso 1: Generar embedding ---
async function getEmbedding(text) {
  const response = await bedrock.send(new InvokeModelCommand({
    modelId: "amazon.titan-embed-text-v2:0",
    contentType: "application/json",
    body: JSON.stringify({ inputText: text })
  }));
  return JSON.parse(Buffer.from(response.body).toString()).embedding;
}

// --- Paso 2: Similitud coseno ---
function cosineSimilarity(a, b) {
  let dot = 0, normA = 0, normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

// --- Paso 3: Indexar documentos ---
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

// --- Paso 4: Buscar documentos relevantes ---
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

// --- Paso 5: RAG — Retrieval + Generation ---
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

// --- Ejecutar ---
// Documentos de ejemplo (simulan tu knowledge base)
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
```

```bash
node rag-casero.mjs
```

**✅ Resultado esperado:** El sistema indexa 5 documentos, busca los más relevantes a tu pregunta, y el LLM responde usando SOLO la información de tus documentos. Esto es RAG.

> 📌 **Lo que acabás de aprender:** embedding → indexación → búsqueda semántica → augmented generation. Este es el flujo exacto que hacen los sistemas profesionales, solo que ellos usan bases de datos vectoriales con índices optimizados en lugar de un JSON.

---

## Módulo VIII — RAG Profesional: pgvector en RDS

*Ahora que entendés cómo funciona RAG por dentro, vamos a hacerlo bien. PostgreSQL con pgvector es una solución de producción real que se usa en empresas. Y con Free Tier de RDS, es prácticamente gratis.*

---

### Ejercicio 8.1 — Crear instancia RDS PostgreSQL con pgvector

**Objetivo:** Levantar una base de datos PostgreSQL con capacidad vectorial en AWS.
**Conceptos:** RDS, PostgreSQL, pgvector, Free Tier, Security Groups

> 💡 **¿Por qué pgvector?**
> Es una extensión de PostgreSQL que agrega un tipo de dato `vector` y operadores de búsqueda por similitud con índices HNSW. Se usa en producción real. Y al ser Postgres, ya sabés SQL.

```bash
# Crear security group para permitir acceso a la DB
aws ec2 create-security-group \
  --group-name rds-ai-platform \
  --description "Security group for AI platform RDS"

# Abrir puerto 5432 (PostgreSQL) — para práctica, abierto a tu IP
# Reemplazar TU_IP con tu IP pública (buscar "what is my ip" en Google)
aws ec2 authorize-security-group-ingress \
  --group-name rds-ai-platform \
  --protocol tcp \
  --port 5432 \
  --cidr TU_IP/32

# Crear la instancia RDS PostgreSQL (Free Tier)
aws rds create-db-instance \
  --db-instance-identifier ai-platform-db \
  --db-instance-class db.t4g.micro \
  --engine postgres \
  --engine-version 16.4 \
  --master-username postgres \
  --master-user-password TU_PASSWORD_SEGURO \
  --allocated-storage 20 \
  --vpc-security-group-ids TU_SG_ID \
  --publicly-accessible \
  --no-multi-az
```

> ⚠️ **Esperar ~5 minutos** hasta que el estado sea `available`:
```bash
aws rds describe-db-instances \
  --db-instance-identifier ai-platform-db \
  --query 'DBInstances[0].DBInstanceStatus'
```

---

### Ejercicio 8.2 — Configurar pgvector y crear tabla de embeddings

**Objetivo:** Habilitar la extensión pgvector y crear la estructura para almacenar vectores.
**Conceptos:** Extensiones PostgreSQL, tipos de datos vectoriales, índices HNSW

```bash
npm install pg
```

```javascript
// setup-pgvector.mjs
import pg from "pg";

const client = new pg.Client({
  host: "TU_ENDPOINT_RDS", // ai-platform-db.xxxxx.us-east-1.rds.amazonaws.com
  port: 5432,
  user: "postgres",
  password: "TU_PASSWORD_SEGURO",
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
```

```bash
node setup-pgvector.mjs
```

**✅ Resultado esperado:** Extensión habilitada, tabla `documents` creada con columna `vector(1024)` e índice HNSW.

---

### Ejercicio 8.3 — Indexar documentos en PostgreSQL

**Objetivo:** Generar embeddings con Titan y almacenarlos en PostgreSQL con pgvector.
**Conceptos:** Inserción vectorial, embeddings en base de datos

```javascript
// index-documents.mjs
import pg from "pg";
import { BedrockRuntimeClient, InvokeModelCommand } from "@aws-sdk/client-bedrock-runtime";

const bedrock = new BedrockRuntimeClient({ region: "us-east-1" });
const db = new pg.Client({
  host: "TU_ENDPOINT_RDS",
  port: 5432,
  user: "postgres",
  password: "TU_PASSWORD_SEGURO",
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

// Limpiar tabla para re-indexar
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
```

```bash
node index-documents.mjs
```

---

### Ejercicio 8.4 — RAG profesional: búsqueda vectorial + LLM

**Objetivo:** Implementar el flujo RAG completo con búsqueda vectorial real usando pgvector.
**Conceptos:** Búsqueda por similitud SQL, operador `<=>`, retrieval augmented generation

```javascript
// rag-profesional.mjs
import pg from "pg";
import { BedrockRuntimeClient, InvokeModelCommand } from "@aws-sdk/client-bedrock-runtime";

const bedrock = new BedrockRuntimeClient({ region: "us-east-1" });
const db = new pg.Client({
  host: "TU_ENDPOINT_RDS",
  port: 5432,
  user: "postgres",
  password: "TU_PASSWORD_SEGURO",
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

// Probar varias preguntas
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
```

```bash
node rag-profesional.mjs
```

**✅ Resultado esperado:** Las queries SQL con `<=>` buscan por similitud vectorial usando el índice HNSW. Milisegundos en vez de fuerza bruta. Esto SÍ escala a millones de documentos.

---

### Ejercicio 8.5 — Actualizar Lambda con RAG profesional

**Objetivo:** Integrar el RAG con pgvector en la Lambda existente para tener un endpoint completo.
**Conceptos:** Lambda layers, variables de entorno, conexión a RDS desde Lambda

```bash
# Agregar variables de entorno a la Lambda
aws lambda update-function-configuration \
  --function-name ai-platform-handler \
  --environment Variables='{
    "DB_HOST":"TU_ENDPOINT_RDS",
    "DB_PASSWORD":"TU_PASSWORD_SEGURO",
    "BUCKET":"mi-ai-platform-storage"
  }'
```

> 📌 **Para producción** usarías AWS Secrets Manager en lugar de variables de entorno para las credenciales. Pero para practicar, esto funciona.

---

### Ejercicio 8.6 — Limpiar recursos (importante para no gastar)

**Objetivo:** Eliminar la instancia RDS cuando termines de practicar para evitar costos.
**Conceptos:** Gestión de costos, limpieza de recursos

```bash
# Eliminar la instancia RDS (sin snapshot final para ahorrar)
aws rds delete-db-instance \
  --db-instance-identifier ai-platform-db \
  --skip-final-snapshot

# Verificar que se está eliminando
aws rds describe-db-instances \
  --db-instance-identifier ai-platform-db \
  --query 'DBInstances[0].DBInstanceStatus'
```

> ⚠️ **Importante:** Si dejás la instancia RDS corriendo y se te acaba el Free Tier, empieza a cobrar ~$12/mes. Siempre eliminar cuando termines.

---

## Diagrama de Arquitectura Final

```
Usuario
   │
   ▼
Next.js (Vercel)
   │  /api/chat
   ▼
API Gateway (AWS)
   │  POST /chat
   ▼
Lambda Function
   │
   ├──── Bedrock Embeddings ──► Titan (vectorizar query)
   │           │
   │           ▼
   ├──── PostgreSQL + pgvector ──► Búsqueda vectorial (documentos relevantes)
   │
   ├──── Amazon Bedrock ────► Respuesta LLM (con contexto RAG)
   │        (Nova / Llama /
   │         Claude Haiku)
   │
   └──── S3 ────► Historial de conversaciones
                  conversations/{sessionId}.json
```

---

## Referencia Rápida de Comandos

| Acción | Comando |
|--------|---------|
| Verificar identidad | `aws sts get-caller-identity` |
| Listar buckets | `aws s3 ls` |
| Invocar Lambda | `aws lambda invoke --function-name X --payload file://event.json out.json` |
| Ver logs Lambda | `aws logs tail /aws/lambda/NOMBRE --follow` |
| Listar APIs | `aws apigatewayv2 get-apis` |
| Actualizar Lambda | `aws lambda update-function-code --function-name X --zip-file fileb://f.zip` |

---

*AWS AI Engineering · Guía de Ejercicios Prácticos*  
*Construido para desarrolladores que aprenden haciendo*
