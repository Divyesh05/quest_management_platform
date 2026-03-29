#!/bin/bash

# Quest Management System Deployment Script
# This script automates the deployment process for both development and production environments

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
ENVIRONMENT=${1:-development}
PROJECT_NAME="quest-management"
DOCKER_REGISTRY="your-registry.com"
VERSION=${2:-latest}

echo -e "${BLUE}🚀 Deploying Quest Management System${NC}"
echo -e "${BLUE}Environment: ${YELLOW}$ENVIRONMENT${NC}"
echo -e "${BLUE}Version: ${YELLOW}$VERSION${NC}"

# Function to print colored output
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check prerequisites
check_prerequisites() {
    echo -e "${BLUE}🔍 Checking prerequisites...${NC}"
    
    # Check Docker
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed or not in PATH"
        exit 1
    fi
    print_status "Docker is available"
    
    # Check Docker Compose
    if ! command -v docker-compose &> /dev/null; then
        print_error "Docker Compose is not installed or not in PATH"
        exit 1
    fi
    print_status "Docker Compose is available"
    
    # Check kubectl (for production)
    if [ "$ENVIRONMENT" = "production" ]; then
        if ! command -v kubectl &> /dev/null; then
            print_error "kubectl is not installed or not in PATH"
            exit 1
        fi
        print_status "kubectl is available"
    fi
    
    # Check Node.js (for building)
    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed or not in PATH"
        exit 1
    fi
    print_status "Node.js is available"
    
    # Check npm
    if ! command -v npm &> /dev/null; then
        print_error "npm is not installed or not in PATH"
        exit 1
    fi
    print_status "npm is available"
}

# Build Docker images
build_images() {
    echo -e "${BLUE}🏗️ Building Docker images...${NC}"
    
    # Build backend image
    echo "Building backend image..."
    docker build -f deployment/docker/Dockerfile.backend -t $DOCKER_REGISTRY/$PROJECT_NAME-backend:$VERSION .
    print_status "Backend image built successfully"
    
    # Build frontend image
    echo "Building frontend image..."
    docker build -f deployment/docker/Dockerfile.frontend -t $DOCKER_REGISTRY/$PROJECT_NAME-frontend:$VERSION .
    print_status "Frontend image built successfully"
    
    # Tag images as latest
    if [ "$VERSION" != "latest" ]; then
        docker tag $DOCKER_REGISTRY/$PROJECT_NAME-backend:$VERSION $DOCKER_REGISTRY/$PROJECT_NAME-backend:latest
        docker tag $DOCKER_REGISTRY/$PROJECT_NAME-frontend:$VERSION $DOCKER_REGISTRY/$PROJECT_NAME-frontend:latest
        print_status "Images tagged as latest"
    fi
}

# Deploy to development environment
deploy_development() {
    echo -e "${BLUE}🔧 Deploying to development environment...${NC}"
    
    # Create .env file for Docker Compose
    cat > .env << EOF
POSTGRES_PASSWORD=dev_password_$(date +%s)
REDIS_PASSWORD=dev_redis_$(date +%s)
JWT_SECRET=dev_jwt_secret_$(date +%s | sha256sum | cut -d' ' -f1)
FRONTEND_URL=http://localhost:3000
REACT_APP_API_URL=http://localhost:5000/api
APP_VERSION=$VERSION
EOF
    
    # Stop existing containers
    echo "Stopping existing containers..."
    docker-compose -f deployment/docker/docker-compose.yml down --remove-orphans || true
    
    # Start new containers
    echo "Starting new containers..."
    docker-compose -f deployment/docker/docker-compose.yml up -d --build
    
    # Wait for services to be healthy
    echo "Waiting for services to be healthy..."
    sleep 30
    
    # Check service health
    if curl -f http://localhost:5000/health > /dev/null 2>&1; then
        print_status "Backend service is healthy"
    else
        print_error "Backend service is not healthy"
        return 1
    fi
    
    if curl -f http://localhost:3000 > /dev/null 2>&1; then
        print_status "Frontend service is healthy"
    else
        print_error "Frontend service is not healthy"
        return 1
    fi
    
    print_status "Development deployment completed successfully"
}

