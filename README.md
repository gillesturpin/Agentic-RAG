# 🔬 Agentic RAG

**Pure LangChain/LangGraph implementation** - Following official documentation

## What This Is

✅ **100% conforming** to official LangChain documentation
✅ **No business metrics** - Pure RAG implementation
✅ **Optimized agent** - k=4 retrieval with enhanced prompt for completeness

## Project Structure

```
backend/
├── rags/
│   └── rag_agent.py              # Optimized RAG Agent (k=4, enhanced prompt)
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

### 3. Test the Agent

```bash
curl -X POST http://localhost:8000/api/rag_agent \
  -H "Content-Type: application/json" \
  -d '{"question": "What is Task Decomposition?"}'
```

Response:
```json
{
  "answer": "Task decomposition is a technique where complex tasks are broken down into smaller, manageable steps...",
  "used_retrieval": true,
  "latency": 8.5,
  "thread_id": "thread-xyz"
}
```

## Agent Features

- **Based on**: [Build a RAG agent](https://python.langchain.com/docs/tutorials/rag_agent/)
- **Implementation**: Tool-based agent with LangGraph
- **Flow**: Question → LLM decides → Retrieve if needed → Generate complete answer
- **Optimizations**:
  - k=4 retrieval (balanced coverage without dilution)
  - Enhanced system prompt for complete and comprehensive answers
  - Thread-based conversation memory (InMemorySaver)
- **Use Case**: General-purpose question answering with context-aware retrieval

## API Endpoints

- `GET /` - API status
- `POST /api/rag_agent` - Query the RAG agent (with optional thread_id for conversation memory)
- `POST /api/query` - Adapter endpoint for frontend (with session management)
- `POST /api/query/stream` - Streaming endpoint using Server-Sent Events
- `POST /api/upload` - Upload documents (PDF, TXT, MD, DOCX)
- `GET /api/documents` - List uploaded documents
- `DELETE /api/documents` - Delete a document
- `GET /health` - Health check

## Architecture

```
User Query
    ↓
FastAPI (v2.0.0)
    ↓
RAG Agent (k=4, enhanced prompt)
    │
    ├─ LLM decides if retrieval needed
    ├─ Retrieve from ChromaDB (if needed)
    ├─ Generate complete answer
    └─ Maintain conversation memory (InMemorySaver)
    ↓
Complete Answer
```

## Based On Official Tutorial

This project implements the pattern documented in:
- [Build a RAG agent with LangChain](https://python.langchain.com/docs/tutorials/rag_agent/)

**Optimizations added**:
- k=4 retrieval (vs k=2 in tutorial) for better coverage
- Enhanced system prompt emphasizing completeness
- Thread-based conversation memory with InMemorySaver

No custom business metrics or proprietary features - just pure LangChain/LangGraph.

## Frontend

React frontend available in `frontend/` with:
- Real-time streaming responses (Server-Sent Events)
- Document upload support (PDF, TXT, MD, DOCX)
- Conversation history
- Session management

```bash
cd frontend
npm install
npm run dev
```

Access at http://localhost:5173 (or http://localhost:5174 if 5173 is occupied)

## License

MIT