# ☁️ Cloud & DevOps Complete Review
## AI-Powered Resume Screener — Full Project Workflow

> These notes follow the **actual workflow** of building and deploying the **AI-Powered Resume Screener**, explaining every Cloud & DevOps concept — **why it is used**, **where it is used**, every command, every diagram, and exactly **where to sign up** for each service.

---

## 🔷 Project Overview

**AI Resume Screener** is a full-stack, Gemini-AI-powered system that parses, scores, and improves resumes using NLP — deployed using a complete modern DevOps pipeline.

```mermaid
graph LR
    A["📂 Resume Datasets"] --> B["🤖 ML / NLP Models"]
    B --> C["🐍 Flask Backend"]
    C --> D["⚛️ React Frontend"]
    D --> E["🐳 Docker Containers"]
    E --> F["⚙️ CI/CD Pipeline"]
    F --> G["☁️ Cloud Deployment"]
    G --> H["📊 Monitoring & Security"]

    style A fill:#f9d0c4,stroke:#333,stroke-width:2px
    style B fill:#f4b6c2,stroke:#333,stroke-width:2px
    style C fill:#92a8d1,stroke:#333,stroke-width:2px
    style D fill:#80ced6,stroke:#333,stroke-width:2px
    style E fill:#618685,color:#fff,stroke:#333,stroke-width:2px
    style F fill:#b5e7a0,stroke:#333,stroke-width:2px
    style G fill:#d5e1df,stroke:#333,stroke-width:2px
    style H fill:#e3eaa7,stroke:#333,stroke-width:2px
```

### Technology Stack

| Layer | Technology | What it does |
| :--- | :--- | :--- |
| **Data** | `UpdatedResumeDataSet.csv` (~3MB, ~5,000 rows) | Real labeled resumes for ATS scoring |
| **ML / AI** | scikit-learn, Gemini API (`google-generativeai`) | Classifies job roles, scores ATS, generates career advice |
| **Backend** | Python, Flask, SQLAlchemy, Gunicorn | REST API serving all predictions and auth |
| **Frontend** | React 19, Vite, HTML/CSS, Tailwind | Recruiter and candidate UI for upload and review |
| **Database** | MySQL (production), SQLite (local dev) | Stores users, resumes, OTPs |
| **Containers** | Docker, Docker Compose | Packages app into portable containers |
| **CI/CD** | GitHub Actions | Automates testing, building, and deploying |
| **Cloud IaC** | Terraform + AWS EC2 | Provisions server infrastructure with code |
| **Orchestration** | Kubernetes (K8s) | Manages container scaling in production |
| **Monitoring** | Prometheus, Grafana | Tracks application health and AI performance |

---

## 🔷 Step 1 — Source Code & Version Control (Git)

> **WHY we use Git:** Every developer on the team (frontend, backend, AI models) edits different files. Without Git, overwriting each other's work is inevitable. Git tracks every change, lets you go back to any version, and is the foundation that triggers our entire CI/CD pipeline.
>
> **WHERE it is used:** First tool used — before writing a single line of code. Every push to GitHub triggers the Jenkins/GitHub Actions pipeline automatically.

### Git Lifecycle Diagram

```mermaid
graph LR
    A["🖊️ Working Directory\nyou edit app.py / ai_integration.py"] -- "git add ." --> B["📋 Staging Area\nChanges queued to save"]
    B -- "git commit -m 'message'" --> C["💾 Local Repository\nSaved permanently on PC"]
    C -- "git push origin main" --> D["☁️ Remote Repository\nGitHub — accessible to team"]
    D -- "git pull" --> A

    style A fill:#f39c12,stroke:#333,stroke-width:2px
    style B fill:#2ecc71,stroke:#333,stroke-width:2px
    style C fill:#3498db,stroke:#333,stroke-width:2px
    style D fill:#9b59b6,color:#fff,stroke:#333,stroke-width:2px
```

### Branching Strategy

```mermaid
gitGraph
    commit id: "Initial commit"
    commit id: "Add Flask backend"
    branch dev
    checkout dev
    commit id: "feat: Gemini ATS integration"
    commit id: "fix: PDF parsing edge case"
    checkout main
    merge dev id: "Merge dev → main (triggers Deploy)"
    commit id: "v1.1 - Add React Resume Builder"
```

### Commands We Used

```bash
# ── Setup ──────────────────────────────────────────────────────
git init                                          # Initialize repo in project folder
git config --global user.name  "Your Name"        # Set your identity
git config --global user.email "you@email.com"

# ── Daily Workflow ─────────────────────────────────────────────
git status                                        # See what changed
git add .                                         # Stage all changes
git add backend/app.py                            # Stage one specific file
git commit -m "feat: add Gemini ATS scoring"      # Save a snapshot
git push origin main                              # Push to GitHub

# ── Branching ──────────────────────────────────────────────────
git checkout -b dev                               # Create and switch to dev branch
git checkout main                                 # Switch back to main
git merge dev                                     # Merge dev into main
git branch -d dev                                 # Delete branch after merge

# ── History & Recovery ─────────────────────────────────────────
git log --oneline -10                             # See last 10 commits
git diff HEAD~1                                   # See changes since last commit
git revert HEAD                                   # Undo last commit (safely)

# ── Remote ─────────────────────────────────────────────────────
git remote add origin https://github.com/USERNAME/Resume_Screener.git
git pull origin main                              # Get latest changes from team
git clone https://github.com/USERNAME/Resume_Screener.git  # Download project
```

### `.gitignore` Explained

```gitignore
.venv/              # Virtual environment — NEVER commit (100MB+, reinstalled by pip install)
__pycache__/        # Python bytecode — auto-generated, not source code
*.pyc               # Compiled Python files — machine-specific
.idea/              # PyCharm IDE settings — personal, not shared
backend/.env        # SECRET KEYS — Gemini API key, passwords, NEVER commit to Git!
*.log               # Log files — server runtime output, regenerated
backend/*.db        # SQLite database — local dev only, regenerated
node_modules/       # Node packages — 200MB+, reinstalled by npm install
client/dist/        # Build output — regenerated by npm run build
terraform/*.tfstate # Terraform state — contains secrets, use remote state instead
```

---

## 🔷 Step 2 — The Application: Flask Backend

> **WHY we use Flask:** Flask is a lightweight Python web framework — perfect for wrapping our ML/AI code into a REST API that the frontend and Docker can communicate with.
>
> **WHERE it is used:** The heart of the project. Every resume upload goes through Flask → model → Gemini → database.

### API Architecture Diagram

```mermaid
graph TD
    A["👤 User / Recruiter\nUploads Resume PDF"] --> B["Nginx :80\nReverse Proxy"]
    B --> C["Flask App\napp.py :5000"]
    C --> D["model1.py\nResumeModelService"]
    C --> E["ai_integration.py\nGemini API"]
    D --> F["UpdatedResumeDataSet.csv\n~5000 labeled resumes"]
    D --> G["NLP Pipeline\nTF-IDF + cosine similarity"]
    E --> H["Google Gemini 1.5 Flash\nCloud AI"]
    C --> I[("MySQL / SQLite\nDatabase")]
    C --> J["HTML Templates\nforntend/html/"]
    C --> K["React SPA\nclient/dist/"]
```

### API Endpoints Reference Table

| Method | Endpoint | Why It Exists | What It Does |
| :--- | :--- | :--- | :--- |
| `GET` | `/` | Entry point | Home page HTML |
| `POST` | `/api/analyze-resume` | Core feature | Upload PDF → ATS score + AI suggestions |
| `POST` | `/api/generate-summary` | AI feature | Generate professional summary via Gemini |
| `POST` | `/api/enhance-text` | AI feature | Polish resume bullet points |
| `GET` | `/api/health` | DevOps monitoring | DB + SMTP status — used by Docker health check |
| `POST` | `/api/auth/register` | User management | Register + send OTP email |
| `POST` | `/api/auth/login` | User management | Authenticate + create session |
| `GET` | `/resume-maker/<path>` | SPA routing | Serves React build (Vite dist/) |
| `GET` | `/metrics` | Prometheus | Exposes metrics for monitoring |

### `/api/analyze-resume` Internal Flow

