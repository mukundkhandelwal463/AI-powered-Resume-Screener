import io
import os
import re
from dataclasses import dataclass
from typing import Dict, List, Sequence, Tuple

import docx
import numpy as np
import pdfplumber
from PyPDF2 import PdfReader
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from sklearn.pipeline import Pipeline
from sklearn.svm import LinearSVC

try:
    import pandas as pd
except Exception:  # pragma: no cover
    pd = None


COMMON_SKILLS = {
    "python",
    "java",
    "javascript",
    "typescript",
    "sql",
    "mysql",
    "postgresql",
    "mongodb",
    "flask",
    "django",
    "fastapi",
    "react",
    "node",
    "html",
    "css",
    "scikit-learn",
    "pandas",
    "numpy",
    "nlp",
    "spacy",
    "machine learning",
    "deep learning",
    "tensorflow",
    "pytorch",
    "docker",
    "kubernetes",
    "aws",
    "azure",
    "git",
    "linux",
    "excel",
    "power bi",
}


DEFAULT_JOB_CATALOG = [
    {
        "id": "job-001",
        "title": "Python Backend Developer",
        "company": "TechNova",
        "skills": ["python", "flask", "sql", "docker", "git"],
    },
    {
        "id": "job-002",
        "title": "Data Analyst",
        "company": "InsightLoop",
        "skills": ["python", "sql", "pandas", "excel", "power bi"],
    },
    {
        "id": "job-003",
        "title": "NLP Engineer",
        "company": "LexiAI",
        "skills": ["python", "nlp", "spacy", "scikit-learn", "pytorch"],
    },
    {
        "id": "job-004",
        "title": "Frontend Developer",
        "company": "PixelCraft",
        "skills": ["javascript", "typescript", "react", "html", "css"],
    },
    {
        "id": "job-005",
        "title": "Full Stack Developer",
        "company": "BuildSphere",
        "skills": ["python", "javascript", "react", "sql", "docker"],
    },
]


def clean_text(text: str) -> str:
    text = text or ""
    text = re.sub(r"http\S+|www\.\S+", " ", text)
    text = re.sub(r"RT|cc", " ", text)
    text = re.sub(r"@\w+|#\w+", " ", text)
    text = re.sub(r"[^A-Za-z0-9\s\-\+\.]", " ", text)
    text = re.sub(r"\s+", " ", text)
    return text.strip().lower()


def strip_resume_noise(text: str) -> str:
    """Remove personal/irrelevant data from resume before ATS comparison.
    Strips: emails, phone numbers, LinkedIn/GitHub URLs, names (first line),
    10th/12th school education blocks, addresses, dates of birth, etc.
    """
    text = text or ""
    # Remove emails
    text = re.sub(r"[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}", " ", text)
    # Remove phone numbers (various formats)
    text = re.sub(r"(\+?\d{1,3}[\s\-]?)?(\(?\d{3,5}\)?[\s\-]?)?\d{3,5}[\s\-]?\d{3,5}", " ", text)
    # Remove URLs (LinkedIn, GitHub, portfolio, etc.)
    text = re.sub(r"https?://\S+|www\.\S+", " ", text)
    text = re.sub(r"linkedin\.com/\S+|github\.com/\S+|gitlab\.com/\S+", " ", text, flags=re.IGNORECASE)
    # Remove 10th / 12th / SSC / HSC / CBSE / ICSE / High School / Secondary education blocks
    text = re.sub(
        r"(10th|12th|tenth|twelfth|ssc|hsc|cbse|icse|isc|secondary|higher secondary|high school|intermediate|class\s*(x|xii|10|12))\b[^.\n]{0,120}[.\n]?",
        " ", text, flags=re.IGNORECASE
    )
    # Remove common personal labels
    text = re.sub(
        r"\b(date of birth|dob|d\.o\.b|gender|marital status|nationality|passport|father.?s name|mother.?s name|permanent address|present address)\b[^.\n]{0,80}[.\n]?",
        " ", text, flags=re.IGNORECASE
    )
    # Remove the very first line (usually the candidate's name)
    lines = text.strip().split("\n")
    if len(lines) > 1:
        first_line_words = lines[0].strip().split()
        if len(first_line_words) <= 4:  # likely a name
            text = "\n".join(lines[1:])
    # Final cleanup
    text = re.sub(r"\s+", " ", text)
    return text.strip()


