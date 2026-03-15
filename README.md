# AWS AI Infrastructure — Hands-on Practice

End-to-end AWS infrastructure for AI applications, built entirely from the CLI. Covers S3, Lambda, API Gateway, Amazon Bedrock (LLMs + Embeddings), and a production-ready RAG pipeline using PostgreSQL with pgvector.

This is not a tutorial that stops at "hello world". It goes from zero to a working AI API with vector search — the same architecture used in production systems.

## What's Inside

| Module | What You Build | AWS Services |
|--------|---------------|--------------|
| I | CLI setup, IAM user, billing alarm | IAM, CloudWatch |
| II | S3 storage with versioning, Node.js integration | S3 |
| III | LLM invocation, model comparison | Bedrock (Nova Lite, Llama 3) |
| IV | Serverless function calling Bedrock | Lambda |
| V | Public HTTP endpoint for the AI function | API Gateway |
| VII | Educational RAG — embeddings + cosine similarity (JSON in S3) | Bedrock Embeddings, S3 |
| VIII | Production RAG — pgvector on PostgreSQL with HNSW index | RDS PostgreSQL, pgvector, Bedrock Embeddings |

## Architecture

```
User
 │
 ▼
API Gateway (HTTP)
 │  POST /chat
 ▼
Lambda Function (Node.js 20)
 │
 ├── Bedrock Embeddings ──► Titan (vectorize query)
 │         │
 │         ▼
 ├── PostgreSQL + pgvector ──► Vector similarity search
 │
 ├── Amazon Bedrock ──► LLM response (with RAG context)
 │      (Nova Lite / Llama 3)
 │
 └── S3 ──► Conversation history
```

## Prerequisites

- AWS account (Free Tier eligible)
- AWS CLI v2
- Node.js 20+
- ~$10–30 USD budget for the full course

## Setup

```bash
# Install AWS CLI
brew install awscli

# Configure credentials
aws configure

# Install dependencies
npm install
```

## Scripts

```bash
# Bedrock — invoke LLMs
npm run bedrock:test          # Single model invocation
npm run bedrock:compare       # Compare Nova Lite vs Llama 3

# S3 — storage operations
npm run s3:test               # Save/retrieve JSON from S3

# Embeddings — understand vectors
npm run embedding:test        # Generate embeddings with Titan
npm run similarity:test       # Cosine similarity between texts

# RAG (educational) — JSON-based vector search
npm run rag:casero            # Full pipeline: index → search → generate

# RAG (production) — pgvector on PostgreSQL
npm run rag:setup-db          # Create pgvector extension + table + HNSW index
npm run rag:index             # Index documents with embeddings
npm run rag:profesional       # Full RAG with SQL vector search
```

## Key Files

| File | Purpose |
|------|---------|
| `bedrock-test.mjs` | Invoke Amazon Nova Lite from Node.js |
| `compare-models.mjs` | Compare response quality and latency across models |
| `embedding-test.mjs` | Generate vector embeddings with Titan Embed v2 |
| `similarity-test.mjs` | Demonstrate cosine similarity for semantic search |
| `rag-casero.mjs` | Educational RAG: embeddings stored as JSON in S3, brute-force search |
| `setup-pgvector.mjs` | Configure PostgreSQL with pgvector extension and HNSW index |
| `index-documents.mjs` | Generate embeddings and store in PostgreSQL |
| `rag-profesional.mjs` | Production RAG: SQL vector search with `<=>` operator |
| `index.mjs` | Lambda handler — Bedrock invocation behind API Gateway |
| `s3-test.mjs` | S3 read/write operations from Node.js |
| `aws-ai-course.md` | Full course guide with all exercises and explanations |

## Why Two RAG Implementations?

The JSON-based RAG (`rag-casero.mjs`) exists to teach what happens inside a RAG system: chunking, embedding, cosine similarity, prompt augmentation. It does not scale.

The pgvector RAG (`rag-profesional.mjs`) is how it's done in production. PostgreSQL with HNSW indexes handles millions of vectors with millisecond latency. This is a real, deployable pattern.

## Cost

