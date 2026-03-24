import io
import json
import os
import re

import docx
import google.generativeai as genai
from dotenv import load_dotenv
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.shared import Pt
from fpdf import FPDF

load_dotenv()
SYSTEM_API_KEY = os.getenv("GEMINI_API_KEY")


def is_valid_key():
    return SYSTEM_API_KEY and SYSTEM_API_KEY.strip() != "your_gemini_api_key_here"


if is_valid_key():
    genai.configure(api_key=SYSTEM_API_KEY)


def _clip_text(text, max_chars=4000):
    txt = str(text or "")
    if len(txt) <= max_chars:
        return txt
    return txt[:max_chars]


def _generate_with_timeout(model, prompt, timeout_sec=10):
    # Keeps API calls responsive so analyze endpoint doesn't hang indefinitely.
    return model.generate_content(prompt, request_options={"timeout": timeout_sec}).text


def get_gemini_ats_feedback(resume_text, job_description, score):
    if not is_valid_key():
        return "Please add a valid Gemini API Key to backend/.env to unlock AI feedback."
    try:
        model = genai.GenerativeModel("gemini-flash-latest")
        prompt = f"""You are an expert ATS and career coach.
I have a resume and a job description. The match score is {score}%.
Job Description: {_clip_text(job_description, 2500)}
Resume: {_clip_text(resume_text, 5000)}
Give EXACTLY 5 actionable bullet points to improve the resume for this job.
Format each as numbered list (1..5), concise, no extra text."""
        return _generate_with_timeout(model, prompt, timeout_sec=10)
    except Exception as e:
        if "API_KEY_INVALID" in str(e):
            return "The Gemini API key in backend/.env is invalid."
        return f"Gemini Error: {e}"


def get_gemini_career_strategy(resume_text):
    if not is_valid_key():
        return "Please add a valid Gemini API Key to backend/.env to unlock AI career strategy."
    try:
        model = genai.GenerativeModel("gemini-flash-latest")
        prompt = f"""You are a career coach and tech recruiter.
Based on this resume text, provide a personalized job recommendation report.
Resume text: {_clip_text(resume_text, 4500)}
Include:
1) Top 5 job titles
2) Top 3 industries
3) 2 skills to learn next
Keep output structured in markdown."""
        return _generate_with_timeout(model, prompt, timeout_sec=8)
    except Exception as e:
        if "API_KEY_INVALID" in str(e):
            return "The Gemini API key in backend/.env is invalid."
        return f"Gemini Error: {e}"


def get_gemini_resume_suggestions(data):
    if not is_valid_key():
        return "Please add a valid Gemini API Key to backend/.env to unlock resume suggestions."
    try:
        model = genai.GenerativeModel("gemini-flash-latest")
        prompt = f"""I am writing my resume. Based on these draft details, give 3 actionable bullet points:
Name: {data.get('name')}
Summary: {data.get('summary')}
Skills: {data.get('skills')}
Experience: {data.get('experience')}
Education: {data.get('education')}
Keep it brief and ATS-focused."""
        return _generate_with_timeout(model, prompt, timeout_sec=10)
    except Exception as e:
        if "API_KEY_INVALID" in str(e):
            return "The Gemini API key in backend/.env is invalid."
        return f"Gemini Error: {e}"


def get_gemini_full_resume_analysis(resume_text, job_description="", stream_or_category=""):
    fallback = {
        "category": (stream_or_category or "").strip() or "General",
        "ats_score": 0.0,
        "missing_keywords": [],
        "suggestions": ["Could not fetch full Gemini analysis right now. Please try again."],
    }
    if not is_valid_key():
        fallback["suggestions"] = ["Add a valid Gemini API key in backend/.env to enable AI-only analysis."]
        return fallback

    try:
        model = genai.GenerativeModel("gemini-flash-latest")
        prompt = f"""You are an ATS and resume analyzer.
Return ONLY valid JSON (no markdown) with keys:
category (string), ats_score (number 0-100), missing_keywords (array of strings), suggestions (array of strings).
Rules:
- If stream_or_category is provided, use it as category unless resume strongly contradicts it.
- If job_description is empty, estimate ATS based on resume quality and relevance to stream_or_category.
- suggestions must be practical and ATS-focused, maximum 7 items.
stream_or_category: {stream_or_category}
job_description: {_clip_text(job_description, 2500)}
resume_text: {_clip_text(resume_text, 5000)}
"""
        raw = _generate_with_timeout(model, prompt, timeout_sec=12) or ""
        match = re.search(r"\{[\s\S]*\}", raw)
        if not match:
            return fallback

        parsed = json.loads(match.group(0))
        category = str(parsed.get("category", fallback["category"])).strip() or fallback["category"]
        try:
            ats_score = float(parsed.get("ats_score", 0.0))
        except Exception:
            ats_score = 0.0
        ats_score = round(max(0.0, min(100.0, ats_score)), 2)

        missing_keywords = parsed.get("missing_keywords", [])
        if not isinstance(missing_keywords, list):
            missing_keywords = []
        missing_keywords = [str(x).strip() for x in missing_keywords if str(x).strip()][:15]

        suggestions = parsed.get("suggestions", [])
        if not isinstance(suggestions, list):
            suggestions = []
        suggestions = [str(x).strip() for x in suggestions if str(x).strip()][:10]
        if not suggestions:
            suggestions = fallback["suggestions"]

        return {
            "category": category,
            "ats_score": ats_score,
            "missing_keywords": missing_keywords,
            "suggestions": suggestions,
        }
    except Exception:
        return fallback


