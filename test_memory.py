#!/usr/bin/env python3
"""
Test script to verify memory implementation in Agentic RAG
"""

import requests
import json
import time

BASE_URL = "http://localhost:8000"

def test_memory_basic():
    """Test basic memory functionality with thread_id"""
    print("=" * 60)
    print("TEST 1: Basic Memory Test")
    print("=" * 60)

    thread_id = "test-thread-123"

    # First question with name
    response1 = requests.post(
        f"{BASE_URL}/api/rag_agent",
        json={
            "question": "My name is Alice. What is Task Decomposition?",
            "thread_id": thread_id
        }
    )
    data1 = response1.json()
    print(f"\nQ1: My name is Alice. What is Task Decomposition?")
    print(f"A1: {data1['answer'][:100]}...")
    print(f"Thread ID: {data1.get('thread_id')}")

    # Second question - should remember name
    response2 = requests.post(
        f"{BASE_URL}/api/rag_agent",
        json={
            "question": "What is my name?",
            "thread_id": thread_id  # Same thread
        }
    )
    data2 = response2.json()
    print(f"\nQ2: What is my name?")
    print(f"A2: {data2['answer']}")

    # Check if it remembers
    if "Alice" in data2['answer']:
        print("✅ SUCCESS: Agent remembers the name!")
    else:
        print("❌ FAILED: Agent doesn't remember the name")

    print("\n")

def test_memory_isolation():
    """Test that different threads are isolated"""
    print("=" * 60)
    print("TEST 2: Thread Isolation Test")
    print("=" * 60)

    # Thread 1
    response1 = requests.post(
        f"{BASE_URL}/api/rag_agent",
        json={
            "question": "My name is Bob.",
            "thread_id": "thread-1"
        }
    )

    # Thread 2
    response2 = requests.post(
        f"{BASE_URL}/api/rag_agent",
        json={
            "question": "What is my name?",
            "thread_id": "thread-2"  # Different thread
        }
    )
    data2 = response2.json()

    print(f"\nThread 1: 'My name is Bob'")
    print(f"Thread 2 asks: 'What is my name?'")
    print(f"Thread 2 answer: {data2['answer']}")

    if "Bob" not in data2['answer']:
        print("✅ SUCCESS: Threads are properly isolated")
    else:
        print("❌ FAILED: Thread isolation not working")

    print("\n")

def test_shared_memory_compare():
    """Test shared memory between agents in compare endpoint"""
    print("=" * 60)
    print("TEST 3: Shared Memory in Compare Endpoint")
    print("=" * 60)

    thread_id = "compare-thread-456"

    # First, set context with RAG agent
    response1 = requests.post(
        f"{BASE_URL}/api/rag_agent",
        json={
            "question": "I'm working on a project about LangChain. What is Task Decomposition?",
            "thread_id": thread_id
        }
    )

    # Now compare both agents with follow-up question
    response2 = requests.post(
        f"{BASE_URL}/api/compare",
        json={
            "question": "Can you give me more details about this for my project?",
            "thread_id": thread_id  # Same thread - shared memory
        }
    )
    data = response2.json()

    print("\nFirst question: 'I'm working on a project about LangChain. What is Task Decomposition?'")
    print("\nFollow-up compare: 'Can you give me more details about this for my project?'")
    print(f"\nRAG Agent answer: {data['rag_agent']['answer'][:100]}...")
    print(f"Advanced RAG answer: {data['advanced_rag_agent']['answer'][:100]}...")

    # Check if both agents have context
    rag_has_context = "project" in data['rag_agent']['answer'].lower() or "langchain" in data['rag_agent']['answer'].lower()
    adv_has_context = "project" in data['advanced_rag_agent']['answer'].lower() or "langchain" in data['advanced_rag_agent']['answer'].lower()

    if rag_has_context or adv_has_context:
        print("\n✅ SUCCESS: Agents share memory context")
    else:
        print("\n❌ WARNING: Context might not be fully shared")

    print("\n")

def test_conversation_flow():
    """Test a natural conversation flow"""
    print("=" * 60)
    print("TEST 4: Natural Conversation Flow")
    print("=" * 60)

    thread_id = "conversation-789"

    questions = [
        "Hi, I'm Charlie and I'm learning about RAG systems.",
        "What are the main components of a RAG system?",
        "Can you remind me what my name is?",
        "Based on what I told you I'm learning, what should I focus on next?"
    ]

    for i, question in enumerate(questions, 1):
        response = requests.post(
            f"{BASE_URL}/api/advanced_rag_agent",
            json={
                "question": question,
                "thread_id": thread_id
            }
        )
        data = response.json()
        print(f"\nQ{i}: {question}")
        print(f"A{i}: {data['answer'][:150]}...")
        time.sleep(0.5)  # Small delay between questions

    # Final check
    print("\n" + "=" * 40)
    print("Conversation memory test completed!")
    print("=" * 40)

def main():
    """Run all memory tests"""
    print("\n🧪 TESTING MEMORY IMPLEMENTATION IN AGENTIC RAG\n")

    # Check if API is running
    try:
        response = requests.get(f"{BASE_URL}/health")
        if response.status_code != 200:
            print("❌ API not healthy. Please start the API first.")
            return
    except:
        print("❌ Cannot connect to API. Please run: python backend/api/main.py")
        return

    # Run tests
    test_memory_basic()
    test_memory_isolation()
    test_shared_memory_compare()
    test_conversation_flow()

    print("\n✅ All memory tests completed!\n")

if __name__ == "__main__":
    main()