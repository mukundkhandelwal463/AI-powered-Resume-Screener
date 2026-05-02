# 🔐 Service Login & Account Setup Guide
## AI Resume Screener — Where to Sign Up for Every Tool

---

## ✅ Quick Reference Table

| Service | URL to Sign Up | What You Get | Cost |
| :--- | :--- | :--- | :--- |
| **GitHub** | https://github.com/signup | Code repo + CI/CD Actions | Free |
| **Docker Hub** | https://hub.docker.com/signup | Docker image registry | Free (1 private repo) |
| **Google AI Studio** | https://aistudio.google.com/apikey | Gemini API Key | Free tier |
| **AWS** | https://aws.amazon.com/free | EC2, RDS, IAM, S3 | Free tier 12 months |
| **Terraform Cloud** | https://app.terraform.io/signup | State file management | Free |
| **Railway** | https://railway.app | PaaS deployment + MySQL | $5/month credit |
| **Render** | https://render.com | PaaS deployment | Free tier |
| **Grafana Cloud** | https://grafana.com/auth/sign-up | Hosted dashboards | Free |

---

## 🔷 1. GitHub — Code & CI/CD

**Sign Up:** https://github.com/signup

### Steps:
1. Create account at github.com
2. Create a new **repository**: `Resume_Screener`
3. Push your code:
   ```bash
   git remote add origin https://github.com/YOUR_USERNAME/Resume_Screener.git
   git push -u origin main
   ```
4. For CI/CD to work, add **Secrets** in your repo:
   - Go to: `GitHub Repo → Settings → Secrets and variables → Actions`
   - Click **New repository secret** and add:

| Secret Name | Value | Where to Get |
| :--- | :--- | :--- |
| `DOCKERHUB_USERNAME` | Your Docker Hub username | Docker Hub account |
| `DOCKERHUB_TOKEN` | Docker Hub access token | Docker Hub → Account Settings → Security |
| `GEMINI_API_KEY` | Your Gemini API key | https://aistudio.google.com/apikey |
| `EC2_HOST` | Your EC2 public IP | AWS Console after terraform apply |
| `EC2_USER` | `ec2-user` | Fixed for Amazon Linux |
| `EC2_SSH_KEY` | Contents of your .pem file | AWS EC2 Key Pair |

---

## 🔷 2. Docker Hub — Image Registry

**Sign Up:** https://hub.docker.com/signup

### Steps:
1. Create free account at hub.docker.com
2. Create two **repositories** (public):
   - `YOUR_USERNAME/resume-backend`
   - `YOUR_USERNAME/resume-frontend`
3. Create an **Access Token**:
   - Docker Hub → Account Settings → Security → New Access Token
   - Name: `github-actions`
   - Permission: `Read & Write`
   - Copy the token → paste as `DOCKERHUB_TOKEN` in GitHub Secrets
4. Login locally:
   ```bash
   docker login -u YOUR_USERNAME
   # Enter your Access Token as password
   ```

---

## 🔷 3. Google AI Studio — Gemini API Key

**Sign Up:** https://aistudio.google.com/apikey  
*(Uses your existing Google / Gmail account)*

### Steps:
1. Go to https://aistudio.google.com/apikey
2. Sign in with your Google account
3. Click **"Create API Key"**
4. Select project (or create new one)
5. Copy the key (starts with `AIza...`)
6. Paste into `backend/.env`:
   ```
   GEMINI_API_KEY=AIzaSy...your_key_here
   ```

> **Free limits:** 15 requests/min, 1 million tokens/day — more than enough for development

---

## 🔷 4. AWS — Cloud Infrastructure (EC2 for Terraform)

**Sign Up:** https://aws.amazon.com/free  
*(Requires credit card — but free tier for 12 months)*

### Steps:
1. Create account at aws.amazon.com
2. Go to **IAM** → Create a new user with **programmatic access**:
   - Attach policy: `AmazonEC2FullAccess`
3. Download the **Access Key ID** and **Secret Access Key**
4. Install AWS CLI and configure:
   ```bash
   aws configure
   # AWS Access Key ID: AKIA...
   # AWS Secret Access Key: ...
   # Default region: us-east-1
   # Output format: json
   ```
