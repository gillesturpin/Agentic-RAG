# 🐳 Docker Setup

## Performance Optimizations

This setup uses **CPU-only PyTorch** for optimal build times:
- ⚡ Build time: **3-5 minutes** (vs 60+ with CUDA packages)
- 💾 Image size: **586 MB** backend (vs ~2.5 GB with GPU support)
- 🚀 Works on any machine (no GPU required)

The optimization is in `requirements.txt`:
```python
--extra-index-url https://download.pytorch.org/whl/cpu
torch==2.5.1+cpu
```

## Prerequisites

- Docker & Docker Compose installed
- ANTHROPIC_API_KEY from Anthropic

## Quick Start

```bash
# 1. Configure environment
cp .env.example .env
# Edit .env and add your ANTHROPIC_API_KEY

# 2. Start everything
./docker-start.sh

# Access:
# - Backend: http://localhost:8000
# - Frontend: http://localhost:3000
# - API Docs: http://localhost:8000/docs
```

## Make Commands

```bash
make help          # Show all commands
make up            # Start services
make down          # Stop services
make logs          # View logs
make restart       # Restart services
make test          # Test API
make clean         # Clean volumes
```

## Architecture

```
┌──────────────┐     ┌──────────────┐
│   Frontend   │────▶│   Backend    │
│   (React)    │     │  (FastAPI)   │
│   Port 3000  │     │  Port 8000   │
└──────────────┘     └──────────────┘
                            │
                     ┌──────▼──────┐
                     │  Chroma DB  │
                     │   (Volume)   │
                     └──────────────┘
```

## Volumes

- `./data:/app/data` - Persistent vector store
- `./documents:/app/documents` - Document uploads

## Troubleshooting

### API Key Issues
```bash
# Check if key is loaded
docker-compose exec backend env | grep ANTHROPIC
```

### Reset Database
```bash
make clean
make up
```

### View Logs
```bash
# All services
docker-compose logs -f

# Backend only
docker-compose logs -f backend

# Frontend only
docker-compose logs -f frontend
```

## Production Deployment

For production, consider:

1. **Use secrets** instead of .env file
2. **Add SSL/TLS** with nginx/traefik
3. **Set resource limits** in docker-compose
4. **Use external database** for persistence
5. **Add monitoring** (Prometheus/Grafana)

Example production compose override:

```yaml
# docker-compose.prod.yml
services:
  backend:
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 4G
    restart: always

  frontend:
    deploy:
      resources:
        limits:
          cpus: '1'
          memory: 1G
```

Usage:
```bash
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up
```