```mermaid
graph TD
    A["POST /api/analyze-resume\nFile: resume.pdf\nForm: job_description"] --> B["extract_resume_text()\nPyPDF2 / pdfplumber / python-docx"]
    B --> C["ResumeModelService\nmodel1.py"]
    C --> D{"Has job description?"}
    D -- Yes --> E["TF-IDF Vectorizer\nKeyword matching vs JD"]
    D -- No --> F["Gemini Full Analysis\nai_integration.py"]
    E --> G["ATS Score 0–100\nSkill gap analysis"]
    F --> G
    G --> H["get_gemini_ats_feedback()\nAI-enhanced suggestions"]
    H --> I["Save to Database\nUser.resume_json + ats_score"]
    I --> J["JSON Response\ncategory, ats_score,\nskills, missing_keywords,\nsuggestions, job_recommendations"]
```

### Start Commands

```bash
# ── Local Development ──────────────────────────────────────────
cd backend
pip install -r requirements.txt              # Install all dependencies

python app.py                                # Dev server — auto-reloads on change
# Available at: http://localhost:5000

# ── Production (Gunicorn) ──────────────────────────────────────
gunicorn app:app \
  --workers 4 \
  --bind 0.0.0.0:5000 \
  --timeout 120 \
  --access-logfile -

# ── Run Tests ──────────────────────────────────────────────────
pip install pytest
python -m pytest backend/tests/ -v           # Run all tests
python -m pytest backend/tests/ -v -k "health"  # Run specific test
```

---

## 🔷 Step 3 — Frontend (React + HTML)

> **WHY we use React:** The Resume Builder is complex — dynamic forms, platform selectors, PDF preview, animations. React manages all this UI state efficiently. The simpler pages (home, upload, login) use plain HTML templates served by Flask.
>
> **WHERE it is used:** React SPA is served from `/resume-maker/` routes. Plain HTML serves all other pages.

```bash
# ── Install and Start (Development) ────────────────────────────
cd client
npm install                                  # Installs React, Vite, Tailwind (from package.json)
npm run dev                                  # Dev server with hot-reload
# Available at: http://localhost:5173

# ── Production Build ───────────────────────────────────────────
npm run build                                # Compiles → client/dist/
# Flask then serves client/dist/ at /resume-maker/...

# ── Check for Errors ───────────────────────────────────────────
npm run lint                                 # ESLint check
```

---

## 🔷 Step 4 — Containerization (Docker)

> **WHY we use Docker:** Our app needs Python 3.11, Flask, PyPDF2, pdfplumber, python-docx, scikit-learn, Node.js 20, Vite. On any new machine or cloud server, installing all this manually is error-prone. Docker packs everything into a single image — run it anywhere identically.
>
> **WHERE it is used:** Every deployment — local testing, CI/CD pipeline, cloud server. Docker is the bridge between "code on laptop" and "running in production."

### VM vs Docker — Why Containers Win

| Feature | Virtual Machine | Docker Container |
| :--- | :--- | :--- |
| **Size** | 5–20 GB full OS | 200–500 MB (shares host kernel) |
| **Startup** | 2–5 minutes | 2–5 seconds |
| **Isolation** | Full separate kernel | Process-level shared kernel |
| **Performance** | 10–20% overhead | Near-native |
| **Where Resume Screener uses** | — | Everything! Dev, CI/CD, Cloud |

### Docker Full Lifecycle

```mermaid
graph LR
    A["📄 Dockerfile\nInstructions"] -->|"docker build -t myapp ."| B["🖼️ Image\nBlueprint snapshot"]
    B -->|"docker run"| C["📦 Container\nRunning instance"]
    C -->|"docker stop"| D["⏸️ Stopped\nContainer paused"]
    D -->|"docker start"| C
    D -->|"docker rm"| E["🗑️ Deleted"]
    B -->|"docker push"| F["☁️ Docker Hub\nImage stored online"]
    F -->|"docker pull"| B
```

### Docker Architecture for Our Project

```mermaid
graph TD
    A["📄 docker/Dockerfile.backend\nFROM python:3.11-slim"] -->|"Stage 1: install deps\nStage 2: copy runtime"| B["🖼️ resume-backend:latest\n~450MB image"]
    C["📄 docker/Dockerfile.frontend\nFROM node:20-alpine → nginx:alpine"] -->|"Stage 1: npm build\nStage 2: nginx serve"| D["🖼️ resume-frontend:latest\n~50MB image"]
    B -->|"docker run -p 5000:5000"| E["📦 Backend Container\nFlask + Gunicorn :5000"]
    D -->|"docker run -p 3000:80"| F["📦 Frontend Container\nNginx :80"]
    G["🖼️ prom/prometheus:latest"] -->|"docker run -p 9090:9090"| H["📦 Prometheus :9090"]
    I["🖼️ grafana/grafana:latest"] -->|"docker run -p 3001:3000"| J["📦 Grafana :3001"]
```

### Why Multi-Stage Build?

```dockerfile
# Stage 1: Builder — LARGE image (has gcc, build tools, all dev deps)
FROM python:3.11-slim AS builder
RUN apt-get install gcc ...        # Build tools — needed to compile C extensions
RUN pip install -r requirements.txt  # Installs pdfplumber, scikit-learn etc.
COPY backend/ ./backend/

# Stage 2: Production — SMALL image (only runtime, no build tools)
FROM python:3.11-slim
COPY --from=builder /usr/local/lib/python3.11/site-packages ...  # Just the installed packages
COPY --from=builder /app/backend ./backend

# Result: Final image is 60% smaller and has NO compiler tools (more secure)
```

### Docker Commands — Complete Reference

```bash
# ── Build Images ───────────────────────────────────────────────
docker build -f docker/Dockerfile.backend  -t resume-backend  .
docker build -f docker/Dockerfile.frontend -t resume-frontend .

# ── Run Containers ─────────────────────────────────────────────
docker run -d \
  -p 5000:5000 \
  --name backend \
  -e GEMINI_API_KEY=your_key \
  -e SMTP_USER=you@gmail.com \
  -e SMTP_PASS=your_app_password \
  resume-backend

docker run -d -p 3000:80 --name frontend resume-frontend

# ── Inspect Running Containers ─────────────────────────────────
docker ps                                    # List all running containers
docker ps -a                                 # Include stopped containers
docker stats                                 # Live CPU/memory usage (like Task Manager)
docker inspect backend                       # Full container config JSON

# ── Logs ───────────────────────────────────────────────────────
docker logs backend                          # Print all logs
docker logs -f backend                       # Follow live logs (Ctrl+C to stop)
docker logs --tail 50 backend                # Last 50 lines only

# ── Exec Into Container (Debugging) ────────────────────────────
docker exec -it backend bash                 # Open shell inside container
docker exec -it backend python               # Python REPL inside container

# ── Cleanup ────────────────────────────────────────────────────
docker stop backend frontend                 # Stop containers
docker rm   backend frontend                 # Remove containers
docker rmi  resume-backend resume-frontend   # Remove images
docker system prune -af                      # Remove ALL unused (careful!)

# ── Push to Docker Hub ─────────────────────────────────────────
docker login                                 # Login to Docker Hub
docker tag  resume-backend  YOURUSERNAME/resume-backend:latest
docker tag  resume-backend  YOURUSERNAME/resume-backend:v1.0
docker push YOURUSERNAME/resume-backend:latest
```

---

## 🔷 Step 5 — Docker Compose (Multi-Container Orchestration)

> **WHY we use Docker Compose:** We need 4 services running together: Flask backend, Nginx frontend, Prometheus, Grafana. Starting each manually with `docker run` is tedious and error-prone. Compose defines all services in one YAML file and starts them all with a single command.
>
> **WHERE it is used:** Local development AND production server. One command brings up the entire system.

### Service Architecture with Docker Compose

```mermaid
graph TD
    U["👤 User (Browser)"] -->|"Port 3000"| F["frontend container\nNginx :80"]
    F -->|"proxy /api/* → Port 5000"| B["backend container\nFlask :5000"]
    B --> DB[("💾 SQLite / MySQL\nresume_screener.db")]
    B -->|"External HTTPS"| G["☁️ Google Gemini API"]
    P["prometheus container\n:9090"] -->|"scrape /metrics\nevery 15s"| B
    GR["grafana container\n:3001"] -->|"PromQL queries"| P
    DEV["👷 DevOps Engineer"] -->|"http://localhost:3001"| GR

    subgraph "resume-network (Docker bridge)"
        F
        B
        P
        GR
    end
```

### Docker Compose Commands

