#!/bin/bash
# Test script for Agentic RAG API

echo "🧪 Testing Agentic RAG API"
echo "========================="

API_URL="http://localhost:8000"

# Check if API is running
echo -e "\n1. Checking API status..."
curl -s $API_URL/ | python3 -m json.tool

# Test RAG Agent
echo -e "\n2. Testing RAG Agent..."
curl -s -X POST $API_URL/api/rag_agent \
  -H "Content-Type: application/json" \
  -d '{"question": "What is Task Decomposition?"}' \
  | python3 -m json.tool

# Test Advanced RAG Agent
echo -e "\n3. Testing Advanced RAG Agent..."
curl -s -X POST $API_URL/api/advanced_rag_agent \
  -H "Content-Type: application/json" \
  -d '{"question": "What are types of reward hacking?"}' \
  | python3 -m json.tool

# Compare both
echo -e "\n4. Comparing both agents..."
curl -s -X POST $API_URL/api/compare \
  -H "Content-Type: application/json" \
  -d '{"question": "Explain chain of thought"}' \
  | python3 -m json.tool

echo -e "\n✅ Tests completed!"