- **Bedrock (Nova Lite):** ~$0.0002 per request
- **Bedrock (Titan Embeddings):** ~$0.00002 per embedding
- **RDS (db.t4g.micro):** Free Tier for 12 months — **delete when not in use**
- **Lambda:** 1M free requests/month
- **S3:** negligible at this scale
- **API Gateway:** $1/million requests

Total for completing all exercises: **under $5**.

## Cleanup

```bash
# Delete RDS instance (important — avoid charges)
aws rds delete-db-instance --db-instance-identifier ai-platform-db --skip-final-snapshot

# Delete Lambda
aws lambda delete-function --function-name ai-platform-handler

# Delete API Gateway
aws apigatewayv2 delete-api --api-id YOUR_API_ID

# Delete S3 bucket
aws s3 rb s3://mi-ai-platform-storage --force
```

## License

MIT

---

# AWS AI Infrastructure — Práctica Hands-on

Infraestructura AWS completa para aplicaciones de IA, construida enteramente desde la CLI. Cubre S3, Lambda, API Gateway, Amazon Bedrock (LLMs + Embeddings) y un pipeline RAG de producción usando PostgreSQL con pgvector.

No es un tutorial que se queda en "hello world". Va de cero a una API de IA funcional con búsqueda vectorial — la misma arquitectura que se usa en sistemas de producción.

## Qué Incluye

| Módulo | Qué Construís | Servicios AWS |
|--------|---------------|---------------|
| I | Setup CLI, usuario IAM, alarma de billing | IAM, CloudWatch |
| II | Almacenamiento S3 con versionado, integración Node.js | S3 |
| III | Invocación de LLMs, comparación de modelos | Bedrock (Nova Lite, Llama 3) |
| IV | Función serverless que llama a Bedrock | Lambda |
| V | Endpoint HTTP público para la función de IA | API Gateway |
| VII | RAG educativo — embeddings + similitud coseno (JSON en S3) | Bedrock Embeddings, S3 |
| VIII | RAG producción — pgvector en PostgreSQL con índice HNSW | RDS PostgreSQL, pgvector, Bedrock Embeddings |

## Arquitectura

```
Usuario
 │
 ▼
API Gateway (HTTP)
 │  POST /chat
 ▼
Lambda Function (Node.js 20)
 │
 ├── Bedrock Embeddings ──► Titan (vectorizar query)
 │         │
 │         ▼
 ├── PostgreSQL + pgvector ──► Búsqueda vectorial por similitud
 │
 ├── Amazon Bedrock ──► Respuesta LLM (con contexto RAG)
 │      (Nova Lite / Llama 3)
 │
 └── S3 ──► Historial de conversaciones
```

## Requisitos

- Cuenta AWS (elegible para Free Tier)
- AWS CLI v2
- Node.js 20+
- Presupuesto estimado: ~$10–30 USD para el curso completo

## Instalación

```bash
# Instalar AWS CLI
brew install awscli

# Configurar credenciales
aws configure

# Instalar dependencias
npm install
```

## Por Qué Dos Implementaciones de RAG?

El RAG con JSON (`rag-casero.mjs`) existe para enseñar qué pasa adentro de un sistema RAG: chunking, embedding, similitud coseno, prompt augmentation. No escala.

El RAG con pgvector (`rag-profesional.mjs`) es cómo se hace en producción. PostgreSQL con índices HNSW maneja millones de vectores con latencia de milisegundos. Es un patrón real y desplegable.

## Costos

- **Bedrock (Nova Lite):** ~$0.0002 por request
- **Bedrock (Titan Embeddings):** ~$0.00002 por embedding
- **RDS (db.t4g.micro):** Free Tier por 12 meses — **eliminar cuando no se use**
- **Lambda:** 1M requests gratis/mes
- **S3:** negligible a esta escala
- **API Gateway:** $1/millón de requests

Total para completar todos los ejercicios: **menos de $5**.

## Limpieza de Recursos

```bash
# Eliminar instancia RDS (importante — evitar cargos)
aws rds delete-db-instance --db-instance-identifier ai-platform-db --skip-final-snapshot

# Eliminar Lambda
aws lambda delete-function --function-name ai-platform-handler

# Eliminar API Gateway
aws apigatewayv2 delete-api --api-id TU_API_ID

# Eliminar bucket S3
aws s3 rb s3://mi-ai-platform-storage --force
```

## Licencia

MIT