def tokenize_words(text: str) -> List[str]:
    return re.findall(r"[a-zA-Z][a-zA-Z0-9\-\+\.]+", text.lower())


def extract_text_from_pdf(file_bytes: bytes) -> str:
    text_parts: List[str] = []

    # Primary parser
    try:
        with pdfplumber.open(io.BytesIO(file_bytes)) as pdf:
            for page in pdf.pages:
                text_parts.append(page.extract_text() or "")
    except Exception:
        pass

    if any(part.strip() for part in text_parts):
        return "\n".join(text_parts).strip()

    # Fallback parser
    fallback_parts: List[str] = []
    try:
        reader = PdfReader(io.BytesIO(file_bytes))
        for page in reader.pages:
            fallback_parts.append(page.extract_text() or "")
    except Exception:
        pass
    return "\n".join(fallback_parts).strip()


def extract_text_from_docx(file_bytes: bytes) -> str:
    document = docx.Document(io.BytesIO(file_bytes))
    return "\n".join(p.text for p in document.paragraphs if p.text.strip())


def extract_resume_text(filename: str, file_bytes: bytes) -> str:
    ext = os.path.splitext(filename.lower())[1]
    if ext == ".pdf":
        return extract_text_from_pdf(file_bytes)
    if ext == ".docx":
        return extract_text_from_docx(file_bytes)
    if ext == ".txt":
        return file_bytes.decode("utf-8", errors="ignore")
    raise ValueError("Unsupported file format. Use PDF, DOCX, or TXT.")


def extract_skills(text: str, skill_dict: Sequence[str] = tuple(COMMON_SKILLS)) -> List[str]:
    normalized = clean_text(text)
    found = []
    for skill in skill_dict:
        if skill in normalized:
            found.append(skill)
    return sorted(set(found))


def top_keywords_from_text(text: str, top_n: int = 20) -> List[str]:
    words = tokenize_words(clean_text(text))
    stop_words = {
        "and",
        "or",
        "the",
        "to",
        "for",
        "in",
        "of",
        "with",
        "on",
        "a",
        "an",
        "is",
        "are",
        "as",
        "at",
        "by",
        "be",
        "from",
        "that",
        "this",
        "will",
        "have",
        "has",
        "using",
        "you",
        "your",
        "we",
        "our",
    }
    freq: Dict[str, int] = {}
    for w in words:
        if len(w) < 3 or w in stop_words:
            continue
        freq[w] = freq.get(w, 0) + 1
    ranked = sorted(freq.items(), key=lambda item: item[1], reverse=True)
    return [k for k, _ in ranked[:top_n]]


@dataclass
class ResumeAnalysis:
    category: str
    ats_score: float
    resume_skills: List[str]
    missing_keywords: List[str]
    suggestions: List[str]


