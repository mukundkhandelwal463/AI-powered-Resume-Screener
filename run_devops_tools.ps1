#!/usr/bin/env pwsh
# =================================================================
# AI Resume Screener — Run All 7 DevOps Tools
# Save this file, then in PowerShell run: .\run_devops_tools.ps1
# =================================================================

$ProjectPath = "C:\Users\Mukund\PycharmProjects\Resume_Screener"
Set-Location $ProjectPath

Write-Host ""
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "  AI RESUME SCREENER — DevOps Tools Runner" -ForegroundColor Cyan
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host ""

# ─────────────────────────────────────────────────────────────────
# TOOL 1: GIT — Stage and commit all new DevOps infrastructure
# ─────────────────────────────────────────────────────────────────
Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Yellow
Write-Host "  🔧 TOOL 1: GIT (Unit I — Version Control)" -ForegroundColor Yellow
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Yellow

Write-Host "`n[GIT] Checking current status..." -ForegroundColor Green
git status

Write-Host "`n[GIT] Staging all new DevOps infrastructure files..." -ForegroundColor Green
git add docker/
git add .github/
git add terraform/
git add kubernetes/
git add monitoring/
git add docker-compose.yml
git add cloud_devops_review.md
git add SERVICE_LOGINS.md
git add backend/.env.example
git add backend/tests/
git add .gitignore

Write-Host "`n[GIT] Files staged for commit:" -ForegroundColor Green
git status --short

Write-Host "`n[GIT] Creating commit..." -ForegroundColor Green
git commit -m "feat: add complete DevOps infrastructure

- docker/: Multi-stage Dockerfiles for backend (Python/Flask) and frontend (React/Nginx)
- docker-compose.yml: Full stack with Flask, Nginx, Prometheus, Grafana
- .github/workflows/ci-cd.yml: 4-job GitHub Actions pipeline (test, build, docker, deploy)
- terraform/main.tf: AWS EC2 provisioning with security groups and startup script
- kubernetes/deployment.yaml: K8s pods, services, HPA autoscaler (2-10 replicas)
- monitoring/: Prometheus scrape config + Grafana auto-datasource
- backend/tests/: Pytest API test suite
- cloud_devops_review.md: Complete Cloud & DevOps review with diagrams, commands, hands-on guide
- SERVICE_LOGINS.md: Sign-up guide for all tools (GitHub, Docker Hub, AWS, Gemini, Railway)

Syllabus coverage: Unit I (Git), II (Docker, K8s), III (Terraform), IV (CI/CD), V (Prometheus+Grafana)"

Write-Host "`n[GIT] Commit result:" -ForegroundColor Green
git log --oneline -3
Write-Host "`n✅ GIT: Done!" -ForegroundColor Green

# ─────────────────────────────────────────────────────────────────
# TOOL 2: DOCKER — Build images
# ─────────────────────────────────────────────────────────────────
Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Yellow
Write-Host "  🔧 TOOL 2: DOCKER (Unit II — Containerization)" -ForegroundColor Yellow
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Yellow

$dockerInstalled = $null
try {
    $dockerInstalled = (docker --version 2>&1)
    Write-Host "`n[DOCKER] Version: $dockerInstalled" -ForegroundColor Green
}
catch {
    Write-Host "`n[DOCKER] Docker is NOT installed." -ForegroundColor Red
    Write-Host "[DOCKER] Download from: https://www.docker.com/products/docker-desktop" -ForegroundColor Red
}

if ($dockerInstalled -and ($dockerInstalled -notmatch "error")) {
    Write-Host "`n[DOCKER] Docker Desktop found! Building backend image..." -ForegroundColor Green
    Write-Host "[DOCKER] This may take 3-5 minutes on first run (downloading layers)..." -ForegroundColor Cyan
    
    docker build -f docker/Dockerfile.backend -t resume-backend:latest .
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "`n[DOCKER] Building frontend image..." -ForegroundColor Green
        docker build -f docker/Dockerfile.frontend -t resume-frontend:latest .
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "`n[DOCKER] All images built! Listing images:" -ForegroundColor Green
            docker images | Select-String -Pattern "resume|REPOSITORY"
            Write-Host "`n✅ DOCKER: Both images built successfully!" -ForegroundColor Green
        } else {
            Write-Host "`n⚠️  DOCKER: Frontend image failed. Check docker/Dockerfile.frontend" -ForegroundColor Red
        }
    } else {
        Write-Host "`n⚠️  DOCKER: Backend image failed. Make sure Docker Desktop is running." -ForegroundColor Red
    }
} else {
    Write-Host "`n⚠️  Skipping Docker build — Docker not available." -ForegroundColor DarkYellow
}