```bash
# ── Start Everything ───────────────────────────────────────────
docker-compose up -d --build     # Build images & start all 4 services in background
docker-compose up                # Start in foreground (see all logs live)
docker-compose up backend        # Start only one service

# ── Status & Logs ──────────────────────────────────────────────
docker-compose ps                # Show status of all services
docker-compose logs              # Logs from all services
docker-compose logs -f backend   # Follow backend logs live
docker-compose logs -f prometheus grafana  # Follow multiple services

# ── Stop & Cleanup ─────────────────────────────────────────────
docker-compose stop              # Stop containers (keep data)
docker-compose down              # Stop AND remove containers + networks
docker-compose down -v           # Also remove volumes (DELETES database data)

# ── Rebuild & Update ───────────────────────────────────────────
docker-compose up -d --build backend    # Rebuild only backend after code change
docker-compose up -d --scale backend=3 # Run 3 backend instances

# ── Access URLs After docker-compose up ────────────────────────
# Frontend (React + HTML):  http://localhost:3000
# Backend API:              http://localhost:5000
# Prometheus:               http://localhost:9090
# Grafana:                  http://localhost:3001   (admin / resume123)
```

### Nginx Reverse Proxy — Why We Need It

```mermaid
graph LR
    A["Browser Request\nhttp://localhost:3000/api/analyze-resume"] --> B["Nginx Container\n:80"]
    B -->|"location /api/\nproxy_pass backend:5000"| C["Flask Backend\n:5000 internal"]
    B -->|"location /\ntry_files /index.html"| D["React App\n/usr/share/nginx/html"]
```

> **Why:** The browser can't talk to `backend:5000` directly — Docker container names are only resolvable inside the Docker network. Nginx acts as the translator: it receives requests on port 3000 from the browser and forwards `/api/` calls to `backend:5000` internally.

---

## 🔷 Step 6 — CI/CD Pipeline (GitHub Actions)

> **WHY we use CI/CD:** Manual deployment means: developer finishes code → SSH into server → git pull → restart server. This takes 20 minutes and introduces human error. CI/CD automates the entire pipeline: code pushed → tested → built → deployed in under 10 minutes, automatically, every single time.
>
> **WHERE it is used:** `.github/workflows/ci-cd.yml`. Triggered on every push to GitHub. Runs in the cloud on GitHub's servers.

### CI/CD Pipeline Flow

```mermaid
graph TD
    A["👨‍💻 Developer\ngit push origin main"] --> B["GitHub detects push\nWebhook triggers Actions"]
    B --> C["🧪 Job 1: Backend Tests\n▸ pip install requirements\n▸ pytest backend/tests/\n▸ Test all API endpoints"]
    B --> D["⚛️ Job 2: Frontend Build\n▸ npm ci\n▸ npm run build\n▸ Validate Vite bundle"]
    C --> E{"Both jobs passed?"}
    D --> E
    E -- "❌ FAIL" --> F["🔴 Developer notified\nDeployment BLOCKED\nFix the bug first"]
    E -- "✅ PASS" --> G["🐳 Job 3: Docker Build\n▸ docker build backend\n▸ docker build frontend\n▸ Push to Docker Hub"]
    G --> H{"Branch = main?"}
    H -- "dev / PR" --> I["⏸️ Stop here\nNo deployment to production"]
    H -- "main ✅" --> J["🚀 Job 4: Deploy to EC2\n▸ SSH into server\n▸ docker pull latest\n▸ docker-compose up\n▸ Health check"]
    J --> K["✅ Live at\nhttp://YOUR_EC2_IP:3000"]
```

### CI/CD — Why Each Job Exists

| Job | Why It's Needed | What Happens If Skipped |
| :--- | :--- | :--- |
| **Backend Tests** | Catches bugs in Flask API before users see them | Broken Gemini integration reaches production |
| **Frontend Build** | Validates React compiles correctly | Blank white page in production |
| **Docker Build** | Ensures Dockerfile is valid | Deployment fails with cryptic error |
| **Deploy** | Automates server update | Manual SSH required every time |

---

## 🔷 Step 7 — Infrastructure as Code (Terraform)

> **WHY we use Terraform:** Clicking through the AWS Console to create servers is not reproducible, not version-controlled, and takes 30 minutes. Terraform lets you write `main.tf` once and run `terraform apply` to create the exact same infrastructure every time in 2 minutes.
>
> **WHERE it is used:** `terraform/main.tf`. Run once to provision the AWS EC2 server. Run `terraform destroy` to delete everything and stop billing.

### IaC vs Manual Comparison

| | Traditional (Clicking AWS Console) | Terraform (IaC) |
| :--- | :--- | :--- |
| **Time** | 30 min per server | 2 min (`terraform apply`) |
| **Reproducible** | ❌ "I forgot what I clicked" | ✅ Same code = same server |
| **Version controlled** | ❌ Not in Git | ✅ `git commit` tracks changes |
| **Team collaboration** | ❌ Only one person knows setup | ✅ Anyone can `terraform apply` |
| **Rollback** | ❌ Manual deletion | ✅ `terraform destroy` + re-apply |

### Terraform Workflow

```mermaid
graph LR
    A["✍️ Write\nmain.tf\n(what you WANT)"] --> B["terraform init\nDownload AWS provider plugin"]
    B --> C["terraform plan\nShow changes (no action yet)"]
    C --> D["terraform apply\nActually CREATE resources on AWS"]
    D --> E["✅ EC2 Server Live\nAll 4 Docker services running"]
    E --> F["terraform destroy\nDELETE everything\n(stop billing)"]

    style D fill:#2ecc71,stroke:#333
    style F fill:#e74c3c,color:#fff,stroke:#333
```

### Terraform State — How It Tracks Infrastructure

```mermaid
graph TD
    A["main.tf\n(desired state)"] --> B["terraform apply"]
    B --> C["AWS Cloud\n(actual resources created)"]
    B --> D["terraform.tfstate\n(what Terraform remembers creating)"]
    D -->|"Next terraform apply:\ncompares desired vs actual"| A
    D -->|"⚠️ Contains secrets!\nAdd to .gitignore"| E["Don't commit!"]
```

### Terraform Commands

```bash
cd terraform/

# 1. Initialize — downloads AWS provider (run once)
terraform init

# 2. Plan — preview what will be CREATED (safe, no changes)
terraform plan

# 3. Apply — CREATE the EC2 instance + security group
terraform apply
# type "yes" when prompted

# 4. View outputs after creation
terraform output
# backend_url       = "http://54.123.45.67:5000"
# frontend_url      = "http://54.123.45.67:3000"
# grafana_url       = "http://54.123.45.67:3001"
# ssh_command       = "ssh -i resume-screener-key.pem ec2-user@54.123.45.67"

# 5. SSH into the server
ssh -i resume-screener-key.pem ec2-user@54.123.45.67

# 6. DESTROY everything (TO STOP AWS BILLING)
terraform destroy
# type "yes" when prompted
```

---

## 🔷 Step 8 — Cloud Services & Deployment Models

> **WHY we understand cloud models:** Your lecturer will ask which deployment model the project uses. The answer: all three!
>
> **WHERE it is used:** AWS EC2 = IaaS. Railway = PaaS. The project is ALREADY deployed on Railway (see `railway.json` in root).

### Cloud Service Models — Applied to Resume Screener

```mermaid
graph TD
    APP["AI Resume Screener App"] --> IaaS
    APP --> PaaS
    APP --> SaaS

    subgraph "IaaS — YOU manage everything above hardware"
        IaaS["AWS EC2 via Terraform\n• You install Docker, Python, Node\n• You manage OS updates\n• Provider gives you: raw server"]
    end

    subgraph "PaaS — YOU just write code"
        PaaS["Railway / Render\n• You push Git code\n• Provider handles: OS, runtime, scaling\n• Already deployed! (railway.json)"]
    end

    subgraph "SaaS — Just use the service"
        SaaS["Gemini AI API\n• No setup, just call the API\n• Google manages everything\nSupabase / PlanetScale for DB"]
    end

    style IaaS fill:#f39c12,stroke:#333
    style PaaS fill:#3498db,color:#fff,stroke:#333
    style SaaS fill:#2ecc71,stroke:#333
```

| Model | What YOU manage | Provider manages | Resume Screener Example |
| :--- | :--- | :--- | :--- |
| **IaaS** | OS, Docker, App, DB | Hardware, network, datacenter | AWS EC2 (Terraform) |
| **PaaS** | Only your code | OS, runtime, servers, scaling | Railway ← Already live! |
| **SaaS** | Nothing — just call API | Literally everything | Gemini API, Gmail SMTP |

### Cloud Deployment Types

| Type | Description | Resume Screener |
| :--- | :--- | :--- |
| **Public Cloud** | Shared AWS infrastructure | EC2, Railway, Render |
| **Private Cloud** | Your own server | Docker on local Linux box |
| **Hybrid Cloud** | Mix of public + private | Backend on EC2, DB on RDS |
| **Community Cloud** | Shared among a group | University cloud lab |

