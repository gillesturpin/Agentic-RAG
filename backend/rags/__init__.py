"""
Agentic RAG - 2 RAG Agents

Two agent implementations based on official LangChain tutorials:
- RAG Agent: Agent that decides when to use retrieval tool (create_agent)
- Advanced RAG Agent: Self-correcting with document grading and query rewriting
"""

from .rag_agent import RAGAgent
from .advanced_rag_agent import AdvancedRAGAgent

__all__ = ["RAGAgent", "AdvancedRAGAgent"]
__version__ = "1.0.0"
