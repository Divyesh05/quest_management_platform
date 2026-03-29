# Quest Management System - Deployment Guide

## Overview

This guide covers the deployment of the Quest Management System using Docker and Kubernetes. The system consists of a Node.js backend, React frontend, PostgreSQL database, Redis cache, and Nginx load balancer.

## Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend    │    │    Backend     │    │   Database     │
│   (React)     │◄──►│   (Node.js)    │◄──►│ (PostgreSQL)   │
│   Port: 80    │    │   Port: 5000   │    │   Port: 5432   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │              ┌─────────────────┐    │
         │              │     Redis       │    │
         └──────────────►│   (Cache)      │◄───┘
                        │   Port: 6379   │
                        └─────────────────┘
```

## Prerequisites

### System Requirements
- **CPU**: 2 cores minimum, 4 cores recommended
- **Memory**: 4GB minimum, 8GB recommended
- **Storage**: 20GB minimum, 50GB recommended
- **Network**: Stable internet connection

### Software Requirements
- **Docker**: 20.10+ 
- **Docker Compose**: 2.0+
- **Kubernetes**: 1.24+ (for production)
- **kubectl**: 1.24+ (for production)
- **Node.js**: 18+ (for building)
- **Git**: 2.30+

### SSL Certificates
- Development: Self-signed certificates (included)
- Production: Valid SSL certificates from Let's Encrypt or CA

## Environment Configuration

### Required Environment Variables

#### Backend
```bash
NODE_ENV=production
DATABASE_URL=postgresql://user:password@host:5432/database
REDIS_URL=redis://password@host:6379
JWT_SECRET=your-super-secret-jwt-key
FRONTEND_URL=https://yourdomain.com
SOCKET_CORS_ORIGIN=https://yourdomain.com
LOG_LEVEL=info
```

#### Frontend
```bash
REACT_APP_API_URL=https://api.yourdomain.com/api
REACT_APP_APP_NAME=QuestHub
REACT_APP_VERSION=1.0.0
```

#### Database
```bash
POSTGRES_DB=quest_management
POSTGRES_USER=quest_user
POSTGRES_PASSWORD=secure_password
```

## Quick Start

### Development Environment

1. **Clone Repository**
```bash
git clone <repository-url>
cd quest-management-system
```

2. **Run Setup Script**
```bash
chmod +x deployment/scripts/setup.sh
./deployment/scripts/setup.sh
```

3. **Start Services**
```bash
./deployment/scripts/deploy.sh development
```

4. **Access Application**
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000/api
- Database: localhost:5432
- Redis: localhost:6379

### Production Environment

1. **Prepare Environment**
```bash
cp deployment/kubernetes/secret.yaml.example deployment/kubernetes/secret.yaml
# Edit secret.yaml with actual values
```

2. **Deploy to Kubernetes**
```bash
./deployment/scripts/deploy.sh production
```

3. **Verify Deployment**
```bash
./deployment/scripts/deploy.sh health
```

## Docker Deployment

### Local Development

#### Using Docker Compose
```bash
# Start all services
docker-compose -f deployment/docker/docker-compose.yml up -d

# View logs
docker-compose -f deployment/docker/docker-compose.yml logs -f

# Stop services
docker-compose -f deployment/docker/docker-compose.yml down
```

#### Individual Services
```bash
# Build backend
docker build -f deployment/docker/Dockerfile.backend -t quest-backend .

# Build frontend
docker build -f deployment/docker/Dockerfile.frontend -t quest-frontend .

# Run backend
docker run -p 5000:5000 quest-backend

# Run frontend
docker run -p 3000:80 quest-frontend
```

### Production Docker

1. **Build Images**
```bash
./deployment/scripts/deploy.sh production
```

2. **Push to Registry**
```bash
docker push your-registry.com/quest-backend:latest
docker push your-registry.com/quest-frontend:latest
```

3. **Update Kubernetes Images**
```bash
kubectl set image deployment/quest-backend quest-backend=your-registry.com/quest-backend:latest -n quest-management
kubectl set image deployment/quest-frontend quest-frontend=your-registry.com/quest-frontend:latest -n quest-management
```

## Kubernetes Deployment

### Cluster Setup

#### 1. Create Namespace
```bash
kubectl apply -f deployment/kubernetes/namespace.yaml
```

#### 2. Apply Configuration
```bash
kubectl apply -f deployment/kubernetes/configmap.yaml
kubectl apply -f deployment/kubernetes/secret.yaml
```

#### 3. Deploy Infrastructure
```bash
# Deploy database
kubectl apply -f deployment/kubernetes/postgres-deployment.yaml

