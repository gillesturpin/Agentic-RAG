# Multi-stage build for full-stack app on Hugging Face Spaces
FROM python:3.12-slim

# Install Node.js and system dependencies
RUN apt-get update && apt-get install -y \
    curl \
    gcc \
    g++ \
    && curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y nodejs \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend
COPY backend/ ./backend/

# Copy frontend
COPY frontend/ ./frontend/

# Install frontend dependencies and build
WORKDIR /app/frontend
RUN npm install && npm run build

# Create data directory
RUN mkdir -p /app/data/chroma_db

WORKDIR /app

# Expose ports (7860 for frontend, 8000 for backend)
EXPOSE 7860 8000

# Create startup script
RUN echo '#!/bin/bash\n\
python backend/api/main.py &\n\
cd frontend && npx serve -s dist -l 7860' > /app/start.sh && chmod +x /app/start.sh

ENV PYTHONUNBUFFERED=1

CMD ["/app/start.sh"]
