#!/bin/bash

# Quest Management System Setup Script
# This script sets up the development environment and installs dependencies

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

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

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Check if running as root
check_root() {
    if [ "$EUID" -eq 0 ]; then
        print_error "This script should not be run as root"
        exit 1
    fi
}

# Detect operating system
detect_os() {
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        OS="linux"
        DISTRO=$(lsb_release -si 2>/dev/null || echo "Unknown")
    elif [[ "$OSTYPE" == "darwin"* ]]; then
        OS="macos"
    elif [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "cygwin" ]]; then
        OS="windows"
    else
        OS="unknown"
    fi
    
    print_info "Detected OS: $OS"
    if [ "$OS" = "linux" ]; then
        print_info "Distribution: $DISTRO"
    fi
}

# Install system dependencies
install_system_deps() {
    print_info "Installing system dependencies..."
    
    case "$OS" in
        "linux")
            if command -v apt-get &> /dev/null; then
                # Ubuntu/Debian
                sudo apt-get update
                sudo apt-get install -y curl wget git build-essential
            elif command -v yum &> /dev/null; then
                # CentOS/RHEL/Fedora
                sudo yum update -y
                sudo yum install -y curl wget git gcc gcc-c++ make
            elif command -v dnf &> /dev/null; then
                # Fedora
                sudo dnf update -y
                sudo dnf install -y curl wget git gcc gcc-c++ make
            fi
            ;;
        "macos")
            # Install Homebrew if not present
            if ! command -v brew &> /dev/null; then
                print_info "Installing Homebrew..."
                /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
            fi
            
            # Install dependencies with Homebrew
            brew install git curl
            ;;
        "windows")
            print_warning "Please install Git and Node.js manually on Windows"
            print_info "Download Git from: https://git-scm.com/download/win"
            print_info "Download Node.js from: https://nodejs.org/en/download/"
            ;;
    esac
    
    print_status "System dependencies installed"
}

# Install Node.js
install_nodejs() {
    print_info "Installing Node.js..."
    
    if command -v node &> /dev/null; then
        NODE_VERSION=$(node --version)
        print_status "Node.js is already installed: $NODE_VERSION"
        
        # Check if version meets requirements
        REQUIRED_NODE_VERSION="18.0.0"
        if [ "$(printf '%s\n' "$REQUIRED_NODE_VERSION" "$NODE_VERSION" | sort -V | head -n1)" = "$REQUIRED_NODE_VERSION" ]; then
            print_status "Node.js version meets requirements"
        else
            print_warning "Node.js version is older than required ($REQUIRED_NODE_VERSION)"
            print_info "Please upgrade Node.js to version $REQUIRED_NODE_VERSION or higher"
        fi
    else
        # Install Node.js using version manager
        case "$OS" in
            "linux")
                # Install using nvm
                curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
                export NVM_DIR="$HOME/.nvm"
                [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
                nvm install 18
                nvm use 18
                ;;
            "macos")
                # Install using nvm
                curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
                export NVM_DIR="$HOME/.nvm"
                [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
                nvm install 18
                nvm use 18
                ;;
            "windows")
                print_warning "Please install Node.js manually on Windows"
                return 1
                ;;
        esac
        
        print_status "Node.js 18 installed successfully"
    fi
}

# Install Docker
install_docker() {
    print_info "Installing Docker..."
    
    if command -v docker &> /dev/null; then
        DOCKER_VERSION=$(docker --version)
        print_status "Docker is already installed: $DOCKER_VERSION"
    else
        case "$OS" in
            "linux")
                if command -v apt-get &> /dev/null; then
                    # Ubuntu/Debian
                    sudo apt-get update
                    sudo apt-get install -y docker.io docker-compose-plugin
                    sudo usermod -aG docker $USER
                elif command -v yum &> /dev/null; then
                    # CentOS/RHEL/Fedora
                    sudo yum install -y docker docker-compose
                    sudo usermod -aG docker $USER
                elif command -v dnf &> /dev/null; then
                    # Fedora
                    sudo dnf install -y docker docker-compose
                    sudo usermod -aG docker $USER
                fi
                ;;
            "macos")
                # Install Docker Desktop for Mac
                print_info "Please install Docker Desktop for Mac from: https://docs.docker.com/docker-for-mac/install/"
                ;;
            "windows")
                # Install Docker Desktop for Windows
                print_info "Please install Docker Desktop for Windows from: https://docs.docker.com/docker-for-windows/install/"
                ;;
        esac
        
        print_status "Docker installation instructions provided"
    fi
}

# Setup PostgreSQL
setup_postgresql() {
    print_info "Setting up PostgreSQL..."
    
    if command -v psql &> /dev/null; then
        POSTGRES_VERSION=$(psql --version)
        print_status "PostgreSQL is already installed: $POSTGRES_VERSION"
    else
        case "$OS" in
            "linux")
                if command -v apt-get &> /dev/null; then
                    sudo apt-get install -y postgresql postgresql-contrib
                elif command -v yum &> /dev/null; then
                    sudo yum install -y postgresql-server postgresql-contrib
                elif command -v dnf &> /dev/null; then
                    sudo dnf install -y postgresql-server postgresql-contrib
                fi
                ;;
            "macos")
                brew install postgresql
                ;;
            "windows")
                print_warning "Please install PostgreSQL manually on Windows"
                print_info "Download from: https://www.postgresql.org/download/windows/"
                ;;
        esac
        
        print_status "PostgreSQL installation instructions provided"
    fi
}

