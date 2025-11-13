"""
Agentic RAG - Optimized RAG Agent

Single agent implementation based on official LangChain tutorials:
- RAG Agent: Optimized agent with k=4 retrieval and improved prompt for completeness
"""

from .rag_agent import RAGAgent

__all__ = ["RAGAgent"]
__version__ = "2.0.0"