---

## 🔷 Step 9 — Container Orchestration (Kubernetes)

> **WHY we use Kubernetes:** Docker Compose is great for 1 server. But what happens when 1,000 students use the Resume Screener during placement season simultaneously? One Flask container crashes under load. Kubernetes automatically starts more containers (scales up) when CPU is high and removes them when load drops (scales down).
>
> **WHERE it is used:** `kubernetes/deployment.yaml`. Applied on a Kubernetes cluster (AWS EKS, Minikube locally, or GKE).

### Kubernetes Scaling Diagram

```mermaid
graph TD
    A["📮 1000 Resume Uploads\nPeak load"] --> B["⚖️ Kubernetes Load Balancer\n(Service resource)"]
    B --> C["📦 Backend Pod 1\nFlask :5000"]
    B --> D["📦 Backend Pod 2\nFlask :5000"]
    B --> E["📦 Backend Pod 3\nFlask :5000"]
    B --> F["📦 Backend Pod 4 (auto-added)\nFlask :5000"]

    HPA["🔄 HPA Auto-Scaler\nCPU > 70% → Add Pod\nCPU < 30% → Remove Pod"] --> B

    C --> DB[("Shared MySQL")]
    D --> DB
    E --> DB
    F --> DB
```

### Kubernetes vs Docker Compose

| Feature | Docker Compose | Kubernetes |
| :--- | :--- | :--- |
| **Best for** | 1 server, development | Multiple servers, production |
| **Auto-scaling** | ❌ Manual | ✅ Automatic (HPA) |
| **Self-healing** | ❌ No | ✅ Restarts crashed containers |
| **Load balancing** | ❌ No | ✅ Built-in |
| **Zero-downtime deploy** | ❌ Downtime | ✅ Rolling update |

### Kubernetes Commands

```bash
# ── Apply all Kubernetes configs ───────────────────────────────
kubectl apply -f kubernetes/                 # Deploy everything

# ── Check Status ───────────────────────────────────────────────
kubectl get pods -n resume-screener          # List all pods
kubectl get services -n resume-screener      # List services + external IP
kubectl get hpa -n resume-screener           # See autoscaler status
kubectl describe pod <pod-name> -n resume-screener  # Debug a pod

# ── Logs ───────────────────────────────────────────────────────
kubectl logs -f deployment/resume-backend -n resume-screener

# ── Scaling ────────────────────────────────────────────────────
kubectl scale deployment resume-backend --replicas=5 -n resume-screener

# ── Local Testing with Minikube ────────────────────────────────
minikube start                               # Start local K8s cluster
kubectl apply -f kubernetes/
minikube service resume-frontend-svc -n resume-screener  # Open in browser
```

---

## 🔷 Step 10 — Monitoring with Prometheus & Grafana

> **WHY we use monitoring:** The app is live. But is it healthy? How many resumes were screened today? Are there errors in the Gemini API? Is the server about to run out of memory? Without monitoring we are flying blind. Prometheus collects data, Grafana visualizes it.
>
> **WHERE it is used:** `monitoring/prometheus.yml` and `monitoring/grafana-datasources.yml`. Prometheus scrapes `http://backend:5000/metrics` every 15 seconds automatically.

### Monitoring Architecture

```mermaid
graph LR
    A["Flask Backend\napp.py\n/metrics endpoint"] -->|"Prometheus scrapes\nevery 15 seconds"| B["Prometheus\n:9090\nStores time-series data"]
    B -->|"PromQL queries"| C["Grafana\n:3001\nVisual dashboards"]
    C --> D["👷 You\nsee the charts"]

    A -->|"also writes logs"| E["server_errors.log"]
```

### Prometheus Text Format — What `/metrics` Returns

```
# HELP resumes_analyzed_total Total number of resumes analyzed
# TYPE resumes_analyzed_total counter
resumes_analyzed_total 142

# HELP ats_score_avg Average ATS score given
# TYPE ats_score_avg gauge
ats_score_avg 67.4

# HELP gemini_calls_total Total Gemini API calls made
# TYPE gemini_calls_total counter
gemini_calls_total 89

# HELP gemini_errors_total Failed Gemini API calls
# TYPE gemini_errors_total counter
gemini_errors_total 3

# HELP http_requests_total Total HTTP requests by endpoint
# TYPE http_requests_total counter
http_requests_total{endpoint="/api/analyze-resume"} 142
http_requests_total{endpoint="/api/generate-summary"} 58
```

### Grafana Dashboard Panels to Create

| Panel Title | PromQL Query | Chart Type | Why Useful |
| :--- | :--- | :--- | :--- |
| Total Resumes Screened | `resumes_analyzed_total` | Stat | Track usage growth |
| Avg ATS Score | `ats_score_avg` | Gauge | Quality check |
| Gemini Success Rate | `1-(gemini_errors_total/gemini_calls_total)` | Pie | API health |
| Request Rate/min | `rate(http_requests_total[1m])` | Time series | Load trend |
| Error Rate | `rate(gemini_errors_total[5m])` | Alert panel | Catch failures |

### Access Grafana

```bash
# After docker-compose up -d:
# Open browser → http://localhost:3001
# Username: admin
# Password: resume123

# Step-by-step to create a dashboard:
# 1. Left sidebar → Dashboards → New Dashboard
# 2. Add Visualization
# 3. Data source: Prometheus (already connected!)
# 4. Query: resumes_analyzed_total
# 5. Panel title: "Total Resumes Screened"
# 6. Save and apply
```

---

## 🔷 Step 11 — Security & DevSecOps

> **WHY we need security:** Resumes contain highly sensitive personal data — names, emails, phone numbers, employment history. A breach is a legal liability. Security must be "shifted left" — built into every step, not added at the end.
>
> **WHERE it is used:** IAM in AWS (who can access what), `.env` secrets management (never in Git), session cookies (encrypted), OTP codes (expire in 10 min), Docker image scanning in CI/CD.

### Security Architecture

```mermaid
graph TD
    A["👤 User (Browser)"] -->|"HTTPS only\nSSL Certificate"| B["Nginx\n+ Security Headers"]
    B --> C["Flask API\nSession Cookie (encrypted)"]
    C -->|"OTP verified before access"| D["Protected Routes\n/upload /result /jobs"]
    C -->|"IAM Role — read only"| E["MySQL RDS\n(not exposed to internet)"]
    CI["CI/CD Pipeline\nGitHub Actions"] -->|"Scan before deploy"| F["Docker Image\nVulnerability Check"]
    G["AWS IAM Policy\nLeast Privilege"] --> E
    G --> H["S3 Bucket\nResume PDFs"]
```

### Security Practices in This Project

| What | Where in Code | Why |
| :--- | :--- | :--- |
| **`.env` files excluded from Git** | `.gitignore` | Gemini key, DB passwords never reach GitHub |
| **OTP expires in 10 minutes** | `database.py` line 61 | Stolen OTP is useless after 10 min |
| **Session cookies secure** | `app.py` line 131 | Cookie can't be stolen over HTTP |
| **CORS whitelist** | `app.py` line 125 | Only allowed origins can call the API |
| **Password hashing** | `database.py` line 30 | `werkzeug.security` — never store plain text |
| **SQLAlchemy ORM** | `database.py` | Prevents SQL injection automatically |
| **Docker non-root** | `Dockerfile.backend` | Container can't modify host system |

---

## 🔷 Complete System — Everything Together

```mermaid
graph TD
    subgraph "Developer Workstation"
        GIT["Git\ngit push origin main"]
    end

    subgraph "GitHub"
        REPO["Resume_Screener repo\n.github/workflows/ci-cd.yml"]
    end

    subgraph "GitHub Actions (CI/CD)"
        J1["Job 1: pytest tests"]
        J2["Job 2: npm build"]
        J3["Job 3: docker build + push"]
        J4["Job 4: deploy to EC2"]
    end

    subgraph "Docker Hub Registry"
        IMG["resume-backend:latest\nresume-frontend:latest"]
    end

    subgraph "AWS EC2 (via Terraform)"
        DC["docker-compose.yml\n4 services running"]
        BE["Flask :5000"]
        FE["Nginx :3000"]
        PR["Prometheus :9090"]
        GR["Grafana :3001"]
    end

    subgraph "Kubernetes (Scale)"
        K8["K8s Cluster\nHPA: 2-10 pods"]
    end

    GIT --> REPO
    REPO --> J1
    REPO --> J2
    J1 --> J3
    J2 --> J3
    J3 --> IMG
    IMG --> J4
    J4 --> DC
    DC --> BE
    DC --> FE
    DC --> PR
    DC --> GR
    BE --> K8
```