5. Create an **EC2 Key Pair** for SSH:
   - AWS Console → EC2 → Key Pairs → Create key pair
   - Name: `resume-screener-key`
   - Download the `.pem` file
6. Now run Terraform:
   ```bash
   cd terraform/
   terraform init
   terraform plan
   terraform apply
   ```

> **Free tier:** t2.micro is free for 12 months. We use t2.medium (small cost ~$0.05/hr). Run `terraform destroy` when not using.

---

## 🔷 5. Gmail App Password — SMTP Email

*(For OTP email verification in the app)*

### Steps:
1. Go to your Google Account: https://myaccount.google.com
2. Security → **2-Step Verification** → Turn ON (required)
3. Security → **App Passwords**
4. Select app: **Mail** → Select device: **Other** → Name: `Resume Screener`
5. Click Generate → Copy the **16-character password**
6. Add to `backend/.env`:
   ```
   SMTP_USER=youremail@gmail.com
   SMTP_PASS=xxxx xxxx xxxx xxxx   ← the 16-char code
   ```

---

## 🔷 6. Railway — PaaS Deployment (Already Deployed!)

**Sign Up:** https://railway.app  
*(Your project is ALREADY on Railway — check railway.json in the repo)*

### Current Setup:
- You have `railway.json`, `Procfile`, `nixpacks.toml` in your project
- Your Flask app is already deployed at Railway's domain
- MySQL database is provisioned by Railway

### To Check Your Railway Deployment:
1. Go to https://railway.app → Login with GitHub
2. Open your `Resume_Screener` project
3. Environment Variables tab → See your secrets
4. Copy `MYSQL_PUBLIC_URL` from Railway → Paste into `backend/.env`

---

## 🔷 7. Grafana — Dashboards (Local via Docker)

**Access after running `docker-compose up -d`:**

```
URL:      http://localhost:3001
Username: admin
Password: resume123
```

### Create Your First Dashboard:
1. Open http://localhost:3001
2. Login with `admin` / `resume123`
3. Left sidebar → **Dashboards** → **New Dashboard**
4. **Add Visualization**
5. Data source: **Prometheus** (already connected!)
6. Query: `resumes_analyzed_total`
7. Panel title: "Total Resumes Screened"
8. Save Dashboard

### For Hosted Grafana Cloud (optional):
- Sign up at: https://grafana.com/auth/sign-up
- Free tier: 10,000 metrics series, 50GB logs

---

## 🔷 8. Terraform Cloud — State Management (Optional)

**Sign Up:** https://app.terraform.io/signup

*(Only needed if working in a team — stores terraform.tfstate remotely so teammates can collaborate)*

### Steps:
1. Sign up at app.terraform.io
2. Create an **Organization** → Create **Workspace**
3. Add your AWS credentials as Environment Variables in the workspace
4. Run `terraform login` locally
5. Runs automatically via CLI or GitHub Actions

---

## 🖥️ Quick Start — Run Everything Locally

```bash
# 1. Clone the project
git clone https://github.com/YOUR_USERNAME/Resume_Screener.git
cd Resume_Screener

# 2. Fill in your secrets
cp backend/.env.example backend/.env
# Edit backend/.env with your actual API keys

# 3. Start ALL services with Docker Compose
docker-compose up -d --build

# 4. Open the app
#    Frontend:   http://localhost:3000
#    Backend:    http://localhost:5000
#    Prometheus: http://localhost:9090
#    Grafana:    http://localhost:3001  (admin / resume123)

# 5. View logs
docker-compose logs -f backend

# 6. Stop everything
docker-compose down
```

---

## 🔑 Summary — Credentials Needed

| When | What You Need | Where |
|:---|:---|:---|
| **Local dev** | `GEMINI_API_KEY` + Gmail App Password | AI Studio + Google Account |
| **Docker Hub push** | Docker Hub account + Access Token | hub.docker.com |
| **GitHub CI/CD** | All secrets in GitHub repo settings | github.com → repo → Settings |
| **AWS / Terraform** | AWS IAM keys + EC2 Key Pair | aws.amazon.com |
| **Grafana dashboards** | Just Docker running | http://localhost:3001 |
