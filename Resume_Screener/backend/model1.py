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

    def classify_resume(self, resume_text: str) -> str:
        if not self.classifier:
            return "General"
        try:
            pred = self.classifier.predict([clean_text(resume_text)])
            return str(pred[0])
        except Exception:
            return "General"

    def ats_score(self, resume_text: str, job_description: str) -> float:
        resume_text = clean_text(resume_text)
        job_description = clean_text(job_description)
        if not resume_text or not job_description:
            return 0.0

        vectors = self.vectorizer.fit_transform([resume_text, job_description])
        score = cosine_similarity(vectors[0:1], vectors[1:2])[0][0]
        return round(float(score * 100), 2)

    def analyze_resume(self, resume_text: str, job_description: str = "") -> ResumeAnalysis:
        category = self.classify_resume(resume_text)
        resume_skills = extract_skills(resume_text)
        ats = self.ats_score(resume_text, job_description) if job_description.strip() else 0.0

        jd_keywords = set(top_keywords_from_text(job_description, top_n=25)) if job_description else set()
        resume_words = set(top_keywords_from_text(resume_text, top_n=100))
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

        for job in DEFAULT_JOB_CATALOG:
            job_skills = set(s.lower() for s in job["skills"])
            overlap = resume_skills.intersection(job_skills)
            score = (len(overlap) / max(len(job_skills), 1)) * 100
            missing = sorted(list(job_skills - resume_skills))
            recommendations.append(
                (
                    round(score, 2),
                    {
                        "id": job["id"],
                        "title": job["title"],
                        "company": job["company"],
                        "score": round(score, 2),
                        "matched_skills": sorted(list(overlap)),
                        "missing_skills": missing,
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