---

## 🔐 Where to Login / Sign Up for Every Service

### Quick Reference Table

| Service | Sign Up URL | What You Get | Cost | Used For |
| :--- | :--- | :--- | :--- | :--- |
| **GitHub** | https://github.com/signup | Code repo + CI/CD | Free | Source control + pipeline |
| **Docker Hub** | https://hub.docker.com/signup | Image registry | Free | Store Docker images |
| **Google AI Studio** | https://aistudio.google.com/apikey | Gemini API Key | Free tier | AI resume analysis |
| **AWS** | https://aws.amazon.com/free | EC2, IAM, RDS | Free tier 12mo | Cloud server (Terraform) |
| **Railway** | https://railway.app | PaaS + MySQL | Free credit | Already deployed! |
| **Render** | https://render.com | PaaS alternative | Free tier | Backup deployment |
| **Grafana Cloud** | https://grafana.com/auth/sign-up | Hosted dashboards | Free | Remote monitoring |
| **Terraform Cloud** | https://app.terraform.io/signup | Remote state | Free | Team Terraform collab |

---

### 🔑 Service 1: GitHub — Code & CI/CD Secrets

**URL:** https://github.com/signup

```bash
# After creating account:
git remote add origin https://github.com/YOUR_USERNAME/Resume_Screener.git
git push -u origin main
```

**Add CI/CD Secrets** → `Repo → Settings → Secrets and variables → Actions → New repository secret`:

| Secret Name | Value | Where to Get It |
| :--- | :--- | :--- |
| `DOCKERHUB_USERNAME` | Your Docker Hub username | Docker Hub account page |
| `DOCKERHUB_TOKEN` | Docker Hub access token | Docker Hub → Settings → Security |
| `GEMINI_API_KEY` | Your Gemini key | https://aistudio.google.com/apikey |
| `EC2_HOST` | EC2 public IP | `terraform output` after apply |
| `EC2_USER` | `ec2-user` | Fixed for Amazon Linux 2 |
| `EC2_SSH_KEY` | Contents of `.pem` file | AWS EC2 Key Pairs console |

---

### 🔑 Service 2: Docker Hub — Image Registry

**URL:** https://hub.docker.com/signup

**Steps:**
1. Create account
2. Create 2 repositories:  `YOUR_USERNAME/resume-backend`  and  `YOUR_USERNAME/resume-frontend`
3. Generate Access Token:  **Account Settings → Security → New Access Token**  → Name: `github-ci`  → Read & Write
4. Paste token as `DOCKERHUB_TOKEN` in GitHub Secrets

```bash
# Login locally
docker login -u YOUR_USERNAME
# Enter Access Token as password (NOT your Docker Hub account password)

# Tag and push
docker tag resume-backend YOUR_USERNAME/resume-backend:latest
docker push YOUR_USERNAME/resume-backend:latest
```

---

### 🔑 Service 3: Google AI Studio — Gemini API Key

**URL:** https://aistudio.google.com/apikey *(Uses your Gmail account)*

**Steps:**
1. Go to the URL above → Sign in with Gmail
2. Click **"Create API Key"**
3. Select or create a Google Cloud project
4. Copy the key (starts with `AIza...`)

```bash
# Add to backend/.env:
GEMINI_API_KEY=AIzaSy_your_key_here
```

> **Free limits:** 15 requests/min, 1 million tokens/day — perfect for development and demos

---

### 🔑 Service 4: Gmail App Password — SMTP Email

**URL:** https://myaccount.google.com/apppasswords

**Steps:**
1. Go to Google Account → Security
2. **Turn on 2-Step Verification** first (required)
3. Search for "App Passwords" → Click it
4. Select App: **Mail** → Device: **Other** → Name: `Resume Screener`
5. Click **Generate** → Copy the **16 characters** exactly

```bash
# Add to backend/.env:
SMTP_USER=youremail@gmail.com
SMTP_PASS=abcd efgh ijkl mnop   # The 16-char code (spaces are fine)
```

---

### 🔑 Service 5: AWS — Cloud Infrastructure

**URL:** https://aws.amazon.com/free *(Credit card required, but free tier)*

**Steps:**
1. Create account at aws.amazon.com
2. Go to **IAM** → Users → Create user → `resume-terraform-user`
3. Attach policy: `AmazonEC2FullAccess`
4. Create Access Key → Download CSV
5. Install AWS CLI: https://aws.amazon.com/cli/
6. Configure:

```bash
aws configure
# AWS Access Key ID:     AKIA...
# AWS Secret Access Key: ...
# Default region:        us-east-1
# Output format:         json
```

7. Create EC2 Key Pair (for SSH):
   - AWS Console → EC2 → Key Pairs → **Create key pair**
   - Name: `resume-screener-key`
   - Download `.pem` file → Keep it safe!

```bash
# Now run Terraform
cd terraform/
terraform init
terraform apply    # Creates EC2 in ~2 minutes

terraform output   # Shows all URLs
terraform destroy  # DELETE EVERYTHING when done (saves money!)
```

---

### 🔑 Service 6: Railway — PaaS (Already Deployed!)

**URL:** https://railway.app *(Login with GitHub)*

Your project has `railway.json`, `Procfile`, `nixpacks.toml` — it's **already configured for Railway**.

```bash
# To redeploy:
# 1. Go to railway.app → Login with GitHub
# 2. Open your Resume_Screener project
# 3. It auto-deploys on every git push to main!

# To check environment variables on Railway:
# Project → Variables tab → See MYSQL_PUBLIC_URL, GEMINI_API_KEY etc.
```

---

### 🔑 Service 7: Grafana — Dashboards (Local via Docker)

No signup needed for local use!

```
URL:      http://localhost:3001   (after docker-compose up -d)
Username: admin
Password: resume123
```

**For Grafana Cloud (remote):** https://grafana.com/auth/sign-up
- Free: 10,000 metric series, 50 GB logs/month

---

## 🔷 All Commands — One Page Quick Reference

```bash
# ════════════════════════════════════════════════
# GIT
# ════════════════════════════════════════════════
git init                                 # New repo
git add . && git commit -m "message"     # Save changes
git push origin main                     # Push to GitHub
git pull origin main                     # Get updates
git checkout -b dev                      # New branch
git merge dev                            # Merge branch

# ════════════════════════════════════════════════
# BACKEND (Flask)
# ════════════════════════════════════════════════
pip install -r backend/requirements.txt
cd backend && python app.py              # Dev server :5000
gunicorn app:app --workers 4 --bind 0.0.0.0:5000  # Production
python -m pytest backend/tests/ -v      # Run tests

# ════════════════════════════════════════════════
# FRONTEND (React/Vite)
# ════════════════════════════════════════════════
cd client
npm install                              # Install deps
npm run dev                              # Dev :5173
npm run build                            # Production build → dist/

# ════════════════════════════════════════════════
# DOCKER
# ════════════════════════════════════════════════
docker build -f docker/Dockerfile.backend  -t resume-backend  .
docker build -f docker/Dockerfile.frontend -t resume-frontend .
docker run -d -p 5000:5000 --name backend resume-backend
docker ps                                # List containers
docker logs -f backend                   # Follow logs
docker stop backend && docker rm backend # Stop and remove

# ════════════════════════════════════════════════
# DOCKER COMPOSE (All 4 Services)
# ════════════════════════════════════════════════
docker-compose up -d --build             # Start everything
docker-compose ps                        # Status
docker-compose logs -f backend           # Follow logs
docker-compose down                      # Stop everything
docker-compose up -d --build backend     # Rebuild one service

# Access:
# Frontend  → http://localhost:3000
# Backend   → http://localhost:5000
# Prometheus→ http://localhost:9090
# Grafana   → http://localhost:3001 (admin/resume123)

# ════════════════════════════════════════════════
# TERRAFORM (AWS Provisioning)
# ════════════════════════════════════════════════
cd terraform/
terraform init                           # Download providers
terraform plan                           # Preview changes
terraform apply                          # CREATE AWS resources
terraform output                         # Show server URLs
terraform destroy                        # DELETE everything

# ════════════════════════════════════════════════
# KUBERNETES
# ════════════════════════════════════════════════
kubectl apply -f kubernetes/             # Deploy all objects
kubectl get pods -n resume-screener      # List pods
kubectl get services -n resume-screener  # External IPs
kubectl logs -f deployment/resume-backend -n resume-screener
kubectl scale deployment resume-backend --replicas=5 -n resume-screener

# ════════════════════════════════════════════════
# MONITORING
# ════════════════════════════════════════════════
curl http://localhost:5000/metrics       # Raw Prometheus metrics
# Open http://localhost:9090             # Prometheus UI
# Open http://localhost:3001             # Grafana (admin/resume123)
```