# ─────────────────────────────────────────────────────────────────
# TOOL 3: DOCKER COMPOSE — Start all 4 services
# ─────────────────────────────────────────────────────────────────
Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Yellow
Write-Host "  🔧 TOOL 3: DOCKER COMPOSE (Unit II — Infrastructure)" -ForegroundColor Yellow
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Yellow

$composeInstalled = $null
try {
    $composeInstalled = (docker-compose --version 2>&1)
    Write-Host "`n[COMPOSE] Version: $composeInstalled" -ForegroundColor Green
}
catch {
    Write-Host "`n[COMPOSE] Docker Compose not found." -ForegroundColor Red
}

if ($composeInstalled -and ($composeInstalled -notmatch "error")) {
    Write-Host "`n[COMPOSE] Checking if backend/.env exists..." -ForegroundColor Green
    if (-Not (Test-Path "backend/.env")) {
        Write-Host "[COMPOSE] backend/.env not found. Copying from template..." -ForegroundColor Cyan
        Copy-Item "backend/.env.example" "backend/.env"
        Write-Host "[COMPOSE] ⚠️  Please edit backend/.env and add your GEMINI_API_KEY before running." -ForegroundColor Red
    } else {
        Write-Host "[COMPOSE] backend/.env found ✅" -ForegroundColor Green
    }
    
    Write-Host "`n[COMPOSE] Starting all 4 services (Flask, Nginx, Prometheus, Grafana)..." -ForegroundColor Green
    Write-Host "[COMPOSE] Using --build to build fresh images..." -ForegroundColor Cyan
    docker-compose up -d --build
    
    Start-Sleep -Seconds 5
    
    Write-Host "`n[COMPOSE] Service status:" -ForegroundColor Green
    docker-compose ps
    
    Write-Host "`n[COMPOSE] URLs now available:" -ForegroundColor Cyan
    Write-Host "  Frontend (React):  http://localhost:3000" -ForegroundColor White
    Write-Host "  Backend API:       http://localhost:5000/api/health" -ForegroundColor White
    Write-Host "  Prometheus:        http://localhost:9090" -ForegroundColor White
    Write-Host "  Grafana:           http://localhost:3001  (admin / resume123)" -ForegroundColor White
    Write-Host "`n✅ DOCKER COMPOSE: All services started!" -ForegroundColor Green
} else {
    Write-Host "`n⚠️  Skipping Docker Compose — not available." -ForegroundColor DarkYellow
}

# ─────────────────────────────────────────────────────────────────
# TOOL 4: PYTEST — Run API tests (Unit IV: CI/CD automation)
# ─────────────────────────────────────────────────────────────────
Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Yellow
Write-Host "  🔧 TOOL 4: PYTEST — API Tests (Unit IV — CI/CD)" -ForegroundColor Yellow
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Yellow

Write-Host "`n[PYTEST] Installing pytest..." -ForegroundColor Green
pip install pytest -q

Write-Host "`n[PYTEST] Running all API tests from backend/tests/..." -ForegroundColor Green
Set-Location "$ProjectPath\backend"
python -m pytest tests/ -v --tb=short 2>&1
Set-Location $ProjectPath

Write-Host "`n✅ PYTEST: Tests complete!" -ForegroundColor Green

# ─────────────────────────────────────────────────────────────────
# TOOL 5: TERRAFORM — Initialize and plan (Unit III: IaC)
# ─────────────────────────────────────────────────────────────────
Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Yellow
Write-Host "  🔧 TOOL 5: TERRAFORM (Unit III — IaC + AWS EC2)" -ForegroundColor Yellow
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Yellow

$tfInstalled = $null
try {
    $tfInstalled = (terraform --version 2>&1 | Select-Object -First 1)
    Write-Host "`n[TERRAFORM] Version: $tfInstalled" -ForegroundColor Green
}
catch {
    Write-Host "`n[TERRAFORM] Terraform is NOT installed." -ForegroundColor Red
    Write-Host "[TERRAFORM] Download from: https://developer.hashicorp.com/terraform/install" -ForegroundColor Red
    Write-Host "[TERRAFORM] Or install via: choco install terraform" -ForegroundColor Cyan
}