class PDFResume(FPDF):
    def footer(self):
        self.set_y(-15)
        self.set_font("Arial", "I", 8)
        self.cell(0, 10, f"Page {self.page_no()}", align="C")


def generate_pdf(data, template):
    pdf = PDFResume()
    pdf.add_page()

    if template == "Classic ATS":
        pdf.set_font("Arial", "B", 24)
        pdf.cell(0, 10, data.get("name", ""), align="C", ln=True)
        pdf.set_font("Arial", "", 11)
        pdf.cell(0, 6, f"{data.get('email', '')} | {data.get('phone', '')} | {data.get('linkedin', '')}", align="C", ln=True)
        pdf.ln(5)

    elif template == "Modern Minimalist":
        pdf.set_font("Arial", "B", 26)
        pdf.cell(0, 10, data.get("name", "").upper(), align="L", ln=True)
        pdf.set_font("Arial", "I", 11)
        pdf.set_text_color(100, 100, 100)
        pdf.cell(0, 6, f"{data.get('email', '')}    |    {data.get('phone', '')}    |    {data.get('linkedin', '')}", align="L", ln=True)
        pdf.set_text_color(0, 0, 0)
        pdf.line(10, pdf.get_y() + 2, 200, pdf.get_y() + 2)
        pdf.ln(8)

    else:  # Executive
        pdf.set_font("Times", "B", 22)
        pdf.cell(0, 8, data.get("name", ""), align="R", ln=True)
        pdf.set_font("Times", "", 12)
        pdf.cell(0, 6, f"{data.get('email', '')} | {data.get('phone', '')}", align="R", ln=True)
        pdf.cell(0, 6, data.get("linkedin", ""), align="R", ln=True)
        pdf.line(10, pdf.get_y() + 2, 200, pdf.get_y() + 2)
        pdf.ln(6)

    def add_section(title, text):
        if not text or not str(text).strip():
            return
        pdf.set_font("Arial", "B", 14)
        pdf.cell(0, 8, title.upper(), ln=True)
        pdf.line(10, pdf.get_y(), 200, pdf.get_y())
        pdf.ln(2)
        pdf.set_font("Arial", "", 11)
        pdf.multi_cell(0, 6, str(text))
        pdf.ln(5)

    add_section("Professional Summary", data.get("summary"))
    add_section("Key Skills", data.get("skills"))
    add_section("Experience", data.get("experience"))
    add_section("Education", data.get("education"))

    return bytes(pdf.output(dest="S"))


def generate_docx(data, template):
    doc = docx.Document()
    name_pg = doc.add_paragraph()
    if template == "Classic ATS":
        name_pg.alignment = WD_ALIGN_PARAGRAPH.CENTER
    elif template == "Executive":
        name_pg.alignment = WD_ALIGN_PARAGRAPH.RIGHT

    name_run = name_pg.add_run(data.get("name", "").upper() if template == "Modern Minimalist" else data.get("name", ""))
    name_run.bold = True
    name_run.font.size = Pt(24)

    contact_pg = doc.add_paragraph()
    if template == "Classic ATS":
        contact_pg.alignment = WD_ALIGN_PARAGRAPH.CENTER
    elif template == "Executive":
        contact_pg.alignment = WD_ALIGN_PARAGRAPH.RIGHT
    contact_pg.add_run(f"{data.get('email', '')} | {data.get('phone', '')} | {data.get('linkedin', '')}")
    doc.add_paragraph("_" * 75)

    def add_docx_section(title, text):
        if not text or not str(text).strip():
            return
        doc.add_heading(title.upper(), level=1)
        doc.add_paragraph(str(text))

    add_docx_section("Professional Summary", data.get("summary"))
    add_docx_section("Key Skills", data.get("skills"))
    add_docx_section("Experience", data.get("experience"))
    add_docx_section("Education", data.get("education"))

    bio = io.BytesIO()
    doc.save(bio)
    return bio.getvalue()