class ResumeModelService:
    def __init__(self, dataset_path: str):
        self.dataset_path = dataset_path
        self.classifier: Pipeline | None = None
        self.vectorizer = TfidfVectorizer(stop_words="english")
        self.available_categories: set[str] = set()
        self._fit_classifier_if_possible()

    def _fit_classifier_if_possible(self) -> None:
        if pd is None or not os.path.exists(self.dataset_path):
            self.classifier = None
            return

        try:
            df = pd.read_csv(self.dataset_path)
            if {"Resume", "Category"} - set(df.columns):
                self.classifier = None
                return

            df = df.dropna(subset=["Resume", "Category"]).copy()
            self.available_categories = set(df["Category"].astype(str).str.strip().str.lower().tolist())
            df["Resume"] = df["Resume"].astype(str).map(clean_text)
            if df.empty:
                self.classifier = None
                return

            self.classifier = Pipeline(
                [
                    ("tfidf", TfidfVectorizer(stop_words="english", max_features=10000)),
                    ("clf", LinearSVC()),
                ]
            )
            self.classifier.fit(df["Resume"], df["Category"])
        except Exception:
            self.classifier = None
            self.available_categories = set()

    def has_category_in_dataset(self, category: str) -> bool:
        normalized = (category or "").strip().lower()
        if not normalized:
            return False
        return normalized in self.available_categories

    def classify_resume(self, resume_text: str) -> str:
        if not self.classifier:
            return "General"
        try:
            pred = self.classifier.predict([clean_text(resume_text)])
            return str(pred[0])
        except Exception:
            return "General"

    def ats_score(self, resume_text: str, job_description: str) -> float:
        # Strip noise from resume first (personal info, 10th/12th, etc.)
        cleaned_resume = clean_text(strip_resume_noise(resume_text))
        cleaned_jd = clean_text(job_description)
        if not cleaned_resume or not cleaned_jd:
            return 0.0

        # 1. Keyword overlap score (60% weight) - this is what real ATS systems do
        jd_keywords = set(top_keywords_from_text(cleaned_jd, top_n=40))
        resume_keywords = set(top_keywords_from_text(cleaned_resume, top_n=100))
        if jd_keywords:
            overlap = jd_keywords.intersection(resume_keywords)
            keyword_score = (len(overlap) / len(jd_keywords)) * 100
        else:
            keyword_score = 0.0

        # 2. Skill match bonus (10% weight)
        jd_skills = set(extract_skills(cleaned_jd))
        resume_skills_set = set(extract_skills(cleaned_resume))
        if jd_skills:
            skill_score = (len(jd_skills.intersection(resume_skills_set)) / len(jd_skills)) * 100
        else:
            skill_score = keyword_score  # neutral if JD has no recognizable skills

        # 3. TF-IDF cosine similarity (30% weight) - semantic similarity
        vectors = self.vectorizer.fit_transform([cleaned_resume, cleaned_jd])
        cosine_score = cosine_similarity(vectors[0:1], vectors[1:2])[0][0] * 100

        # Weighted combination
        final_score = (keyword_score * 0.60) + (cosine_score * 0.30) + (skill_score * 0.10)
        return round(min(float(final_score), 100.0), 2)

    def analyze_resume(self, resume_text: str, job_description: str = "") -> ResumeAnalysis:
        category = self.classify_resume(resume_text)
        cleaned_resume_for_compare = strip_resume_noise(resume_text)
        resume_skills = extract_skills(resume_text)
        ats = self.ats_score(resume_text, job_description) if job_description.strip() else 0.0

        jd_keywords = set(top_keywords_from_text(job_description, top_n=25)) if job_description else set()
        resume_words = set(top_keywords_from_text(cleaned_resume_for_compare, top_n=100))
        missing_keywords = sorted(list(jd_keywords - resume_words))[:15]

        suggestions: List[str] = []
        if not resume_skills:
            suggestions.append("Add a dedicated Skills section with relevant tools and technologies.")
        if job_description and ats < 60:
            suggestions.append("Improve ATS match by adding role-specific keywords from the job description.")
        if missing_keywords:
            suggestions.append("Include evidence of missing keywords in projects or experience bullets.")
        if "project" not in clean_text(resume_text):
            suggestions.append("Add 2-3 impact-focused projects with metrics and outcomes.")
        if len(clean_text(resume_text).split()) < 250:
            suggestions.append("Expand experience descriptions to show measurable achievements.")

        if not suggestions:
            suggestions.append("Resume looks strong. Tailor summary and skills for each target job.")

        return ResumeAnalysis(
            category=category,
            ats_score=ats,
            resume_skills=resume_skills,
            missing_keywords=missing_keywords,
            suggestions=suggestions,
        )

    def recommend_jobs(self, resume_text: str, top_k: int = 5) -> List[Dict]:
        resume_skills = set(extract_skills(resume_text))
        recommendations: List[Tuple[float, Dict]] = []

        import urllib.request
        import json
        
        jobs_data = []
        try:
            req = urllib.request.Request("https://www.arbeitnow.com/api/job-board-api", headers={'User-Agent': 'Mozilla/5.0'})
            with urllib.request.urlopen(req, timeout=5) as response:
                data = json.loads(response.read().decode())
                jobs_data = data.get("data", [])
        except Exception:
            pass
            
        if not jobs_data:
            jobs_data = DEFAULT_JOB_CATALOG

        for job in jobs_data:
            title = job.get("title", "")
            company = job.get("company_name", job.get("company", ""))
            
            api_tags = job.get("tags", [])
            if not api_tags and "skills" in job:
                api_tags = job.get("skills", [])
                
            desc = job.get("description", "")
            if not api_tags and desc:
                api_tags = extract_skills(title + " " + desc)

            job_skills = set(s.lower() for s in api_tags)
            if not job_skills:
                job_skills = set(title.lower().replace(",", "").split())

            overlap = resume_skills.intersection(job_skills)
            score = (len(overlap) / max(len(job_skills), 1)) * 100
            missing = sorted(list(job_skills - resume_skills))
            
            recommendations.append(
                (
                    round(score, 2),
                    {
                        "id": job.get("slug", job.get("id", "job")),
                        "title": title,
                        "company": company,
                        "score": round(score, 2),
                        "matched_skills": sorted(list(overlap)),
                        "missing_skills": missing[:7],
                        "url": job.get("url", "#"),
                        "location": job.get("location", "Remote")
                    },
                )
            )

        recommendations.sort(key=lambda item: item[0], reverse=True)
        return [item[1] for item in recommendations[:top_k]]

    def rank_candidates(self, resumes: List[Tuple[str, str]], job_description: str) -> List[Dict]:
        ranked = []
        for filename, resume_text in resumes:
            analysis = self.analyze_resume(resume_text, job_description)
            ranked.append(
                {
                    "filename": filename,
                    "category": analysis.category,
                    "ats_score": analysis.ats_score,
                    "skills": analysis.resume_skills,
                }
            )
        ranked.sort(key=lambda r: r["ats_score"], reverse=True)
        return ranked


CHATBOT_QUESTIONS = [
    {"key": "full_name", "question": "What is your full name?"},
    {"key": "email", "question": "What is your email address?"},
    {"key": "phone", "question": "What is your phone number?"},
    {"key": "location", "question": "Where are you located?"},
    {"key": "summary", "question": "Write a short professional summary."},
    {"key": "skills", "question": "List your top skills (comma separated)."},
    {"key": "experience", "question": "Describe your latest work experience."},
    {"key": "education", "question": "Describe your highest education qualification."},
]


def build_resume_from_answers(answers: Dict[str, str]) -> str:
    name = answers.get("full_name", "Candidate")
    email = answers.get("email", "")
    phone = answers.get("phone", "")
    location = answers.get("location", "")
    summary = answers.get("summary", "")
    skills = answers.get("skills", "")
    experience = answers.get("experience", "")
    education = answers.get("education", "")

    lines = [
        name,
        f"Email: {email} | Phone: {phone} | Location: {location}",
        "",
        "PROFESSIONAL SUMMARY",
        summary,
        "",
        "SKILLS",
        skills,
        "",
        "EXPERIENCE",
        experience,
        "",
        "EDUCATION",
        education,
    ]
    return "\n".join(line for line in lines if line is not None).strip()