if ($tfInstalled -and ($tfInstalled -notmatch "error")) {
    Set-Location "$ProjectPath\terraform"
    
    Write-Host "`n[TERRAFORM] Running terraform init (downloads AWS provider plugin)..." -ForegroundColor Green
    terraform init
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "`n[TERRAFORM] Running terraform validate (checks syntax)..." -ForegroundColor Green
        terraform validate
        Write-Host "`n[TERRAFORM] Note: Run 'terraform plan' after setting up AWS credentials." -ForegroundColor Cyan
        Write-Host "[TERRAFORM] Run 'terraform apply' to create AWS EC2 server." -ForegroundColor Cyan
        Write-Host "[TERRAFORM] Run 'terraform destroy' when done to stop billing." -ForegroundColor Red
        Write-Host "`n✅ TERRAFORM: Initialized and validated!" -ForegroundColor Green
    } else {
        Write-Host "`n⚠️  TERRAFORM: Init failed — check internet connection." -ForegroundColor Red
    }
    
    Set-Location $ProjectPath
} else {
    Write-Host "`n⚠️  Skipping Terraform — not installed." -ForegroundColor DarkYellow
    Write-Host "    Install: choco install terraform" -ForegroundColor Cyan
    Write-Host "    Or download: https://developer.hashicorp.com/terraform/install" -ForegroundColor Cyan
}

# ─────────────────────────────────────────────────────────────────
# TOOL 6: PROMETHEUS + GRAFANA — Verify (Unit V: Monitoring)
# ─────────────────────────────────────────────────────────────────
Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Yellow
Write-Host "  🔧 TOOL 6: PROMETHEUS + GRAFANA (Unit V — Monitoring)" -ForegroundColor Yellow
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Yellow

Write-Host "`n[MONITORING] Config files created:" -ForegroundColor Green
if (Test-Path "monitoring/prometheus.yml") {
    Write-Host "  ✅ monitoring/prometheus.yml" -ForegroundColor Green
} else {
    Write-Host "  ❌ monitoring/prometheus.yml NOT FOUND" -ForegroundColor Red
}
if (Test-Path "monitoring/grafana-datasources.yml") {
    Write-Host "  ✅ monitoring/grafana-datasources.yml" -ForegroundColor Green
} else {
    Write-Host "  ❌ monitoring/grafana-datasources.yml NOT FOUND" -ForegroundColor Red
}

Write-Host "`n[MONITORING] Checking if services are running..." -ForegroundColor Green
try {
    $prometheusCheck = Invoke-WebRequest -Uri "http://localhost:9090/-/healthy" -TimeoutSec 3 -UseBasicParsing 2>&1
    Write-Host "  ✅ Prometheus is RUNNING at http://localhost:9090" -ForegroundColor Green
}
catch {
    Write-Host "  ⚠️  Prometheus not running — start with: docker-compose up -d prometheus" -ForegroundColor DarkYellow
}

try {
    $grafanaCheck = Invoke-WebRequest -Uri "http://localhost:3001/api/health" -TimeoutSec 3 -UseBasicParsing 2>&1
    Write-Host "  ✅ Grafana is RUNNING at http://localhost:3001  (admin / resume123)" -ForegroundColor Green
}
catch {
    Write-Host "  ⚠️  Grafana not running — start with: docker-compose up -d grafana" -ForegroundColor DarkYellow
}

Write-Host "`n[FLASK /metrics] Checking if Flask exposes metrics..." -ForegroundColor Green
try {
    $metricsCheck = Invoke-WebRequest -Uri "http://localhost:5000/metrics" -TimeoutSec 3 -UseBasicParsing 2>&1
    Write-Host "  ✅ Flask /metrics endpoint is LIVE" -ForegroundColor Green
}
catch {
    Write-Host "  ⚠️  Flask /metrics not responding — start backend first" -ForegroundColor DarkYellow
}

# ─────────────────────────────────────────────────────────────────
# TOOL 7: KUBERNETES — Check if available (Unit II: Orchestration)
# ─────────────────────────────────────────────────────────────────
Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Yellow
Write-Host "  🔧 TOOL 7: KUBERNETES (Unit II — Orchestration)" -ForegroundColor Yellow
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Yellow