---

---

## 🛠️ HANDS-ON USAGE GUIDE — 7 Tools, Step by Step

> This section explains exactly **how to install, configure, and run** each tool **on your own laptop** against the AI Resume Screener project.  
> Follow steps in order: **Git → Docker → Docker Compose → GitHub Actions → Terraform → Prometheus/Grafana → Kubernetes**

---

### 🔧 TOOL 1 — Git (Unit I: Version Control)

**Syllabus link:** Unit I — Basics of Git: Lifecycle, commands, remote repositories  
**Download:** https://git-scm.com/downloads (Windows: Git for Windows)

#### How to Install

```bash
# Check if already installed
git --version
# Expected: git version 2.x.x

# Windows: Download from https://git-scm.com/downloads
# Then run installer → Keep all defaults
```

#### How to Use It — Step by Step with Resume Screener

```bash
# ── STEP 1: Set your identity (one time only) ─────────────────
git config --global user.name  "Your Name"
git config --global user.email "youremail@gmail.com"

# ── STEP 2: Check the current state of the project ────────────
cd C:\Users\Mukund\PycharmProjects\Resume_Screener
git status
# Output:
#   On branch main
#   Changes not staged for commit:
#     modified: backend/app.py
#   Untracked files:
#     docker/

# ── STEP 3: Stage your new DevOps files ───────────────────────
git add docker/
git add .github/
git add terraform/
git add kubernetes/
git add monitoring/
git add docker-compose.yml
git add cloud_devops_review.md

# ── STEP 4: Commit with a meaningful message ──────────────────
git commit -m "feat: add complete DevOps infrastructure (Docker, K8s, Terraform, CI/CD, Monitoring)"

# ── STEP 5: Push to GitHub ────────────────────────────────────
git push origin main

# ── STEP 6: Create a dev branch for experimenting ─────────────
git checkout -b dev/add-prometheus-metrics
# Make changes to backend/app.py (add /metrics endpoint)
git add backend/app.py
git commit -m "feat: add Prometheus /metrics endpoint to Flask"
git push origin dev/add-prometheus-metrics

# ── STEP 7: Merge back when done ──────────────────────────────
git checkout main
git merge dev/add-prometheus-metrics
git push origin main
```

#### What You Will See After `git log --oneline -5`

```
a3f2c01 feat: add complete DevOps infrastructure
b8e1d92 feat: add Gemini ATS scoring
c4f9a31 fix: PDF parsing edge case for scanned resumes
d2e7b12 feat: add React Resume Builder with Vite
e1c8a03 init: initial Flask backend + database setup
```

---

### 🔧 TOOL 2 — Docker (Unit II: Containerization)

**Syllabus link:** Unit II — Containerization using Docker, Docker architecture, lifecycle and Docker Images  
**Download:** https://www.docker.com/products/docker-desktop (Windows: Docker Desktop)

#### How to Install

```bash
# 1. Download Docker Desktop from https://www.docker.com/products/docker-desktop
# 2. Install → Restart computer
# 3. Open Docker Desktop (whale icon in system tray)
# 4. Verify:
docker --version
# Output: Docker version 24.x.x, build xxxx

docker run hello-world
# Output: Hello from Docker! (confirms Docker works)
```

#### How to Use It — Step by Step with Resume Screener

```bash
# Go to project root
cd C:\Users\Mukund\PycharmProjects\Resume_Screener

# ── STEP 1: Build the Backend Image ───────────────────────────
docker build -f docker/Dockerfile.backend -t resume-backend:latest .
# What happens:
#   Step 1/12: FROM python:3.11-slim              ← downloads base image
#   Step 2/12: RUN apt-get install gcc...         ← installs system deps
#   Step 3/12: COPY requirements.txt .            ← copies your file
#   Step 4/12: RUN pip install -r requirements.txt ← installs Flask, scikit-learn etc.
#   ...
#   Successfully built 5a3f2c8d7e1b
#   Successfully tagged resume-backend:latest     ← ✅ Done!

# ── STEP 2: Build the Frontend Image ──────────────────────────
docker build -f docker/Dockerfile.frontend -t resume-frontend:latest .
# What happens:
#   Compiles React app with Vite, then packs it into Nginx image

# ── STEP 3: See Your Images ───────────────────────────────────
docker images
# Output:
#   REPOSITORY        TAG       IMAGE ID       SIZE
#   resume-backend    latest    5a3f2c8d7e1b   487MB
#   resume-frontend   latest    2b6e9f1c4a3d   52MB

# ── STEP 4: Run the Backend Container ─────────────────────────
docker run -d \
  --name resume-backend \
  -p 5000:5000 \
  -e GEMINI_API_KEY=your_actual_key_here \
  -e SMTP_USER=youremail@gmail.com \
  -e SMTP_PASS=your_app_password \
  -e SECRET_KEY=any-secret-string \
  resume-backend:latest

# ── STEP 5: Verify It's Running ───────────────────────────────
docker ps
# Output:
#   CONTAINER ID   IMAGE             STATUS          PORTS
#   a1b2c3d4e5f6   resume-backend    Up 30 seconds   0.0.0.0:5000->5000/tcp

# ── STEP 6: Test the API ───────────────────────────────────────
# Open browser → http://localhost:5000/api/health
# OR in PowerShell:
curl http://localhost:5000/api/health

# ── STEP 7: See Live Logs ─────────────────────────────────────
docker logs -f resume-backend
# Output:
#   [DB] Connected to SQLite
#   [INFO] Gunicorn running on 0.0.0.0:5000
#   [INFO] GET /api/health 200

# ── STEP 8: Stop and Clean Up ─────────────────────────────────
docker stop resume-backend
docker rm resume-backend
```

---

### 🔧 TOOL 3 — Docker Compose (Unit II: Infrastructure Management)

**Syllabus link:** Unit II — Cloud Infrastructure Services: Provisioning and managing various services  
**Included with Docker Desktop** — no separate install needed

#### How to Use It — Step by Step with Resume Screener

```bash
cd C:\Users\Mukund\PycharmProjects\Resume_Screener

# ── STEP 1: Create your .env file from the template ───────────
copy backend\.env.example backend\.env
# Now open backend/.env in VS Code and fill in:
#   GEMINI_API_KEY=your_actual_key
#   SMTP_USER=youremail@gmail.com
#   SMTP_PASS=your_app_password

# ── STEP 2: Start ALL 4 services at once ──────────────────────
docker-compose up -d --build
# What happens (in order):
#   [+] Building 78.3s (12/12) FINISHED  ← Builds backend image
#   [+] Building 45.1s (8/8) FINISHED   ← Builds frontend image
#   [+] Running 4/4
#    ✔ Container resume-backend    Started   ← Flask API
#    ✔ Container resume-frontend   Started   ← React + Nginx
#    ✔ Container resume-prometheus Started   ← Metrics collector
#    ✔ Container resume-grafana    Started   ← Dashboards

# ── STEP 3: Check that all 4 are healthy ──────────────────────
docker-compose ps
# Output:
#   NAME               STATUS          PORTS
#   resume-backend     Up (healthy)    0.0.0.0:5000->5000/tcp
#   resume-frontend    Up              0.0.0.0:3000->80/tcp
#   resume-prometheus  Up              0.0.0.0:9090->9090/tcp
#   resume-grafana     Up              0.0.0.0:3001->3000/tcp

# ── STEP 4: Open the apps ─────────────────────────────────────
# Resume Screener App:  http://localhost:3000
# Raw Flask API:        http://localhost:5000
# Prometheus UI:        http://localhost:9090
# Grafana Dashboards:   http://localhost:3001  (admin / resume123)

# ── STEP 5: Watch Live Logs ───────────────────────────────────
docker-compose logs -f backend
# Press Ctrl+C to stop following

# ── STEP 6: After editing backend code — rebuild only backend──
docker-compose up -d --build backend
# Only rebuilds the backend image, frontend/prometheus/grafana untouched

# ── STEP 7: Stop everything when done ─────────────────────────
docker-compose down
```

#### Architecture Diagram — After `docker-compose up`

