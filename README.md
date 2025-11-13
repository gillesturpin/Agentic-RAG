# 🔬 Agentic RAG

**Pure LangChain/LangGraph implementations** - Following official documentation

## What This Is

✅ **100% conforming** to official LangChain documentation
✅ **No business metrics** - Pure RAG implementation
✅ **Two agents** - Standard RAG vs Advanced RAG with grading

## Project Structure

```
backend/
├── rags/
│   ├── rag_agent.py              # Standard RAG with create_agent()
│   └── advanced_rag_agent.py     # Advanced RAG with StateGraph + grading
│
├── api/
│   └── main.py                    # FastAPI server
│
└── data/
    └── chroma_db/                 # Vector store
```

## Prerequisites

- **Docker & Docker Compose** (for Docker setup)
- **Anthropic API Key** - Get one at https://console.anthropic.com/
- **Python 3.12+** (for local development)

## Quick Start

### 🐳 Option 1: Docker (Recommended)

**Why Docker?** Optimized build with CPU-only PyTorch (~175 MB instead of 2.5 GB with CUDA)
- ⚡ **Fast build**: 3-5 minutes (vs 60+ minutes with GPU packages)
- 💾 **Lightweight**: 586 MB backend image
- 🚀 **Production-ready**: Works on any machine (no GPU needed)

```bash
# 1. Configure environment
cp .env.example .env
# Edit .env and add your ANTHROPIC_API_KEY

# 2. Start services
docker-compose up -d
# Or use convenience scripts:
./docker-start.sh  # Start
make up            # Start services
make logs          # View logs
make down          # Stop services

# 3. Access the application
# Frontend: http://localhost:3000
# Backend:  http://localhost:8000
# API Docs: http://localhost:8000/docs
```

### 💻 Option 2: Local Development

```bash
# 1. Install dependencies
pip install -r requirements.txt

# 2. Set API key
export ANTHROPIC_API_KEY="your-key-here"

# 3. Run API
cd backend/api
python main.py
```

### 3. Test Agents

#### Standard RAG Agent
```bash
curl -X POST http://localhost:8000/api/rag_agent \
  -H "Content-Type: application/json" \
  -d '{"question": "What is Task Decomposition?"}'
```

Response:
```json
{
  "answer": "Task decomposition is...",
  "used_retrieval": true,
  "latency": 8.5
}
```

#### Advanced RAG Agent (with grading)
```bash
curl -X POST http://localhost:8000/api/advanced_rag_agent \
  -H "Content-Type: application/json" \
  -d '{"question": "What are types of reward hacking?"}'
```

Response:
```json
{
  "answer": "Reward hacking can be categorized into...",
  "num_rewrites": 0,
  "latency": 12.3
}
```

#### Compare Both Agents
```bash
curl -X POST http://localhost:8000/api/compare \
  -H "Content-Type: application/json" \
  -d '{"question": "Explain chain of thought"}'
```

## The Two Agents

### 1️⃣ RAG Agent
- **Based on**: [Build a RAG agent](https://python.langchain.com/docs/tutorials/rag_agent/)
- **Implementation**: `create_agent()` with retrieval tool
- **Flow**: Question → LLM decides → Retrieve if needed → Generate
- **Speed**: Faster (single decision)

### 2️⃣ Advanced RAG Agent
- **Based on**: [Build a custom RAG agent](https://python.langchain.com/docs/tutorials/langgraph/agentic_rag/)
- **Implementation**: `StateGraph` with conditional edges
- **Flow**: Question → Retrieve → Grade documents → Rewrite if needed → Generate
- **Features**: Document grading, query rewriting

## Key Differences

| Feature | RAG Agent | Advanced RAG Agent |
|---------|-----------|-------------------|
| **Retrieval** | Optional (LLM decides) | Always retrieves |
| **Document Grading** | No | Yes |
| **Query Rewriting** | No | Yes (if docs irrelevant) |
| **Speed** | Faster | Slower |
| **Use Case** | General queries | Complex/ambiguous queries |

## API Endpoints

- `GET /` - API status
- `POST /api/rag_agent` - Query standard RAG agent
- `POST /api/advanced_rag_agent` - Query advanced RAG agent
- `POST /api/compare` - Compare both agents
- `GET /health` - Health check

## Architecture

```
User Query
    ↓
FastAPI
    ↓
┌─────────────────┬─────────────────┐
│   RAG Agent     │  Advanced RAG   │
│  create_agent() │   StateGraph    │
│                 │                 │
│  - Tool call    │  - Retrieve     │
│  - Generate     │  - Grade        │
│                 │  - Rewrite      │
│                 │  - Generate     │
└─────────────────┴─────────────────┘
    ↓                    ↓
  Answer              Answer
```

## Based On Official Tutorials

This project implements **exactly** what's documented in:
1. [Build a RAG agent with LangChain](https://python.langchain.com/docs/tutorials/rag_agent/)
2. [Build a custom RAG agent with LangGraph](https://python.langchain.com/docs/tutorials/langgraph/agentic_rag/)

No custom business metrics or proprietary features - just pure LangChain/LangGraph.

## Frontend

React frontend available in `frontend/` for visual comparison of agents.

```bash
cd frontend
npm install
npm run dev
```

Access at http://localhost:5173

## License

MIT