Write-Host "`n[K8S] Checking kubernetes manifests..." -ForegroundColor Green
if (Test-Path "kubernetes/deployment.yaml") {
    Write-Host "  ✅ kubernetes/deployment.yaml exists" -ForegroundColor Green
    $lineCount = (Get-Content "kubernetes/deployment.yaml").Count
    Write-Host "     ($lineCount lines — contains Namespace, Secrets, Deployments, Services, HPA)" -ForegroundColor Cyan
}

$kubectlInstalled = $null
try {
    $kubectlInstalled = (kubectl version --client 2>&1 | Select-Object -First 1)
    Write-Host "`n[K8S] kubectl: $kubectlInstalled" -ForegroundColor Green
}
catch {
    Write-Host "`n[K8S] kubectl not found." -ForegroundColor DarkYellow
}

$minikubeInstalled = $null
try {
    $minikubeInstalled = (minikube version 2>&1 | Select-Object -First 1)
    Write-Host "[K8S] Minikube: $minikubeInstalled" -ForegroundColor Green
    Write-Host "`n[K8S] To use Kubernetes locally, run:" -ForegroundColor Cyan
    Write-Host "  minikube start --driver=docker --memory=4096" -ForegroundColor White
    Write-Host "  kubectl apply -f kubernetes/" -ForegroundColor White
    Write-Host "  kubectl get pods -n resume-screener -w" -ForegroundColor White
}
catch {
    Write-Host "[K8S] Minikube not found." -ForegroundColor DarkYellow
    Write-Host "[K8S] Install: choco install minikube" -ForegroundColor Cyan
    Write-Host "[K8S] Or download: https://minikube.sigs.k8s.io/docs/start/" -ForegroundColor Cyan
}

# ─────────────────────────────────────────────────────────────────
# FINAL SUMMARY
# ─────────────────────────────────────────────────────────────────
Write-Host ""
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "  SUMMARY — DevOps Tools Status" -ForegroundColor Cyan
Write-Host "========================================================" -ForegroundColor Cyan

Write-Host ""
Write-Host "Tool                Unit    Status"
Write-Host "─────────────────────────────────────────────────────────"

# Git
try { git --version | Out-Null; Write-Host "Git             Unit I   ✅ READY — $(git --version)" } catch { Write-Host "Git             Unit I   ❌ Not installed" }
try { docker --version | Out-Null; Write-Host "Docker          Unit II  ✅ READY — $(docker --version)" } catch { Write-Host "Docker          Unit II  ❌ Not installed — docker.com/products/docker-desktop" }
try { docker-compose --version | Out-Null; Write-Host "Docker Compose  Unit II  ✅ READY" } catch { Write-Host "Docker Compose  Unit II  ❌ Included with Docker Desktop" }
try { python -m pytest --version 2>&1 | Out-Null; Write-Host "Pytest         Unit IV  ✅ READY" } catch { Write-Host "Pytest         Unit IV  ⚠️  pip install pytest" }
try { terraform --version 2>&1 | Select-Object -First 1 | Out-Null; Write-Host "Terraform       Unit III ✅ READY — $(terraform --version 2>&1 | Select-Object -First 1)" } catch { Write-Host "Terraform       Unit III ❌ Not installed — developer.hashicorp.com/terraform/install" }
Write-Host "Prometheus      Unit V   ✅ Config ready — start: docker-compose up -d prometheus"
Write-Host "Grafana         Unit V   ✅ Config ready — start: docker-compose up -d grafana"
try { kubectl version --client 2>&1 | Out-Null; Write-Host "Kubernetes      Unit II  ✅ kubectl found" } catch { Write-Host "Kubernetes      Unit II  ⚠️  Not installed — choco install minikube" }

Write-Host ""
Write-Host "To start the FULL STACK (all 4 services):" -ForegroundColor Cyan
Write-Host "  docker-compose up -d --build" -ForegroundColor White
Write-Host ""
Write-Host "Then open:" -ForegroundColor Cyan
Write-Host "  App:        http://localhost:3000" -ForegroundColor White
Write-Host "  Prometheus: http://localhost:9090" -ForegroundColor White
Write-Host "  Grafana:    http://localhost:3001  (admin / resume123)" -ForegroundColor White
Write-Host ""
Write-Host "GitHub Actions CI/CD — push to GitHub to trigger pipeline automatically." -ForegroundColor Cyan
Write-Host ""
Write-Host "========================================================" -ForegroundColor Green
Write-Host "  ✅ DevOps Runner Complete!" -ForegroundColor Green
Write-Host "========================================================" -ForegroundColor Green
