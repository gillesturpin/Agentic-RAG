# 🏗️ Architecture des Agents RAG

## Vue d'ensemble

Ce projet implémente deux architectures RAG distinctes basées sur les tutoriels officiels LangChain/LangGraph. Chaque agent a ses propres caractéristiques et cas d'usage optimaux.

## 📊 Comparaison des Architectures

```
┌─────────────────────────────────────────┐
│            User Question                 │
└─────────────────────────────────────────┘
                    │
       ┌────────────┴────────────┐
       ▼                         ▼
┌──────────────┐          ┌──────────────┐
│  RAG Agent   │          │ Advanced RAG │
│              │          │    Agent     │
└──────────────┘          └──────────────┘
       │                         │
       ▼                         ▼
   [Simple]                 [Complexe]
   [Rapide]                 [Précis]
```

---

## 1️⃣ RAG Agent (Standard)

### Architecture
```
User Question
      │
      ▼
┌─────────────────┐
│   LLM Router    │ ← Décide si retrieval nécessaire
└─────────────────┘
      │
      ├─── Oui ──→ ┌──────────────┐
      │            │   Retriever   │
      │            └──────────────┘
      │                   │
      │                   ▼
      │            ┌──────────────┐
      │            │   Documents  │
      │            └──────────────┘
      │                   │
      └─── Non ───────────┤
                          ▼
                   ┌──────────────┐
                   │   Generate   │
                   │    Answer    │
                   └──────────────┘
```

### Caractéristiques
- **Base** : `create_agent()` de LangChain
- **Retrieval** : Optionnel (LLM décide)
- **Flow** : Question → Route → (Retrieve?) → Generate
- **Vitesse** : ⚡ Rapide
- **Complexité** : Simple

### Implémentation
```python
# Création de l'agent avec tool
agent = create_agent(llm, [retriever_tool], prompt)

# Exécution
result = agent.invoke({
    "messages": [{"role": "user", "content": question}]
})
```

### Quand l'utiliser ?
- ✅ Questions simples et directes
- ✅ Besoin de réponses rapides
- ✅ Le LLM peut déjà connaître la réponse
- ✅ Contexte général

### Output
```json
{
  "answer": "La réponse générée",
  "messages": [...],  // Historique
  "used_retrieval": true/false
}
```

---

## 2️⃣ Advanced RAG Agent (avec Grading)

### Architecture
```
User Question
      │
      ▼
┌─────────────────┐
│    Retrieve     │ ← Toujours récupère
└─────────────────┘
      │
      ▼
┌─────────────────┐
│     Grade       │ ← Note la pertinence
│   Documents     │   (binary: yes/no)
└─────────────────┘
      │
      ├─── Relevant ──→ Generate
      │
      └─── Not Relevant
            │
            ▼
      ┌─────────────────┐
      │    Rewrite      │ ← Reformule
      │    Question     │   la question
      └─────────────────┘
            │
            ▼
      [Retry Retrieval]
            │
            ▼
        Generate
```

### Caractéristiques
- **Base** : `StateGraph` de LangGraph
- **Retrieval** : Toujours effectué
- **Grading** : Évalue la pertinence des docs
- **Rewriting** : Reformule si docs non pertinents
- **Flow** : Question → Retrieve → Grade → (Rewrite?) → Generate
- **Vitesse** : 🐢 Plus lent (multi-étapes)
- **Complexité** : Avancée

### État du Graph
```python
class AgentState(TypedDict):
    messages: List[BaseMessage]
    documents: List[Document]
    question: str
    rewrite_count: int
```

### Nodes du StateGraph

#### 1. **retrieve_documents**
```python
def retrieve_documents(state):
    # Récupère toujours des documents
    docs = retriever.invoke(state["question"])
    return {"documents": docs}
```

#### 2. **grade_documents**
```python
def grade_documents(state):
    # Note chaque document (relevant: yes/no)
    relevant_docs = []
    for doc in state["documents"]:
        score = grader.invoke({
            "question": state["question"],
            "document": doc.page_content
        })
        if score["binary_score"] == "yes":
            relevant_docs.append(doc)
```

#### 3. **rewrite_question**
```python
def rewrite_question(state):
    # Reformule pour mieux matcher
    new_question = rewriter.invoke({
        "question": state["question"]
    })
    return {"question": new_question}
```

#### 4. **generate_answer**
```python
def generate_answer(state):
    # Génère avec les docs pertinents
    answer = llm.invoke({
        "context": state["documents"],
        "question": state["question"]
    })
```

### Conditional Edges
```python
# Décide si les docs sont pertinents
def decide_to_generate(state):
    if has_relevant_docs(state):
        return "generate"  # → generate_answer
    else:
        return "rewrite"   # → rewrite_question
```

### Quand l'utiliser ?
- ✅ Questions complexes ou ambiguës
- ✅ Besoin de haute précision
- ✅ Domaines spécialisés
- ✅ Documents de qualité variable
- ✅ Questions mal formulées possibles

### Output
```json
{
  "answer": "La réponse générée",
  "messages": [...],
  "num_rewrites": 0-2  // Nombre de reformulations
}
```

---

## 🔄 Flux de Décision

### RAG Agent (Simple)
```
Question → LLM décide
├─ "Je connais" → Répond directement
└─ "J'ai besoin de docs" → Retrieve → Generate
```

### Advanced RAG Agent
```
Question → Retrieve (toujours)
├─ Docs pertinents → Generate
└─ Docs non pertinents → Rewrite → Retrieve
    ├─ Docs pertinents → Generate
    └─ Toujours pas → Generate avec ce qu'on a
```

---

## 📈 Métriques de Performance

| Métrique | RAG Agent | Advanced RAG |
|----------|-----------|--------------|
| **Latence moyenne** | 2-5s | 5-12s |
| **Appels LLM** | 1-2 | 3-5 |
| **Tokens utilisés** | Moins | Plus |
| **Précision** | Bonne | Excellente |
| **Gestion ambiguïté** | Basique | Avancée |

---

## 🎯 Choix de l'Architecture

### Utilisez **RAG Agent** pour :
- 🚀 Applications temps réel
- 💬 Chatbots généralistes
- 📱 Applications mobiles
- 💰 Optimisation des coûts

### Utilisez **Advanced RAG** pour :
- 🔬 Recherche académique
- ⚖️ Domaines juridiques
- 🏥 Applications médicales
- 📊 Analyse de données complexes

---

## 🔧 Configuration

### Variables d'environnement communes
```bash
ANTHROPIC_API_KEY=sk-ant-...  # LLM principal
```

### Paramètres ajustables

**RAG Agent:**
```python
# Température du LLM (créativité)
temperature = 0.7

# Nombre de docs à récupérer
k = 4
```

**Advanced RAG:**
```python
# Seuil de pertinence (grading)
relevance_threshold = 0.7

# Max reformulations
max_rewrites = 2

# Nombre de docs par retrieve
k = 6
```

---

## 📚 Ressources

- [Tutorial RAG Agent](https://python.langchain.com/docs/tutorials/rag_agent/)
- [Tutorial Advanced RAG](https://python.langchain.com/docs/tutorials/langgraph/agentic_rag/)
- [LangGraph Documentation](https://langchain-ai.github.io/langgraph/)