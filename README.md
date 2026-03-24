# AI-Powered Resume Screener

An end-to-end AI career platform that helps:
- Candidates analyze resume quality, improve ATS match, and get role recommendations.
- Recruiters rank multiple resumes against one job description.

It combines classic ML/NLP scoring with Gemini-powered intelligence to deliver practical, real-world resume guidance.

---

## What This Project Does

This project takes resume input (`PDF`, `DOCX`, `TXT`) and turns it into actionable career output.

Core engine flow:
1. Parse resume text.
2. Clean and normalize resume content.
3. Detect skills and role signals.
4. Compute ATS compatibility against job description.
5. Predict/resolve category using dataset + user input + Gemini fallback.
6. Generate missing keyword and suggestion insights.
7. Recommend relevant live jobs.

It also includes:
- Interactive chatbot-based resume builder.
- Form-based resume builder.
- Blank template export to DOCX/PDF.
- Recruiter mode for bulk candidate ranking.

---

## Why This Is Useful

Most people know their resume is weak, but do not know exactly what to fix. This project solves that by converting resume text into concrete decisions.

Why it matters:
- Reduces guesswork before applying.
- Improves ATS visibility through keyword and skills alignment.
- Gives direct next-step routing:
  - Good score -> apply to jobs.
  - Low score -> improve resume first.
- Helps recruiters quickly shortlist strong candidates using objective scoring.

In short: it saves time, improves quality, and increases decision confidence for both job seekers and hiring teams.

---

## Features

### 1) ATS Resume Analyzer
- Upload resume.
- Add optional target JD.
- Add optional `Category / Stream`.
- Returns:
  - ATS score
  - Category
  - Detected skills
  - Missing keywords
  - Unified improvement suggestions

### 2) Smart Category Logic (Dataset + Gemini Routing)
- If user provides category and it exists in dataset -> dataset-driven flow.
- If category is not present -> Gemini-only fallback analysis.
- If user gives category + JD -> uses user category, JD-focused ATS logic.

### 3) Resume Builder (Model 3 Flow)
- Chatbot Q&A resume generation.
- Form-based resume generation.
- Multiple template options.
- Export to `DOCX` and `PDF`.

### 4) Job Recommendation Engine
- Skill overlap scoring.
- Missing-skill awareness.
- Live-job integration flow.
- Personalized role mapping.

### 5) Recruiter Mode
- Upload multiple resumes.
- Compare against one JD.
- Get ranked candidate list with ATS scoring.

### 6) Unified Suggestion UX
- No split suggestion cards.
- All AI + rule-based advice shown together in one clean suggestion list.

---

## Tech Stack

### Backend
- `Python`
- `Flask`
- `Flask-CORS`
- `Gunicorn` (production server)

### AI / NLP / ML
- `scikit-learn` (TF-IDF, cosine similarity, classification)
- `pandas`, `numpy`
- `google-generativeai` (Gemini integration)

### Resume Parsing
- `pdfplumber`
- `PyPDF2`
- `python-docx`

### Frontend
- `HTML5`
- `CSS3`
- `Vanilla JavaScript`

### Deployment
- `Render` (backend)
- `Vercel` (frontend)

---

## Usage

### Candidate Workflow (Main User Flow)
1. Open ATS page.
2. Upload resume (`PDF` / `DOCX` / `TXT`).
3. Add optional `Category / Stream`.
4. Paste target JD (recommended).
5. Click Analyze.
6. Review:
   - ATS score
   - Category
   - Missing keywords
   - Suggestions
7. Take next action:
   - Good score -> move to Live Jobs.
   - Low score -> use Resume Maker and re-check.

### Resume Builder Workflow
1. Open Resume Maker.
2. Choose Chatbot or Form mode.
3. Fill profile details.
4. Select template.
5. Generate and download `DOCX` / `PDF`.

### Recruiter Workflow
1. Open recruiter section in ATS page.
2. Paste JD.
3. Upload multiple resumes.
4. Run ranking.
5. Review ranked candidates by ATS score.

---

## Step-by-Step Deployment Guide (Frontend on Vercel + Backend on Render)

### A) Deploy Backend on Render
1. Open Render dashboard.
2. Click `New +` -> `Web Service`.
3. Connect GitHub and select repo: `mukundkhandelwal463/AI-powered-Resume-Screener`.
4. Configure:
   - Runtime: `Python`
   - Build Command: `pip install -r backend/requirements.txt`
   - Start Command: `cd backend && gunicorn app:app --bind 0.0.0.0:$PORT --workers 2 --timeout 120`
5. Add Environment Variable:
   - `GEMINI_API_KEY` = your actual Gemini key
6. Deploy service.
7. Verify health:
   - `https://<your-render-url>/api/health`
   - Should return: `{ "status": "ok" }`

### B) Deploy Frontend on Vercel
1. Open Vercel dashboard.
2. Click `Add New` -> `Project`.
3. Import same GitHub repo.
4. Set **Root Directory** to: `forntend`
5. Deploy.

### C) Connect Frontend to Backend
`forntend/vercel.json` rewrites `/api/*` to Render backend.

Update this line if your Render URL is different:
- `https://ai-powered-resume-screener.onrender.com/api/$1`

Then redeploy Vercel.

### D) Final Production Check
1. Open Vercel app URL.
2. Go to ATS page.
3. Upload one resume + JD and run analysis.
4. Confirm:
   - ATS result loads
   - Suggestions are shown
   - Live jobs and resume maker pages work
   - No CORS/API errors in browser console

---

Built for practical resume optimization, faster candidate screening, and better hiring decisions.