```mermaid
graph TD
    YOU["🧑‍💻 You\nbrowser"]

    YOU -->|"http://localhost:3000"| FE
    YOU -->|"http://localhost:9090"| PR
    YOU -->|"http://localhost:3001"| GR

    subgraph "resume-network (Docker internal)"
        FE["resume-frontend\nNginx:80\nServes React app"]
        BE["resume-backend\nFlask+Gunicorn:5000\nAI scoring, auth, API"]
        PR["resume-prometheus\nCollects /metrics every 15s"]
        GR["resume-grafana\nDashboards using PromQL"]
        DB[("resume_screener.db\nSQLite")]
    end

    FE -->|"/api/* → proxy"| BE
    BE --> DB
    BE -->|"HTTPS"| GEMINI["☁️ Google Gemini API"]
    PR -->|"GET /metrics"| BE
    GR -->|"PromQL"| PR

    style BE fill:#92a8d1,stroke:#333
    style FE fill:#80ced6,stroke:#333
    style PR fill:#f39c12,stroke:#333
    style GR fill:#e74c3c,color:#fff,stroke:#333
```

---

### 🔧 TOOL 4 — GitHub Actions (Unit IV: CI/CD Pipeline)

**Syllabus link:** Unit IV — CI/CD Pipeline Fundamentals, Automating Code Builds, Tests, and Deployments  
**No install needed** — runs on GitHub's cloud servers automatically

#### How to Set It Up — Step by Step

```bash
# The pipeline file is already created at:
# .github/workflows/ci-cd.yml

# ── STEP 1: Push your code to GitHub ─────────────────────────
git add .
git commit -m "feat: add CI/CD pipeline + all DevOps files"
git push origin main

# ── STEP 2: Watch the pipeline run ───────────────────────────
# Open browser → https://github.com/YOUR_USERNAME/Resume_Screener
# Click "Actions" tab at the top
# You'll see: "AI Resume Screener CI/CD" running
```

#### GitHub Actions — What Each Job Does in Our Project

```mermaid
graph TD
    PUSH["git push origin main"] --> A

    A["⬇️ Checkout Code\nactions/checkout@v4"] --> B
    A --> E

    B["🐍 Set up Python 3.11\nactions/setup-python@v5"] --> C
    C["📦 pip install -r backend/requirements.txt"] --> D
    D["🧪 pytest backend/tests/ -v\nTests: health, auth, analyze-resume"]

    E["⬇️ Set up Node.js 20\nactions/setup-node@v4"] --> F
    F["📦 npm ci (clean install)"] --> G
    G["⚛️ npm run build\nVite compiles React → dist/"]

    D --> H{Did both pass?}
    G --> H

    H -->|"✅ YES"| I["🐳 docker build backend image\ndocker build frontend image\ndocker push to Docker Hub"]
    H -->|"❌ NO"| FAIL["🔴 PIPELINE FAILS\nEmail sent to developer\nDeployment blocked"]

    I --> J{Branch = main?}
    J -->|"dev/PR"| SKIP["⏸️ Stop. No deploy."]
    J -->|"main ✅"| K["🚀 SSH into EC2\ngit pull\ndocker-compose up -d\nHealth check"]
    K --> LIVE["✅ LIVE\nhttp://EC2-IP:3000"]
```

#### Add Required Secrets to GitHub

```
1. Go to: https://github.com/YOUR_USERNAME/Resume_Screener
2. Click: Settings (top menu)
3. Click: Secrets and variables → Actions
4. Click: New repository secret

Add these one by one:
┌─────────────────────┬──────────────────────────────────────────┐
│ Secret Name         │ Value                                    │
├─────────────────────┼──────────────────────────────────────────┤
│ DOCKERHUB_USERNAME  │ your docker hub username                 │
│ DOCKERHUB_TOKEN     │ access token from Docker Hub → Security  │
│ GEMINI_API_KEY      │ AIzaSy... from aistudio.google.com       │
│ EC2_HOST            │ 54.123.45.67 (after terraform apply)     │
│ EC2_USER            │ ec2-user                                 │
│ EC2_SSH_KEY         │ contents of resume-screener-key.pem      │
└─────────────────────┴──────────────────────────────────────────┘
```

#### What You Will See in GitHub Actions Tab

```
✅ AI Resume Screener CI/CD                    main  2 minutes ago
   ├── 🧪 Backend Tests              ✅  45s
   ├── ⚛️  Frontend Build             ✅  38s
   ├── 🐳 Docker Build & Push        ✅  2m 12s
   └── 🚀 Deploy to Production       ✅  30s
```

---

### 🔧 TOOL 5 — Terraform (Unit III: Infrastructure as Code)

**Syllabus link:** Unit III — IaC Principles, templates, and tools like Terraform and CloudFormation  
**Download:** https://developer.hashicorp.com/terraform/install

#### How to Install

```bash
# Windows — using chocolatey (recommended)
choco install terraform

# OR download manually from:
# https://developer.hashicorp.com/terraform/install
# Extract terraform.exe → add to PATH

# Verify:
terraform --version
# Output: Terraform v1.x.x
```

#### Prerequisites Before Using Terraform

```bash
# 1. Install AWS CLI
# Download: https://aws.amazon.com/cli/
aws --version
# Output: aws-cli/2.x.x

# 2. Create AWS IAM user (in AWS Console):
#    IAM → Users → Create user → "terraform-user"
#    Attach: AmazonEC2FullAccess
#    Create Access Key → Download CSV

# 3. Configure AWS credentials
aws configure
# Prompts:
# AWS Access Key ID [None]: AKIAIOSFODNN7EXAMPLE
# AWS Secret Access Key [None]: wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
# Default region name [None]: us-east-1
# Default output format [None]: json

# 4. Create EC2 Key Pair (for SSH into server)
# AWS Console → EC2 → Key Pairs → Create key pair
# Name: resume-screener-key
# Type: RSA, Format: .pem
# DOWNLOAD and SAVE the .pem file safely!
```

#### How to Use It — Step by Step with Resume Screener

```bash
cd C:\Users\Mukund\PycharmProjects\Resume_Screener\terraform

# ── STEP 1: Initialize Terraform ──────────────────────────────
terraform init
# Output:
#   Initializing provider plugins...
#   - Finding hashicorp/aws versions matching "~> 5.0"...
#   - Installing hashicorp/aws v5.31.0...
#   ✅ Terraform has been successfully initialized!

# ── STEP 2: Preview What Will Be Created ──────────────────────
terraform plan
# Output:
#   Plan: 2 to add, 0 to change, 0 to destroy.
#
#   + aws_security_group.resume_sg        ← Firewall rules
#   + aws_instance.resume_server           ← EC2 virtual machine
#
#   Changes to Outputs:
#     + backend_url    = (known after apply)
#     + frontend_url   = (known after apply)
#     + grafana_url    = (known after apply)
#     + ssh_command    = (known after apply)

# ── STEP 3: Create the AWS Infrastructure ─────────────────────
terraform apply
# Shows the plan again, then asks:
#   Do you want to perform these actions? Type 'yes': yes
#
# Output (takes ~2 minutes):
#   aws_security_group.resume_sg: Creating...     ✅ Created!
#   aws_instance.resume_server: Creating...       ✅ Created!
#
# Apply complete! Resources: 2 added.
#
# Outputs:
#   backend_url    = "http://54.123.45.67:5000"
#   frontend_url   = "http://54.123.45.67:3000"
#   grafana_url    = "http://54.123.45.67:3001"
#   ssh_command    = "ssh -i resume-screener-key.pem ec2-user@54.123.45.67"

# ── STEP 4: SSH Into Your New Server ──────────────────────────
ssh -i C:\path\to\resume-screener-key.pem ec2-user@54.123.45.67
# You are now INSIDE the cloud server!
# The startup script already ran docker-compose up -d --build

# ── STEP 5: Check That Everything Is Running ──────────────────
docker-compose ps
# All 4 services: Up (healthy)

# ── STEP 6: DESTROY When Done (IMPORTANT — stops AWS billing) ─
terraform destroy
# Type 'yes' to confirm
# Output: Destroy complete! Resources: 2 destroyed.
```

---

### 🔧 TOOL 6 — Prometheus + Grafana (Unit V: Monitoring & Observability)

**Syllabus link:** Unit V — Monitoring and Observability: Collecting logs, visualizing metrics and dashboards  
**No install** — runs as Docker containers via `docker-compose up`

#### How to Use It — Step by Step with Resume Screener