# Deploy cache
kubectl apply -f deployment/kubernetes/redis-deployment.yaml

# Deploy services
kubectl apply -f deployment/kubernetes/service.yaml
```

#### 4. Deploy Applications
```bash
# Deploy backend
kubectl apply -f deployment/kubernetes/backend-deployment.yaml

# Deploy frontend
kubectl apply -f deployment/kubernetes/frontend-deployment.yaml

# Deploy ingress
kubectl apply -f deployment/kubernetes/ingress.yaml
```

### Monitoring and Scaling

#### Check Pod Status
```bash
kubectl get pods -n quest-management
kubectl describe pod <pod-name> -n quest-management
```

#### Scale Applications
```bash
# Scale backend
kubectl scale deployment quest-backend --replicas=5 -n quest-management

# Scale frontend
kubectl scale deployment quest-frontend --replicas=3 -n quest-management
```

#### View Logs
```bash
# Backend logs
kubectl logs -f deployment/quest-backend -n quest-management

# Frontend logs
kubectl logs -f deployment/quest-frontend -n quest-management
```

## SSL/TLS Configuration

### Development (Self-Signed)
```bash
# Generate certificates
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout deployment/ssl/key.pem \
  -out deployment/ssl/cert.pem \
  -subj "/C=US/ST=State/L=City/O=Organization/CN=localhost"
```

### Production (Let's Encrypt)
```bash
# Install cert-manager
kubectl apply -f https://github.com/cert-manager/cert-manager/releases/download/v1.12.0/cert-manager.yaml

# Create ClusterIssuer
cat > cluster-issuer.yaml << EOF
apiVersion: cert-manager.io/v1
kind: ClusterIssuer
metadata:
  name: letsencrypt-prod
spec:
  acme:
    server: https://acme-v02.api.letsencrypt.org/directory
    email: admin@yourdomain.com
    privateKeySecretRef:
      name: letsencrypt-prod
    solvers:
    - http01:
        ingress:
          class: nginx
EOF

kubectl apply -f cluster-issuer.yaml
```

## Database Management

### Migrations
```bash
# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate deploy

# Reset database (development only)
npx prisma migrate reset
```

### Backups
```bash
# Create backup
./deployment/scripts/backup.sh backup

# List backups
./deployment/scripts/backup.sh list

# Restore backup
./deployment/scripts/backup.sh restore 20231201_120000

# Clean old backups
./deployment/scripts/backup.sh clean
```

## Performance Optimization

### Backend Optimization
- **Connection Pooling**: Configured for PostgreSQL
- **Redis Caching**: Session and query caching
- **Compression**: Gzip response compression
- **Rate Limiting**: API endpoint protection

### Frontend Optimization
- **Static Asset Caching**: Long-term caching for assets
- **Image Optimization**: WebP format support
- **Code Splitting**: Lazy loading components
- **Service Workers**: Offline support

### Database Optimization
```sql
-- Create indexes for performance
CREATE INDEX idx_quests_category_difficulty ON quests(category, difficulty);
CREATE INDEX idx_submissions_user_status ON submissions(user_id, status);
CREATE INDEX idx_achievements_user_created ON achievements(user_id, created_at);

-- Analyze query performance
EXPLAIN ANALYZE SELECT * FROM quests WHERE category = 'education';
```

## Monitoring and Logging

### Application Monitoring
```bash
# Health checks
curl http://localhost:5000/health
curl http://localhost:3000/

# Metrics endpoint
curl http://localhost:5000/metrics
```

### Log Management
```bash
# View application logs
./deployment/scripts/deploy.sh logs

# Rotate logs
logrotate -f deployment/config/logrotate.conf

# Centralized logging
docker logs quest-backend --tail=100 | fluentd
```

### Prometheus Monitoring
```yaml
# prometheus.yml
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'quest-backend'
    static_configs:
      - targets: ['backend-service:5000']
    metrics_path: '/metrics'
    scrape_interval: 5s
```

## Security Configuration

### Network Security
```bash
# Firewall rules
ufw allow 22/tcp    # SSH
ufw allow 80/tcp    # HTTP
ufw allow 443/tcp   # HTTPS
ufw deny 5432/tcp  # PostgreSQL (internal only)
ufw deny 6379/tcp  # Redis (internal only)
```

### Application Security
```bash
# Environment variable security
export NODE_ENV=production
export JWT_SECRET=$(openssl rand -hex 32)

