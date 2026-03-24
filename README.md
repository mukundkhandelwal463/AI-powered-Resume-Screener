# Resume Screener

AI-powered resume analysis and candidate screening project with a Flask backend and a static HTML/CSS/JS frontend.

## Features

- Resume parsing from `PDF`, `DOCX`, and `TXT`
- Resume category prediction (SVM classifier trained from dataset when available)
- ATS score calculation against a job description (TF-IDF + cosine similarity)
- Skill extraction and missing keyword detection
- Job recommendations based on skill overlap
- Recruiter workflow to rank multiple resumes against one job description
- Chatbot-style resume builder flow

## Tech Stack

- Backend: Python, Flask, Flask-CORS
- ML/NLP: scikit-learn, pandas, numpy
- File parsing: pdfplumber, PyPDF2, python-docx
- Frontend: HTML, CSS, JavaScript (vanilla)

## Project Structure

```text
Resume_Screener/
|- backend/
|  |- app.py
|  |- model1.py
|  |- requirements.txt
|  |- UpdatedResumeDataSet.csv
|- forntend/            # folder name in repo is "forntend"
|  |- html/
|  |- css/
|  |- js/
```

## API Endpoints

- `GET /api/health` - health check
- `POST /api/analyze-resume` - analyze one resume (+ optional job description)
- `POST /api/recommend-jobs` - recommend jobs from resume text/file
- `POST /api/rank-candidates` - rank multiple resumes for one job description
- `GET /api/chatbot/questions` - chatbot question set
- `POST /api/chatbot/generate-resume` - generate resume text from answers

## Local Setup

### 1) Clone and enter project

```bash
git clone <your-repo-url>
cd Resume_Screener
```

### 2) Create virtual environment and install backend dependencies

```bash
python -m venv .venv
.venv\Scripts\activate
pip install -r backend/requirements.txt
```

### 3) Run backend server

```bash
python backend/app.py
```

Backend runs at: `http://127.0.0.1:5000`

### 4) Run frontend

Serve the `forntend` directory using a static server:

```bash
cd forntend
python -m http.server 5500
```

Then open:

- `http://127.0.0.1:5500/html/home.html`

The frontend auto-targets backend API at `http://127.0.0.1:5000/api` by default.

## Hosting (Render)

This repo includes `render.yaml` for one-click deployment.

1. Push this repo to GitHub.
2. In Render: `New +` -> `Blueprint`.
3. Select this GitHub repo.
4. Add environment variable `GEMINI_API_KEY`.
5. Deploy.

Render will run:

- Build: `pip install -r backend/requirements.txt`
- Start: `cd backend && gunicorn app:app`

## Usage

### Candidate flow

1. Open `upload.html`.
2. Upload resume (`.pdf`, `.docx`, or `.txt`).
3. Optionally paste a job description.
4. Submit to get ATS score, category, skill gap, and recommendations.

### Recruiter flow

1. In `upload.html`, use recruiter section.
2. Paste job description.
3. Upload multiple resumes.
4. Submit to get ranked candidates by ATS score.

### Chatbot resume builder

1. Open `chatbot.html`.
2. Answer prompted questions.
3. Generate resume text and related job suggestions.

## Notes

- Ensure `backend/UpdatedResumeDataSet.csv` exists for category classification training.
- If dataset loading fails, category defaults to `General`.
- CORS is enabled in backend for local frontend integration.

## Future Improvements

- Add authentication and persistent database storage
- Export generated resumes to PDF/DOCX from UI
- Add model evaluation metrics and test coverage
- Containerize with Docker

## License

This project is currently unlicensed. Add a `LICENSE` file before public distribution.