```bash
# ── STEP 1: Start monitoring with Docker Compose ──────────────
cd C:\Users\Mukund\PycharmProjects\Resume_Screener
docker-compose up -d prometheus grafana backend

# ── STEP 2: Verify Prometheus is Scraping the Backend ─────────
# Open browser → http://localhost:9090
# Click "Status" → "Targets"
# You should see:
#   ┌────────────────────────────────────────┬────────┐
#   │ Endpoint                               │ State  │
#   ├────────────────────────────────────────┼────────┤
#   │ http://backend:5000/metrics            │ UP ✅  │
#   └────────────────────────────────────────┴────────┘

# ── STEP 3: View Raw Metrics From Flask ───────────────────────
curl http://localhost:5000/metrics
# Output (Prometheus text format):
#   # HELP resumes_analyzed_total Total resumes analyzed
#   # TYPE resumes_analyzed_total counter
#   resumes_analyzed_total 0
#   # HELP http_requests_total Total HTTP requests
#   # TYPE http_requests_total counter
#   http_requests_total 12

# ── STEP 4: Open Grafana and Create a Dashboard ───────────────
# Open browser → http://localhost:3001
# Username: admin
# Password: resume123

# ── STEP 5: Create Your First Dashboard Panel ─────────────────
# 1. Left sidebar → Dashboards → + New → New Dashboard
# 2. Click "Add visualization"
# 3. Data source: Prometheus (already connected — auto-provisioned!)
# 4. In "Metrics browser" field type: http_requests_total
# 5. Press Shift+Enter to run
# 6. You see a graph of all HTTP requests to your Flask app!
# 7. Panel Title: "Total HTTP Requests"
# 8. Click "Apply" → "Save dashboard" → Name: "Resume Screener"

# ── STEP 6: Add More Panels ───────────────────────────────────
# Panel 2: resumes_analyzed_total        → Stat chart → "Resumes Screened"
# Panel 3: ats_score_avg                 → Gauge chart → "Avg ATS Score"
# Panel 4: rate(http_requests_total[5m]) → Time series → "Request Rate"
```

#### Prometheus Query Language (PromQL) — Cheat Sheet

| Query | Meaning | Use In Grafana |
| :--- | :--- | :--- |
| `http_requests_total` | Total requests ever | Stat panel |
| `rate(http_requests_total[5m])` | Requests per second (5min avg) | Time series |
| `ats_score_avg` | Current average ATS score | Gauge (0-100) |
| `resumes_analyzed_total` | Resumes screened today | Stat panel |
| `gemini_errors_total / gemini_calls_total` | Gemini error ratio | Alert panel |

---

### 🔧 TOOL 7 — Kubernetes (Unit II: Container Orchestration)

**Syllabus link:** Unit II — Container Orchestration using Kubernetes  
**Download:** https://minikube.sigs.k8s.io/docs/start/ (for local testing)

#### How to Install (Local Testing with Minikube)

```bash
# Install Minikube (Windows)
# Download: https://minikube.sigs.k8s.io/docs/start/
# OR with Chocolatey:
choco install minikube

# Install kubectl (Kubernetes CLI)
choco install kubernetes-cli

# Verify
minikube version
kubectl version --client
```

#### How to Use It — Step by Step with Resume Screener

```bash
# ── STEP 1: Start Local Kubernetes Cluster ────────────────────
minikube start --driver=docker --memory=4096
# Output:
#   😄 minikube v1.32.0 on Windows
#   ✅ Using Docker driver
#   🔥 Creating container... (takes 1-2 min)
#   🏄 Done! kubectl is now configured to use "minikube"

# ── STEP 2: Check the Cluster Is Running ──────────────────────
kubectl cluster-info
# Output:
#   Kubernetes control plane running at https://127.0.0.1:54321
#   CoreDNS running at https://127.0.0.1:54321/api/v1/...

kubectl get nodes
# Output:
#   NAME       STATUS   ROLES           AGE   VERSION
#   minikube   Ready    control-plane   2m    v1.28.x

# ── STEP 3: First, Update Image Names in Deployment ───────────
# Open kubernetes/deployment.yaml
# Replace "YOUR_DOCKERHUB_USERNAME" with your actual Docker Hub username

# ── STEP 4: Apply All Kubernetes Configs ──────────────────────
kubectl apply -f kubernetes/
# Output:
#   namespace/resume-screener created
#   secret/resume-secrets created
#   deployment.apps/resume-backend created
#   service/resume-backend-svc created
#   deployment.apps/resume-frontend created
#   service/resume-frontend-svc created
#   horizontalpodautoscaler.autoscaling/resume-backend-hpa created

# ── STEP 5: Watch Pods Starting ───────────────────────────────
kubectl get pods -n resume-screener -w
# Output (watch live):
#   NAME                               READY   STATUS              RESTARTS
#   resume-backend-7f8b9c4d6-xk2pq    0/1     ContainerCreating   0
#   resume-backend-7f8b9c4d6-xk2pq    0/1     Running             0
#   resume-backend-7f8b9c4d6-xk2pq    1/1     Running             0   ← ✅ Ready!
#   resume-backend-7f8b9c4d6-m3abc    1/1     Running             0   ← ✅ Pod 2!
#   resume-backend-7f8b9c4d6-p9xyz    1/1     Running             0   ← ✅ Pod 3!

# ── STEP 6: Open in Browser ───────────────────────────────────
minikube service resume-frontend-svc -n resume-screener
# Minikube opens the app automatically in your browser!

# ── STEP 7: Watch Auto-Scaling in Action ──────────────────────
kubectl get hpa -n resume-screener -w
# Output:
#   NAME                  TARGETS   MINPODS  MAXPODS  REPLICAS
#   resume-backend-hpa    5%/70%    2        10       3       ← Normal load
#   resume-backend-hpa    78%/70%   2        10       4       ← High load! Added pod
#   resume-backend-hpa    45%/70%   2        10       4       ← Load decreasing
#   resume-backend-hpa    18%/70%   2        10       2       ← Scaled back down

# ── STEP 8: View Logs From All Pods ───────────────────────────
kubectl logs -f deployment/resume-backend -n resume-screener
# Shows Flask logs from all running pods

# ── STEP 9: Clean Up ──────────────────────────────────────────
kubectl delete -f kubernetes/           # Remove all K8s objects
minikube stop                           # Stop the local cluster
minikube delete                         # Delete the cluster entirely
```

---

### 📊 Tool Comparison Summary

| Tool | Unit | Installed Via | Key Command | What It Does for Resume Screener |
| :--- | :--- | :--- | :--- | :--- |
| **Git** | I | https://git-scm.com | `git push origin main` | Tracks all code changes, triggers CI/CD |
| **Docker** | II | Docker Desktop | `docker build` + `docker run` | Packages Flask+React into containers |
| **Docker Compose** | II | Included with Docker | `docker-compose up -d --build` | Runs all 4 services together |
| **GitHub Actions** | IV | Built into GitHub | Push code → runs automatically | Auto-tests and deploys every commit |
| **Terraform** | III | terraform.io/install | `terraform apply` | Creates AWS EC2 server in 2 minutes |
| **Prometheus** | V | Docker Hub image | `curl localhost:9090` | Collects Flask API metrics every 15s |
| **Grafana** | V | Docker Hub image | Open `localhost:3001` | Visualizes metrics in dashboards |
| **Kubernetes** | II | minikube.sigs.k8s.io | `kubectl apply -f kubernetes/` | Auto-scales Flask pods under load |

---

## 🔷 Course Outcome Mapping

| CO | Syllabus Requirement | How Resume Screener Implements It |
| :--- | :--- | :--- |
| **CO1** | Cloud fundamentals, delivery models, DevOps basics | IaaS (EC2 via Terraform) + PaaS (Railway — already live!) + SaaS (Gemini API). Git used from day one. Full DevOps lifecycle documented. |
| **CO2** | Virtualization, containerization, cloud infrastructure | Docker multi-stage builds for Flask + React. Docker Compose with 4 services. Nginx reverse proxy with security headers. VM vs Container comparison documented. |
| **CO3** | IaC tools like Terraform and CloudFormation | `terraform/main.tf` provisions EC2 instance + security group + startup script. One `terraform apply` = working server with all services running. |
| **CO4** | CI/CD pipelines, Jenkins, automating builds | `.github/workflows/ci-cd.yml` — 4 jobs running in correct order. Pytest + React build + Docker build + deploy to EC2, all automated on push to `main`. |
| **CO5** | Monitoring, Prometheus, Grafana, Cloud Security | `monitoring/` folder with Prometheus + Grafana config. `/metrics` endpoint on Flask. IAM least-privilege. `.env` secrets management. OTP expiry. DevSecOps in pipeline. |
