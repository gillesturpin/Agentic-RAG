#!/usr/bin/env python3
"""
Custom RAG Agent with LangGraph - EXACTLY as documented
https://python.langchain.com/docs/tutorials/langgraph/agentic_rag/

WITH MEMORY SUPPORT - Using InMemorySaver for thread persistence
"""

import os
from typing import Literal
from dotenv import load_dotenv
load_dotenv()

from pydantic import BaseModel, Field
from langchain.chat_models import init_chat_model
from langchain_community.vectorstores import Chroma
from langchain_core.tools import create_retriever_tool
from langgraph.graph import END, MessagesState, StateGraph, START
from langgraph.prebuilt import ToolNode, tools_condition
from langgraph.checkpoint.memory import InMemorySaver


# Prompts EXACTLY from documentation
GRADE_PROMPT = (
    "You are a grader assessing relevance of a retrieved document to a user question. \n "
    "Here is the retrieved document: \n\n {context} \n\n"
    "Here is the user question: {question} \n"
    "If the document contains keyword(s) or semantic meaning related to the user question, grade it as relevant. \n"
    "Give a binary score 'yes' or 'no' score to indicate whether the document is relevant to the question."
)

REWRITE_PROMPT = (
    "Look at the input and try to reason about the underlying semantic intent / meaning.\n"
    "Here is the initial question:"
    "\n ------- \n"
    "{question}"
    "\n ------- \n"
    "Formulate an improved question:"
)

GENERATE_PROMPT = (
    "You are an assistant for question-answering tasks. "
    "Use the following pieces of retrieved context to answer the question. "
    "If you don't know the answer, just say that you don't know. "
    "Provide a clear and complete answer using proper Markdown formatting:\n"
    "- Use ## for main section headings\n"
    "- Use - for bullet points\n"
    "- Add blank lines between sections for readability\n"
    "- For structured content (lists, phases, steps), present it in an organized way\n"
    "Be concise but thorough.\n\n"
    "Question: {question}\n\n"
    "Context: {context}"
)


class GradeDocuments(BaseModel):
    """Grade documents using a binary score for relevance check."""
    binary_score: str = Field(
        description="Relevance score: 'yes' if relevant, or 'no' if not relevant"
    )


class AdvancedRAGAgent:
    """Custom RAG Agent with grading and rewriting - Pure implementation"""

    def __init__(self, vectorstore, checkpointer=None):
        """Initialize with existing vectorstore and optional checkpointer"""
        self.vectorstore = vectorstore

        # Use provided checkpointer or create InMemorySaver
        self.checkpointer = checkpointer or InMemorySaver()

        # Initialize models
        self.response_model = init_chat_model(
            "claude-sonnet-4-5-20250929",
            model_provider="anthropic",
            temperature=0
        )
        self.grader_model = init_chat_model(
            "claude-sonnet-4-5-20250929",
            model_provider="anthropic",
            temperature=0
        )

        # Create retriever tool with increased k for better context
        retriever = self.vectorstore.as_retriever(search_kwargs={"k": 8})
        self.retriever_tool = create_retriever_tool(
            retriever,
            "retrieve_documents",
            "Search and return information from documents.",
        )

        # Build the graph with memory support
        self.graph = self._build_graph()

    def _build_graph(self):
        """Build the LangGraph workflow EXACTLY as documented"""
        workflow = StateGraph(MessagesState)

        # Add nodes
        workflow.add_node("generate_query_or_respond", self.generate_query_or_respond)
        workflow.add_node("retrieve", ToolNode([self.retriever_tool]))
        workflow.add_node("rewrite_question", self.rewrite_question)
        workflow.add_node("generate_answer", self.generate_answer)

        # Add edges
        workflow.add_edge(START, "generate_query_or_respond")

        # Conditional edges
        workflow.add_conditional_edges(
            "generate_query_or_respond",
            tools_condition,
            {
                "tools": "retrieve",
                END: END,
            },
        )

        workflow.add_conditional_edges(
            "retrieve",
            self.grade_documents,
        )

        workflow.add_edge("generate_answer", END)
        workflow.add_edge("rewrite_question", "generate_query_or_respond")

        # Compile with checkpointer for memory support
        return workflow.compile(checkpointer=self.checkpointer)

    def generate_query_or_respond(self, state: MessagesState):
        """Generate response or use retrieval tool"""
        response = self.response_model.bind_tools([self.retriever_tool]).invoke(state["messages"])
        return {"messages": [response]}

    def grade_documents(self, state: MessagesState) -> Literal["generate_answer", "rewrite_question"]:
        """Grade retrieved documents for relevance"""
        question = state["messages"][0].content

        # Get last tool message
        context = ""
        for message in reversed(state["messages"]):
            if message.type == "tool":
                context = message.content
                break

        prompt = GRADE_PROMPT.format(question=question, context=context)
        response = self.grader_model.with_structured_output(GradeDocuments).invoke(
            [{"role": "user", "content": prompt}]
        )

        if response.binary_score == "yes":
            return "generate_answer"
        else:
            return "rewrite_question"

    def rewrite_question(self, state: MessagesState):
        """Rewrite the original question"""
        question = state["messages"][0].content
        prompt = REWRITE_PROMPT.format(question=question)
        response = self.response_model.invoke([{"role": "user", "content": prompt}])
        return {"messages": [{"role": "user", "content": response.content}]}

    def generate_answer(self, state: MessagesState):
        """Generate final answer"""
        question = state["messages"][0].content

        # Get context from tool message
        context = ""
        for message in reversed(state["messages"]):
            if message.type == "tool":
                context = message.content
                break

        prompt = GENERATE_PROMPT.format(question=question, context=context)
        response = self.response_model.invoke([{"role": "user", "content": prompt}])
        return {"messages": [response]}

    def invoke(self, question: str, thread_id: str = None) -> dict:
        """
        Invoke the agent and return the result
        Returns ONLY what's documented - no business metrics

        Args:
            question: The user question
            thread_id: Optional thread ID for conversation memory
        """
        # Build config with thread_id if provided
        config = {}
        if thread_id:
            config = {"configurable": {"thread_id": thread_id}}

        # Call graph with memory support
        result = self.graph.invoke(
            {"messages": [{"role": "user", "content": question}]},
            config
        )

        # Count rewrites (for informational purposes)
        num_rewrites = sum(
            1 for msg in result["messages"]
            if msg.type == "human" and msg != result["messages"][0]
        )

        # Return only essential information
        last_message = result["messages"][-1]

        return {
            "answer": last_message.content,
            "messages": result["messages"],
            "num_rewrites": num_rewrites,
            "thread_id": thread_id  # Return thread_id for frontend tracking
        }


# Test if running standalone
if __name__ == "__main__":
    from langchain_huggingface import HuggingFaceEmbeddings

    # Setup embeddings and vectorstore
    embeddings = HuggingFaceEmbeddings(
        model_name="sentence-transformers/all-MiniLM-L6-v2"
    )

    vectorstore = Chroma(
        persist_directory="../../data/chroma_db",
        embedding_function=embeddings
    )

    # Create agent
    agent = AdvancedRAGAgent(vectorstore)

    # Test
    print("=" * 60)
    print("Advanced RAG Agent (Pure LangGraph Implementation)")
    print("=" * 60)

    q = "What are the types of reward hacking?"
    r = agent.invoke(q)

    print(f"\nQ: {q}")
    print(f"A: {r['answer']}")
    print(f"Rewrites: {r['num_rewrites']}")
    print("=" * 60)