# Setup Redis
setup_redis() {
    print_info "Setting up Redis..."
    
    if command -v redis-server &> /dev/null; then
        REDIS_VERSION=$(redis-server --version)
        print_status "Redis is already installed: $REDIS_VERSION"
    else
        case "$OS" in
            "linux")
                if command -v apt-get &> /dev/null; then
                    sudo apt-get install -y redis-server
                elif command -v yum &> /dev/null; then
                    sudo yum install -y redis
                elif command -v dnf &> /dev/null; then
                    sudo dnf install -y redis
                fi
                ;;
            "macos")
                brew install redis
                ;;
            "windows")
                print_warning "Please install Redis manually on Windows"
                print_info "Download from: https://redis.io/download"
                ;;
        esac
        
        print_status "Redis installation instructions provided"
    fi
}

# Setup project dependencies
setup_project_deps() {
    print_info "Setting up project dependencies..."
    
    # Navigate to project root
    cd "$(dirname "$0")/.."
    
    # Install backend dependencies
    print_info "Installing backend dependencies..."
    cd backend
    npm install
    print_status "Backend dependencies installed"
    
    # Install frontend dependencies
    print_info "Installing frontend dependencies..."
    cd ../frontend
    npm install
    print_status "Frontend dependencies installed"
    
    # Return to project root
    cd ..
}

# Setup environment files
setup_env_files() {
    print_info "Setting up environment files..."
    
    # Backend .env
    if [ ! -f "backend/.env" ]; then
        cp backend/.env.example backend/.env
        print_status "Created backend/.env from example"
    fi
    
    # Frontend .env
    if [ ! -f "frontend/.env" ]; then
        cat > frontend/.env << EOF
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_APP_NAME=QuestHub
REACT_APP_VERSION=1.0.0
EOF
        print_status "Created frontend/.env"
    fi
    
    # Docker Compose .env
    if [ ! -f ".env" ]; then
        cat > .env << EOF
POSTGRES_PASSWORD=quest_password_$(date +%s)
REDIS_PASSWORD=redis_password_$(date +%s)
JWT_SECRET=jwt_secret_$(date +%s | sha256sum | cut -d' ' -f1)
FRONTEND_URL=http://localhost:3000
REACT_APP_API_URL=http://localhost:5000/api
EOF
        print_status "Created Docker Compose .env"
    fi
}

# Setup database
setup_database() {
    print_info "Setting up database..."
    
    # Check if PostgreSQL is running
    if ! pg_isready -h localhost -p 5432 -U quest_user &> /dev/null; then
        print_warning "PostgreSQL is not running"
        print_info "Please start PostgreSQL service"
        return 1
    fi
    
    # Create database
    cd backend
    if npx prisma db push --force-reset &> /dev/null; then
        print_status "Database setup completed"
    else
        print_error "Database setup failed"
        return 1
    fi
    
    cd ..
}

# Generate SSL certificates (development)
setup_ssl() {
    print_info "Setting up SSL certificates for development..."
    
    # Create SSL directory
    mkdir -p deployment/ssl
    
    # Generate self-signed certificates
    if [ ! -f "deployment/ssl/cert.pem" ]; then
        openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
            -keyout deployment/ssl/key.pem \
            -out deployment/ssl/cert.pem \
            -subj "/C=US/ST=State/L=City/O=Organization/CN=localhost" \
            2>/dev/null
        
        print_status "Development SSL certificates generated"
    fi
}

# Setup Git hooks
setup_git_hooks() {
    print_info "Setting up Git hooks..."
    
    # Create hooks directory
    mkdir -p .git/hooks
    
    # Pre-commit hook
    cat > .git/hooks/pre-commit << 'EOF'
#!/bin/bash
echo "Running pre-commit checks..."

# Run linting
npm run lint

# Run tests
npm test

if [ $? -ne 0 ]; then
    echo "Pre-commit checks failed. Commit aborted."
    exit 1
fi
EOF
    
    chmod +x .git/hooks/pre-commit
    print_status "Git pre-commit hook setup completed"
}

# Main setup function
main() {
    print_info "Starting Quest Management System setup..."
    
    check_root
    detect_os
    
    install_system_deps
    install_nodejs
    install_docker
    setup_postgresql
    setup_redis
    setup_project_deps
    setup_env_files
    setup_ssl
    setup_git_hooks
    
    print_status "Setup completed successfully!"
    print_info ""
    print_info "Next steps:"
    print_info "1. Review and update environment files (.env)"
    print_info "2. Start PostgreSQL and Redis services"
    print_info "3. Run 'npm run dev' to start development servers"
    print_info "4. Or run './deployment/scripts/deploy.sh development' to start with Docker"
    print_info ""
    print_info "For production deployment:"
    print_info "1. Update production environment variables"
    print_info "2. Run './deployment/scripts/deploy.sh production'"
    print_info ""
    print_info "For help with deployment:"
    print_info "./deployment/scripts/deploy.sh"
}

# Run main function
main "$@"
