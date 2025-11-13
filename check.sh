#!/bin/bash
# Quick sanity check for the project

echo "🔍 Agentic RAG Project Check"
echo "============================"

# Check Python files
echo -e "\n📝 Python files:"
find backend -name "*.py" -type f | while read file; do
    echo "  ✓ $file"
done

# Check for business metrics (should not exist)
echo -e "\n🔍 Checking for removed business metrics..."
if grep -r "tier.*:" backend --include="*.py" | grep -v "#"; then
    echo "  ⚠️ Found 'tier' in code"
else
    echo "  ✅ No 'tier' found"
fi

if grep -r "cost_estimate" backend --include="*.py" | grep -v "#"; then
    echo "  ⚠️ Found 'cost_estimate' in code"
else
    echo "  ✅ No 'cost_estimate' found"
fi

if grep -r "confidence.*:" backend --include="*.py" | grep -v "#"; then
    echo "  ⚠️ Found 'confidence' in code"
else
    echo "  ✅ No 'confidence' found"
fi

# Check Docker files
echo -e "\n🐳 Docker files:"
for file in Dockerfile docker-compose.yml .dockerignore; do
    if [ -f "$file" ]; then
        echo "  ✓ $file"
    else
        echo "  ✗ $file missing"
    fi
done

# Check structure
echo -e "\n📁 Project structure:"
echo "  Directories: $(find . -type d -not -path "*/\.*" -not -path "*/node_modules*" | wc -l)"
echo "  Python files: $(find backend -name "*.py" | wc -l)"
echo "  Total size: $(du -sh . 2>/dev/null | cut -f1)"

echo -e "\n✅ Check complete!"