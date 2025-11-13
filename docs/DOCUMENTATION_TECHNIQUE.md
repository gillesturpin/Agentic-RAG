# 🔧 Documentation Technique

## Table des matières
1. [Stack Technique](#stack-technique)
2. [Structure du Projet](#structure-du-projet)
3. [Implémentation Détaillée](#implémentation-détaillée)
4. [API REST](#api-rest)
5. [Gestion d'État](#gestion-détat)
6. [Optimisations](#optimisations)
7. [Tests](#tests)
8. [Monitoring](#monitoring)

---

## 🛠️ Stack Technique

### Backend
- **Python** 3.12+
- **FastAPI** 0.104.1 - Framework web async
- **LangChain** 0.3.x - Orchestration LLM
- **LangGraph** 0.2.x - Graphs d'agents
- **Anthropic** Claude 3 - LLM principal
- **ChromaDB** - Vector store
- **HuggingFace** - Embeddings

### Frontend
- **React** 18.2
- **Vite** 5.0 - Build tool
- **Axios** - HTTP client
- **Framer Motion** - Animations
- **React Markdown** - Rendu markdown

### Infrastructure
- **Docker** & **Docker Compose**
- **Uvicorn** - ASGI server
- **CORS** - Middleware FastAPI

---

## 📁 Structure du Projet

```
agentic-rag/
├── backend/
│   ├── api/
│   │   └── main.py              # FastAPI server
│   │
│   └── rags/
│       ├── __init__.py           # Exports
│       ├── rag_agent.py         # Agent standard
│       └── advanced_rag_agent.py # Agent avancé
│
├── frontend/
│   ├── src/
│   │   ├── App.jsx              # Composant principal
│   │   └── CompareView.jsx      # Vue comparaison
│   │
│   └── Dockerfile               # Build React
│
├── data/
│   ├── chroma_db/               # Persistance vectorstore
│   └── documents/               # Docs uploadés
│
├── docs/
│   ├── ARCHITECTURE.md          # Ce fichier
│   └── DOCUMENTATION_TECHNIQUE.md
│
├── docker-compose.yml           # Orchestration
├── Dockerfile                   # Build backend
└── requirements.txt             # Dépendances Python
```

---

## 💻 Implémentation Détaillée

### 1. RAG Agent (`rag_agent.py`)

#### Initialisation
```python
class RAGAgent:
    def __init__(self):
        # 1. Charger le LLM
        self.llm = ChatAnthropic(
            model="claude-3-haiku-20240307",
            temperature=0.7,
            max_tokens=1024
        )

        # 2. Créer le vectorstore
        self.embeddings = HuggingFaceEmbeddings(
            model_name="sentence-transformers/all-MiniLM-L6-v2"
        )
        self.vectorstore = Chroma(
            persist_directory="./data/chroma_db",
            embedding_function=self.embeddings
        )

        # 3. Créer le retriever tool
        self.retriever = self.vectorstore.as_retriever(k=4)
        self.retriever_tool = create_retriever_tool(
            self.retriever,
            "search_knowledge_base",
            "Search for relevant information"
        )

        # 4. Créer l'agent
        self.agent = create_agent(
            self.llm,
            [self.retriever_tool],
            system_prompt=self.system_prompt
        )
```

#### Méthode invoke
```python
def invoke(self, question: str) -> dict:
    # Exécuter l'agent
    result = self.agent.invoke({
        "messages": [{"role": "user", "content": question}]
    })

    # Analyser l'utilisation du retrieval
    used_retrieval = any(
        "search_knowledge_base" in str(msg)
        for msg in result["messages"]
    )

    return {
        "answer": result["messages"][-1].content,
        "messages": self._serialize_messages(result["messages"]),
        "used_retrieval": used_retrieval
    }
```

### 2. Advanced RAG Agent (`advanced_rag_agent.py`)

#### StateGraph Setup
```python
class AdvancedRAGAgent:
    def __init__(self):
        # Même init que RAG Agent + ...

        # Créer le workflow graph
        workflow = StateGraph(AgentState)

        # Ajouter les nodes
        workflow.add_node("retrieve", self.retrieve_documents)
        workflow.add_node("grade", self.grade_documents)
        workflow.add_node("generate", self.generate_answer)
        workflow.add_node("rewrite", self.rewrite_question)

        # Définir les edges
        workflow.set_entry_point("retrieve")
        workflow.add_edge("retrieve", "grade")

        # Edge conditionnel après grading
        workflow.add_conditional_edges(
            "grade",
            self.decide_to_generate,
            {
                "generate": "generate",
                "rewrite": "rewrite",
            }
        )

        # Rewrite → retrieve
        workflow.add_edge("rewrite", "retrieve")

        # Fin
        workflow.add_edge("generate", END)

        self.app = workflow.compile()
```

#### Document Grading
```python
def grade_documents(self, state: AgentState) -> AgentState:
    """
    Grade la pertinence de chaque document
    """
    question = state["question"]
    documents = state["documents"]

    # Prompt de grading
    grade_prompt = ChatPromptTemplate.from_messages([
        ("system", "Grade if document is relevant (yes/no)"),
        ("human", "Question: {question}\nDocument: {document}")
    ])

    # Chain avec output structuré
    grader = grade_prompt | self.llm.with_structured_output(GradeSchema)

    relevant_docs = []
    for doc in documents:
        result = grader.invoke({
            "question": question,
            "document": doc.page_content
        })

        if result["binary_score"] == "yes":
            relevant_docs.append(doc)

    return {
        **state,
        "documents": relevant_docs
    }
```

#### Query Rewriting
```python
def rewrite_question(self, state: AgentState) -> AgentState:
    """
    Reformule la question pour améliorer le retrieval
    """
    rewrite_prompt = ChatPromptTemplate.from_messages([
        ("system", """Rewrite the question to improve retrieval.
        Make it more specific and searchable."""),
        ("human", "{question}")
    ])

    rewriter = rewrite_prompt | self.llm | StrOutputParser()

    new_question = rewriter.invoke({"question": state["question"]})

    return {
        **state,
        "question": new_question,
        "rewrite_count": state.get("rewrite_count", 0) + 1
    }
```

---

## 🌐 API REST

### Endpoints

#### `POST /api/rag_agent`
```python
@app.post("/api/rag_agent")
async def query_rag_agent(request: QueryRequest):
    """
    Query standard RAG agent
    """
    try:
        start = time.time()

        result = rag_agent.invoke(request.question)

        return {
            **result,
            "latency": time.time() - start
        }
    except Exception as e:
        raise HTTPException(500, str(e))
```

#### `POST /api/advanced_rag_agent`
```python
@app.post("/api/advanced_rag_agent")
async def query_advanced_rag(request: QueryRequest):
    """
    Query advanced RAG with grading
    """
    try:
        start = time.time()

        result = advanced_agent.invoke(request.question)

        return {
            **result,
            "latency": time.time() - start
        }
    except Exception as e:
        raise HTTPException(500, str(e))
```

#### `POST /api/compare`
```python
@app.post("/api/compare")
async def compare_agents(request: QueryRequest):
    """
    Compare both agents side by side
    """
    # Exécuter en parallèle avec asyncio
    rag_task = asyncio.create_task(
        run_in_threadpool(rag_agent.invoke, request.question)
    )
    advanced_task = asyncio.create_task(
        run_in_threadpool(advanced_agent.invoke, request.question)
    )

    rag_result, advanced_result = await asyncio.gather(
        rag_task, advanced_task
    )

    return {
        "rag_agent": rag_result,
        "advanced_rag": advanced_result
    }
```

### Request/Response Schemas

```python
class QueryRequest(BaseModel):
    question: str

class RAGResponse(BaseModel):
    answer: str
    messages: List[dict]
    used_retrieval: bool
    latency: float

class AdvancedRAGResponse(BaseModel):
    answer: str
    messages: List[dict]
    num_rewrites: int
    latency: float
```

---

## 🔄 Gestion d'État

### AgentState (Advanced RAG)
```python
class AgentState(TypedDict):
    """État partagé entre les nodes du graph"""
    messages: Annotated[List[BaseMessage], operator.add]
    documents: List[Document]
    question: str
    rewrite_count: int
```

### Persistence
- **ChromaDB** : Stockage vectoriel persistant
- **SQLite** : Métadonnées (intégré dans Chroma)
- **File System** : Documents originaux

### Concurrence
```python
# Thread pool pour les opérations bloquantes
from fastapi.concurrency import run_in_threadpool

# Exécution async
result = await run_in_threadpool(agent.invoke, question)
```

---

## ⚡ Optimisations

### 1. Caching
```python
from functools import lru_cache

@lru_cache(maxsize=100)
def get_cached_embeddings(text: str):
    return embeddings.embed_query(text)
```

### 2. Batch Processing
```python
def batch_retrieve(questions: List[str], batch_size=10):
    results = []
    for i in range(0, len(questions), batch_size):
        batch = questions[i:i+batch_size]
        batch_results = retriever.batch(batch)
        results.extend(batch_results)
    return results
```

### 3. Connection Pooling
```python
# Réutilisation des connexions HTTP
session = aiohttp.ClientSession(
    connector=aiohttp.TCPConnector(limit=100)
)
```

### 4. Lazy Loading
```python
class LazyVectorStore:
    def __init__(self):
        self._vectorstore = None

    @property
    def vectorstore(self):
        if self._vectorstore is None:
            self._vectorstore = self._load_vectorstore()
        return self._vectorstore
```

---

## 🧪 Tests

### Unit Tests
```python
# tests/test_rag_agent.py
def test_rag_agent_invoke():
    agent = RAGAgent()
    result = agent.invoke("What is Task Decomposition?")

    assert "answer" in result
    assert "messages" in result
    assert isinstance(result["used_retrieval"], bool)
```

### Integration Tests
```python
# tests/test_api.py
def test_api_rag_endpoint():
    response = client.post(
        "/api/rag_agent",
        json={"question": "test question"}
    )

    assert response.status_code == 200
    assert "answer" in response.json()
```

### Load Tests
```bash
# Avec locust
locust -f tests/load_test.py --host=http://localhost:8000
```

---

## 📊 Monitoring

### Métriques collectées
```python
# Latence par endpoint
latency_histogram = Histogram(
    'request_latency_seconds',
    'Request latency',
    ['endpoint', 'method']
)

# Compteur d'erreurs
error_counter = Counter(
    'request_errors_total',
    'Total errors',
    ['endpoint', 'error_type']
)

# Utilisation du retrieval
retrieval_usage = Counter(
    'retrieval_usage_total',
    'Retrieval tool usage',
    ['agent_type']
)
```

### Logging
```python
import logging

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

logger = logging.getLogger(__name__)

# Usage
logger.info(f"Query processed: {question[:50]}...")
logger.error(f"Error in agent: {str(e)}")
```

### Health Checks
```python
@app.get("/health")
async def health_check():
    try:
        # Vérifier les composants
        _ = rag_agent.vectorstore.similarity_search("test", k=1)

        return {
            "status": "healthy",
            "vectorstore": "connected",
            "llm": "available"
        }
    except Exception as e:
        return {
            "status": "unhealthy",
            "error": str(e)
        }
```

---

## 🚀 Déploiement

### Variables d'environnement
```bash
# .env
ANTHROPIC_API_KEY=sk-ant-...
LOG_LEVEL=INFO
MAX_WORKERS=4
CHROMA_PERSIST_DIR=/data/chroma_db
```

### Docker Multi-stage Build
```dockerfile
# Build stage
FROM python:3.12-slim as builder
WORKDIR /app
COPY requirements.txt .
RUN pip wheel --no-cache-dir --no-deps --wheel-dir /app/wheels -r requirements.txt

# Runtime stage
FROM python:3.12-slim
WORKDIR /app
COPY --from=builder /app/wheels /wheels
RUN pip install --no-cache /wheels/*
COPY backend/ ./backend/
CMD ["python", "backend/api/main.py"]
```

### Scaling
```yaml
# docker-compose.yml
services:
  backend:
    deploy:
      replicas: 3
      resources:
        limits:
          cpus: '2'
          memory: 4G
```

---

## 🔐 Sécurité

### API Key Management
```python
# Jamais en dur dans le code !
api_key = os.getenv("ANTHROPIC_API_KEY")
if not api_key:
    raise ValueError("API key not configured")
```

### Rate Limiting
```python
from slowapi import Limiter

limiter = Limiter(key_func=get_remote_address)

@app.post("/api/rag_agent")
@limiter.limit("10/minute")
async def query_rag_agent(request: QueryRequest):
    # ...
```

### Input Validation
```python
class QueryRequest(BaseModel):
    question: str = Field(..., min_length=1, max_length=1000)

    @validator('question')
    def validate_question(cls, v):
        # Nettoyer l'input
        v = v.strip()
        # Vérifier les injections
        if any(danger in v.lower() for danger in DANGEROUS_PATTERNS):
            raise ValueError("Invalid input")
        return v
```

---

## 📚 Ressources

- [LangChain Docs](https://python.langchain.com/)
- [LangGraph Docs](https://langchain-ai.github.io/langgraph/)
- [FastAPI Docs](https://fastapi.tiangolo.com/)
- [Anthropic API](https://docs.anthropic.com/)