# File permissions
chmod 600 deployment/kubernetes/secret.yaml
chmod 700 deployment/ssl/
```

### Container Security
```yaml
# Pod Security Context
securityContext:
  runAsNonRoot: true
  runAsUser: 1001
  fsGroup: 1001
  capabilities:
    drop:
    - ALL
```

## Troubleshooting

### Common Issues

#### Database Connection Errors
```bash
# Check PostgreSQL status
kubectl exec -it postgres-pod -- psql -U quest_user -d quest_management -c "SELECT 1;"

# Check network connectivity
kubectl exec -it backend-pod -- ping postgres-service
```

#### Frontend Build Errors
```bash
# Clear node modules
rm -rf frontend/node_modules
cd frontend && npm install

# Check environment variables
printenv | grep REACT_APP
```

#### SSL Certificate Issues
```bash
# Verify certificates
openssl x509 -in deployment/ssl/cert.pem -text -noout

# Check certificate expiration
openssl x509 -in deployment/ssl/cert.pem -noout -dates
```

### Performance Issues
```bash
# Check resource usage
kubectl top pods -n quest-management
kubectl top nodes

# Check database performance
kubectl exec -it postgres-pod -- psql -U quest_user -d quest_management -c "SELECT * FROM pg_stat_activity;"
```

## Maintenance

### Rolling Updates
```bash
# Update backend
kubectl set image deployment/quest-backend quest-backend=new-version:latest -n quest-management

# Update frontend
kubectl set image deployment/quest-frontend quest-frontend=new-version:latest -n quest-management

# Wait for rollout
kubectl rollout status deployment/quest-backend -n quest-management
kubectl rollout status deployment/quest-frontend -n quest-management
```

### Blue-Green Deployment
```bash
# Create green deployment
kubectl apply -f deployment/kubernetes/backend-deployment-green.yaml

# Update ingress to point to green
kubectl patch ingress quest-ingress -p '{"spec":{"rules":[{"host":"api.questhub.example.com","http":{"paths":[{"path":"/","backend":{"serviceName":"quest-backend-green","servicePort":5000}}]}}]}'

# Test green deployment
# If successful, delete blue deployment
kubectl delete deployment quest-backend-blue -n quest-management
```

## Disaster Recovery

### Backup Strategy
1. **Daily Backups**: Automated database and file backups
2. **Off-site Storage**: Store backups in multiple locations
3. **Recovery Testing**: Regular restore testing
4. **Documentation**: Maintain recovery procedures

### Recovery Procedures
```bash
# 1. Stop all services
./deployment/scripts/deploy.sh cleanup

# 2. Restore from backup
./deployment/scripts/backup.sh restore 20231201_120000

# 3. Verify data integrity
./deployment/scripts/deploy.sh health

# 4. Restart services
./deployment/scripts/deploy.sh production
```

## Environment-Specific Configurations

### Staging Environment
```yaml
# staging-configmap.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: quest-config
  namespace: quest-staging
data:
  NODE_ENV: "staging"
  LOG_LEVEL: "debug"
  FRONTEND_URL: "https://staging.questhub.example.com"
```

### Production Environment
```yaml
# production-configmap.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: quest-config
  namespace: quest-production
data:
  NODE_ENV: "production"
  LOG_LEVEL: "info"
  FRONTEND_URL: "https://questhub.example.com"
```

## Best Practices

### Development
- Use version control for all configuration files
- Test deployment scripts in staging first
- Implement proper error handling and logging
- Use environment-specific configurations
- Regular security updates and patches

### Production
- Implement monitoring and alerting
- Use load balancers for high availability
- Regular backup and recovery testing
- Security scanning and vulnerability assessment
- Performance monitoring and optimization

### CI/CD Integration
```yaml
# .github/workflows/deploy.yml
name: Deploy
on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Deploy to production
        run: ./deployment/scripts/deploy.sh production
```

## Support and Documentation

### Getting Help
- **Documentation**: Check this README and inline comments
- **Issues**: Report bugs and feature requests
- **Community**: Join our Discord/Slack channels
- **Email**: support@questhub.example.com

### Additional Resources
- [Docker Documentation](https://docs.docker.com/)
- [Kubernetes Documentation](https://kubernetes.io/docs/)
- [Nginx Configuration](https://nginx.org/en/docs/)
- [PostgreSQL Performance](https://www.postgresql.org/docs/current/performance.html)

## Version History

### v1.0.0
- Initial deployment configuration
- Docker and Kubernetes support
- Automated deployment scripts
- SSL/TLS configuration
- Backup and recovery procedures

---

**Note**: This deployment guide is continuously updated. Check for the latest version and report any issues or suggestions for improvement.