# Deploy to production environment
deploy_production() {
    echo -e "${BLUE}🌍 Deploying to production environment...${NC}"
    
    # Check kubectl cluster access
    if ! kubectl cluster-info &> /dev/null; then
        print_error "Cannot access Kubernetes cluster"
        exit 1
    fi
    
    # Apply namespace
    echo "Applying namespace..."
    kubectl apply -f deployment/kubernetes/namespace.yaml
    
    # Apply ConfigMap
    echo "Applying ConfigMap..."
    kubectl apply -f deployment/kubernetes/configmap.yaml
    
    # Apply Secrets
    echo "Applying Secrets..."
    kubectl apply -f deployment/kubernetes/secret.yaml
    
    # Apply database deployment
    echo "Deploying PostgreSQL..."
    kubectl apply -f deployment/kubernetes/postgres-deployment.yaml
    
    # Apply Redis deployment
    echo "Deploying Redis..."
    kubectl apply -f deployment/kubernetes/redis-deployment.yaml
    
    # Apply backend deployment
    echo "Deploying backend..."
    kubectl apply -f deployment/kubernetes/backend-deployment.yaml
    
    # Apply frontend deployment
    echo "Deploying frontend..."
    kubectl apply -f deployment/kubernetes/frontend-deployment.yaml
    
    # Apply services
    echo "Applying services..."
    kubectl apply -f deployment/kubernetes/service.yaml
    
    # Apply ingress
    echo "Applying ingress..."
    kubectl apply -f deployment/kubernetes/ingress.yaml
    
    # Wait for deployments to be ready
    echo "Waiting for deployments to be ready..."
    kubectl wait --for=condition=available --timeout=300s deployment/postgres -n quest-management
    kubectl wait --for=condition=available --timeout=300s deployment/redis -n quest-management
    kubectl wait --for=condition=available --timeout=300s deployment/quest-backend -n quest-management
    kubectl wait --for=condition=available --timeout=300s deployment/quest-frontend -n quest-management
    
    print_status "Production deployment completed successfully"
}

# Rollback deployment
rollback() {
    echo -e "${BLUE}🔄 Rolling back deployment...${NC}"
    
    if [ "$ENVIRONMENT" = "production" ]; then
        # Kubernetes rollback
        echo "Rolling back Kubernetes deployment..."
        kubectl rollout undo deployment/quest-backend -n quest-management
        kubectl rollout undo deployment/quest-frontend -n quest-management
        
        # Wait for rollback to complete
        kubectl rollout status deployment/quest-backend -n quest-management --timeout=300s
        kubectl rollout status deployment/quest-frontend -n quest-management --timeout=300s
        
        print_status "Kubernetes rollback completed"
    else
        # Docker Compose rollback
        echo "Rolling back Docker Compose deployment..."
        docker-compose -f deployment/docker/docker-compose.yml down
        docker-compose -f deployment/docker/docker-compose.yml up -d
        
        print_status "Docker Compose rollback completed"
    fi
}

# Health check
health_check() {
    echo -e "${BLUE}🏥 Performing health check...${NC}"
    
    if [ "$ENVIRONMENT" = "production" ]; then
        # Kubernetes health check
        echo "Checking Kubernetes pods..."
        kubectl get pods -n quest-management
        
        echo "Checking services..."
        kubectl get services -n quest-management
        
        echo "Checking ingress..."
        kubectl get ingress -n quest-management
    else
        # Docker health check
        echo "Checking Docker containers..."
        docker-compose -f deployment/docker/docker-compose.yml ps
        
        echo "Checking service health..."
        if curl -f http://localhost:5000/health > /dev/null 2>&1; then
            print_status "Backend: healthy"
        else
            print_error "Backend: unhealthy"
        fi
        
        if curl -f http://localhost:3000 > /dev/null 2>&1; then
            print_status "Frontend: healthy"
        else
            print_error "Frontend: unhealthy"
        fi
    fi
}

# Cleanup
cleanup() {
    echo -e "${BLUE}🧹 Cleaning up...${NC}"
    
    if [ "$ENVIRONMENT" = "production" ]; then
        # Kubernetes cleanup
        echo "Cleaning up Kubernetes resources..."
        kubectl delete namespace quest-management --ignore-not-found=true
        print_status "Kubernetes resources cleaned up"
    else
        # Docker cleanup
        echo "Cleaning up Docker resources..."
        docker-compose -f deployment/docker/docker-compose.yml down --volumes --remove-orphans
        docker system prune -f
        print_status "Docker resources cleaned up"
    fi
}

# Show logs
show_logs() {
    echo -e "${BLUE}📋 Showing logs...${NC}"
    
    if [ "$ENVIRONMENT" = "production" ]; then
        # Kubernetes logs
        echo "Backend logs:"
        kubectl logs -f deployment/quest-backend -n quest-management --tail=100
    else
        # Docker logs
        echo "Backend logs:"
        docker-compose -f deployment/docker/docker-compose.yml logs -f backend --tail=100
        
        echo "Frontend logs:"
        docker-compose -f deployment/docker/docker-compose.yml logs -f frontend --tail=100
    fi
}

# Main deployment logic
main() {
    check_prerequisites
    
    case "$ENVIRONMENT" in
        "development")
            build_images
            deploy_development
            ;;
        "production")
            build_images
            deploy_production
            ;;
        "rollback")
            rollback
            ;;
        "health")
            health_check
            ;;
        "cleanup")
            cleanup
            ;;
        "logs")
            show_logs
            ;;
        *)
            echo "Usage: $0 {development|production|rollback|health|cleanup|logs} [version]"
            echo ""
            echo "Examples:"
            echo "  $0 development          # Deploy to development environment"
            echo "  $0 production 1.0.0   # Deploy to production with version 1.0.0"
            echo "  $0 rollback            # Rollback to previous version"
            echo "  $0 health              # Check health of deployed services"
            echo "  $0 cleanup             # Clean up all resources"
            echo "  $0 logs                # Show application logs"
            exit 1
            ;;
    esac
    
    print_status "Deployment process completed successfully!"
}

# Run main function with all arguments
main "$@"
