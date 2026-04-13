import os
import base64
import re
import traceback
import logging
import threading
from typing import Dict, List
from pathlib import Path
from dotenv import load_dotenv
from datetime import datetime
import json

from flask import Flask, jsonify, request, render_template, abort, send_from_directory, redirect, session
from flask_cors import CORS
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import random
import string

from model1 import (
    CHATBOT_QUESTIONS,
    ResumeModelService,
    build_resume_from_answers,
    extract_resume_text,
)

from ai_integration import (
    get_gemini_ats_feedback,
    get_gemini_career_strategy,
    get_gemini_resume_suggestions,
    get_gemini_professional_summary,
    get_gemini_full_resume_analysis,
    get_gemini_enhanced_text,
    generate_pdf,
    generate_docx,
    generate_docx_from_builder
)


BASE_DIR = os.path.dirname(os.path.abspath(__file__))
load_dotenv(os.path.join(BASE_DIR, ".env"))
DATASET_PATH = os.path.join(BASE_DIR, "UpdatedResumeDataSet.csv")
FRONTEND_DIR = os.path.join(BASE_DIR, "..", "forntend")
TEMPLATES_DIR = os.path.join(FRONTEND_DIR, "html")
CLIENT_DIST_DIR = os.path.join(BASE_DIR, "..", "client", "dist")
DOWNLOAD_FOLDER = os.path.join(BASE_DIR, "downloads")
os.makedirs(DOWNLOAD_FOLDER, exist_ok=True)
RESUME_MAKER_ENTRY_PATH = "/resume-maker/app/builder/default"
SQLITE_FALLBACK_PATH = Path(BASE_DIR, "resume_screener.db")
ERROR_LOG_PATH = os.path.join(BASE_DIR, "server_errors.log")

app = Flask(
    __name__,
    template_folder=TEMPLATES_DIR,
    static_folder=FRONTEND_DIR,
)
app.secret_key = os.environ.get("SECRET_KEY", "airesume-secret-key-2026")
logging.basicConfig(
    filename=ERROR_LOG_PATH,
    level=logging.ERROR,
    format="%(asctime)s %(levelname)s %(message)s",
)

# --- Database Config ---
def _build_database_url() -> str:
    """Use MySQL when available, otherwise fall back to local SQLite for development."""
    # Railway full URLs
    public_url = os.environ.get("MYSQL_PUBLIC_URL")
    if public_url:
        if public_url.startswith("mysql://"):
            return public_url.replace("mysql://", "mysql+pymysql://")
        return public_url

    private_url = os.environ.get("MYSQL_URL")
    if private_url:
        if private_url.startswith("mysql://"):
            return private_url.replace("mysql://", "mysql+pymysql://")
        return private_url

    database_url = os.environ.get("DATABASE_URL")
    if database_url:
        if database_url.startswith("mysql://"):
            return database_url.replace("mysql://", "mysql+pymysql://")
        return database_url

    # Fallback to individual variables
    railway_host = os.environ.get("MYSQLHOST")
    railway_user = os.environ.get("MYSQLUSER", "root")
    railway_password = os.environ.get("MYSQLPASSWORD")
    railway_database = os.environ.get("MYSQLDATABASE")
    railway_port = os.environ.get("MYSQLPORT") or os.environ.get("DB_PORT", "3306")

    if not all([railway_host, railway_password, railway_database, railway_port]):
        print("[DB] MySQL variables missing. Falling back to local SQLite.")
        return f"sqlite:///{SQLITE_FALLBACK_PATH.as_posix()}"

    import sqlalchemy
    try:
        base_url = f"mysql+pymysql://{railway_user}:{railway_password}@{railway_host}:{railway_port}/"
        engine = sqlalchemy.create_engine(base_url, pool_pre_ping=True)
        with engine.connect() as conn:
            conn.execute(sqlalchemy.text(f"CREATE DATABASE IF NOT EXISTS {railway_database}"))
            conn.commit()
        print(f"[DB] Connected to MySQL at {railway_host}:{railway_port}/{railway_database}")
    except Exception as e:
        print(f"[DB] MySQL unavailable, falling back to SQLite: {e}")
        return f"sqlite:///{SQLITE_FALLBACK_PATH.as_posix()}"

    return (
        f"mysql+pymysql://{railway_user}:{railway_password}"
        f"@{railway_host}:{railway_port}/{railway_database}"
    )

DATABASE_URL = _build_database_url()

app.config['SQLALCHEMY_DATABASE_URI'] = DATABASE_URL
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
app.config["SQLALCHEMY_ENGINE_OPTIONS"] = {
    "pool_pre_ping": True,
    "pool_recycle": 300,
}

CORS(app, supports_credentials=True)

is_local_dev = os.environ.get("FLASK_ENV") != "production" and (
    os.environ.get("MYSQLHOST") in {None, "", "127.0.0.1", "localhost"}
)
app.config["SESSION_COOKIE_SAMESITE"] = "Lax" if is_local_dev else "None"
app.config["SESSION_COOKIE_SECURE"] = False if is_local_dev else True

try:
    from database import db, User, Resume, OTP
    db.init_app(app)
    with app.app_context():
        db.create_all()
    print("[DB] Tables created successfully.")
except Exception as e:
    import traceback
    traceback.print_exc()
    print(f"[DB] Warning: Database init failed: {e}")
    print("[DB] Server will run but auth features won't work.")

service = ResumeModelService(dataset_path=DATASET_PATH)


def _send_email_sync(subject, recipient, body_html):
    """Internal synchronous email sender with timeout and SSL fallback."""
    smtp_server = os.environ.get("SMTP_SERVER", "").strip()
    
    try:
        smtp_port = int(os.environ.get("SMTP_PORT") or 587)
    except Exception:
        smtp_port = 587
        
    smtp_user = os.environ.get("SMTP_USER", "").strip()
    smtp_pass = os.environ.get("SMTP_PASS", "").strip()
    mail_sender = os.environ.get("MAIL_SENDER", "AI Resume <noreply@airesume.com>")

    if not all([smtp_server, smtp_user, smtp_pass]):
        print("[SMTP] Error: Missing configuration in .env")
        print(f"[SMTP] server='{smtp_server}' user='{smtp_user}' pass_set={'yes' if smtp_pass else 'no'}")
        return False

    msg = MIMEMultipart()
    msg["From"] = mail_sender
    msg["To"] = recipient
    msg["Subject"] = subject
    msg.attach(MIMEText(body_html, "html"))

    # Try 1: SMTP with STARTTLS (port 587)
    try:
        print(f"[SMTP] Attempt 1: STARTTLS to {smtp_server}:{smtp_port} as {smtp_user}")
        server = smtplib.SMTP(smtp_server, smtp_port, timeout=10)
        server.ehlo()
        server.starttls()
        server.ehlo()
        server.login(smtp_user, smtp_pass)
        server.send_message(msg)
        server.quit()
        print(f"[SMTP] Email sent successfully to {recipient} via STARTTLS")
        return True
    except Exception as e1:
        print(f"[SMTP] STARTTLS failed: {e1}")

    # Try 2: SMTP_SSL (port 465)
    try:
        ssl_port = 465
        print(f"[SMTP] Attempt 2: SSL to {smtp_server}:{ssl_port} as {smtp_user}")
        server = smtplib.SMTP_SSL(smtp_server, ssl_port, timeout=10)
        server.ehlo()
        server.login(smtp_user, smtp_pass)
        server.send_message(msg)
        server.quit()
        print(f"[SMTP] Email sent successfully to {recipient} via SSL")
        return True
    except Exception as e2:
        print(f"[SMTP] SSL also failed: {e2}")

    print(f"[SMTP] All attempts failed for {recipient}")
    return False


def send_email(subject, recipient, body_html):
    """Send email in a background thread so the API response is not blocked."""
    thread = threading.Thread(
        target=_send_email_sync,
        args=(subject, recipient, body_html),
        daemon=True,
    )
    thread.start()
    print(f"[SMTP] Email queued for {recipient} (background thread)")
    return True


def generate_otp(length=6):
    """Generate a random numeric OTP."""
    return "".join(random.choices(string.digits, k=length))


def _log_api_exception(route_name: str, exc: Exception):
    """Log API exceptions to a file and console-friendly output."""
    trace = traceback.format_exc()
    logging.error("[%s] %s\n%s", route_name, exc, trace)
    print(f"[API ERROR] {route_name}: {exc}")


@app.errorhandler(Exception)
def handle_api_exception(exc):
    """Return JSON for API failures instead of HTML error pages."""
    import traceback
    route = request.path or ""
    if route.startswith("/api/"):
        _log_api_exception(route, exc)
        return jsonify({
            "success": False, 
            "error": str(exc) or "Internal server error",
            "trace": traceback.format_exc()
        }), 500
    raise exc

ALLOWED_PAGES = {
    "home",
    "upload",
    "result",
    "maker_options",
    "chatbot",
    "form",
    "blanks",
    "jobs",
    "login",
}
RESUME_MAKER_PAGES = {"chatbot", "form", "blanks"}


@app.get("/")
def home_page():
    return render_template("home.html", google_client_id=os.environ.get("GOOGLE_CLIENT_ID", ""))


def _client_build_ready() -> bool:
    return os.path.exists(os.path.join(CLIENT_DIST_DIR, "index.html"))


def is_authenticated():
    """Check if a user is logged in via session."""
    return "user_id" in session


@app.get("/resume-maker")
def resume_maker_root():
    if not is_authenticated():
        return redirect("/login")
    return render_template("maker_options.html")

@app.get("/resume-maker/form-builder")
def resume_maker_form_builder_entry():
    if not is_authenticated():
        return redirect("/login")
    if _client_build_ready():
        return redirect(RESUME_MAKER_ENTRY_PATH)
    return redirect("/form")


@app.get("/resume-maker/<path:asset_path>")
def resume_maker_static(asset_path: str):
    if not _client_build_ready():
        if asset_path.startswith("app/"):
            if not is_authenticated():
                return redirect("/login")
            return redirect("/form")
        abort(404)
    requested_path = os.path.join(CLIENT_DIST_DIR, asset_path)
    if os.path.isfile(requested_path):
        return send_from_directory(CLIENT_DIST_DIR, asset_path)
    
    # Check auth before serving SPA index for React Router
    if not is_authenticated():
        return redirect("/login")
        
    # SPA fallback for React Router routes.
    return send_from_directory(CLIENT_DIST_DIR, "index.html")


@app.get("/<string:page>")
def serve_page(page: str):
    # Only serve known frontend pages and block unknown paths.
    if page not in ALLOWED_PAGES:
        abort(404)
    
    # Require login for all specific tool pages
    protected_pages = {"upload", "result", "maker_options", "chatbot", "form", "blanks", "jobs"}
    if page in protected_pages and not is_authenticated():
        return redirect("/login")

    if page in RESUME_MAKER_PAGES and _client_build_ready():
        return redirect(RESUME_MAKER_ENTRY_PATH)
    return render_template(f"{page}.html", google_client_id=os.environ.get("GOOGLE_CLIENT_ID", ""))


@app.get("/<string:page>.html")
def serve_page_html(page: str):
    if page not in ALLOWED_PAGES:
        abort(404)
        
    protected_pages = {"upload", "result", "maker_options", "chatbot", "form", "blanks", "jobs"}
    if page in protected_pages and not is_authenticated():
        return redirect("/login")

    if page in RESUME_MAKER_PAGES and _client_build_ready():
        return redirect(RESUME_MAKER_ENTRY_PATH)
    return render_template(f"{page}.html", google_client_id=os.environ.get("GOOGLE_CLIENT_ID", ""))


@app.get("/css/<path:filename>")
def serve_css(filename: str):
    return send_from_directory(os.path.join(FRONTEND_DIR, "css"), filename)


@app.get("/js/<path:filename>")
def serve_js(filename: str):
    return send_from_directory(os.path.join(FRONTEND_DIR, "js"), filename)


def _read_resume_from_request(file_key: str = "resume") -> str:
    if file_key not in request.files:
        raise ValueError(f"Missing file field '{file_key}'")
    file_storage = request.files[file_key]
    if not file_storage or not file_storage.filename:
        raise ValueError("Invalid file upload")
    file_bytes = file_storage.read()
    return extract_resume_text(file_storage.filename, file_bytes)


def _fallback_professional_summary(
    professional_title: str,
    stream_or_category: str,
    skills: str,
    experience: str,
) -> str:
    role_anchor = (professional_title or stream_or_category or "professional").strip()
    words = [w.strip() for w in str(skills or "").replace("\n", ",").split(",") if w.strip()]
    top_skills = ", ".join(words[:6])
    skill_line = top_skills if top_skills else "data analysis, communication, and problem solving"
    exp_text = str(experience or "").strip()
    exp_hint = exp_text.split("\n")[0][:120] if exp_text else ""

    parts = [
        f"Results-driven {role_anchor} with a strong foundation in {skill_line}.",
        "Known for translating requirements into measurable outcomes, improving process quality, and delivering reliable execution across cross-functional teams.",
    ]
    if exp_hint:
        parts.append(f"Hands-on experience includes {exp_hint}.")
    parts.append("Brings an ATS-friendly profile aligned to role expectations with clear impact, technical depth, and continuous learning mindset.")
    return " ".join(parts)


def _extract_candidate_name(resume_text: str) -> str:
    lines = [line.strip() for line in str(resume_text or "").splitlines() if line.strip()]
    banned = {"resume", "curriculum vitae", "cv", "profile", "summary", "objective", "experience", "education"}
    for line in lines[:12]:
        lowered = line.lower()
        if any(token in lowered for token in ["@", "http://", "https://", "linkedin", "github"]):
            continue
        if any(ch.isdigit() for ch in line):
            continue
        cleaned = re.sub(r"[^a-zA-Z\s]", " ", line)
        words = [w for w in cleaned.split() if w]
        if 2 <= len(words) <= 4:
            joined = " ".join(words).strip()
            if joined.lower() not in banned and len(joined) >= 4:
                return joined.title()
    return ""


def _find_contact(text: str, pattern: str) -> str:
    match = re.search(pattern, str(text or ""), flags=re.IGNORECASE)
    return match.group(0).strip() if match else ""


def _extract_section(lines: List[str], starts: List[str], stops: List[str]) -> str:
    start_idx = None
    for idx, line in enumerate(lines):
        lowered = re.sub(r"[^a-zA-Z\s]", " ", line.lower()).strip()
        if any(key in lowered for key in starts):
            start_idx = idx + 1
            break
    if start_idx is None:
        return ""

    end_idx = len(lines)
    for idx in range(start_idx, len(lines)):
        lowered = re.sub(r"[^a-zA-Z\s]", " ", lines[idx].lower()).strip()
        if any(key in lowered for key in stops):
            end_idx = idx
            break
    block = "\n".join(lines[start_idx:end_idx]).strip()
    return block


def _build_resume_prefill(resume_text: str, category: str, detected_skills: List[str]) -> Dict:
    text = str(resume_text or "")
    lines = [line.strip() for line in text.splitlines() if line.strip()]

    email = _find_contact(text, r"[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}")
    raw_phone = _find_contact(text, r"(?:\+?\d[\d\-\s\(\)]{8,}\d)")
    phone = re.sub(r"[^\d\+\-\s\(\)]", "", raw_phone).strip() if raw_phone else ""

    linkedin = _find_contact(text, r"(?:https?://)?(?:www\.)?linkedin\.com/[^\s]+")
    github = _find_contact(text, r"(?:https?://)?(?:www\.)?github\.com/[^\s]+")
    website = _find_contact(text, r"https?://[^\s]+")
    if website and (linkedin and website in linkedin or github and website in github):
        website = ""

    full_name = _extract_candidate_name(text)
    professional_title = str(category or "").strip()

    summary_block = _extract_section(
        lines,
        starts=["professional summary", "summary", "profile", "objective", "about"],
        stops=["experience", "education", "skills", "projects", "certification", "achievements"],
    )
    summary = " ".join(summary_block.split())
    if not summary:
        candidate_lines = []
        for line in lines[:20]:
            lowered = line.lower()
            if any(token in lowered for token in ["@", "linkedin", "github", "http://", "https://"]):
                continue
            if len(line.split()) < 4:
                continue
            if any(h in lowered for h in ["experience", "education", "skills", "project", "certification"]):
                continue
            candidate_lines.append(line)
            if len(candidate_lines) >= 3:
                break
        summary = " ".join(candidate_lines)
    summary = summary[:420].strip()

    experience_block = _extract_section(
        lines,
        starts=["work experience", "professional experience", "experience"],
        stops=["education", "skills", "projects", "certification", "achievements"],
    )
    education_block = _extract_section(
        lines,
        starts=["education", "academic"],
        stops=["experience", "skills", "projects", "certification", "achievements"],
    )

    experience_list = []
    if experience_block:
        exp_desc = " ".join(experience_block.split())[:700]
        experience_list.append(
            {
                "company": "",
                "position": professional_title or "Professional Experience",
                "start_date": "",
                "end_date": "",
                "is_current": False,
                "description": exp_desc,
            }
        )

    education_list = []
    if education_block:
        edu_desc = " ".join(education_block.split())[:450]
        education_list.append(
            {
                "institution": "",
                "degree": "",
                "field": "",
                "graduation_date": "",
                "gpa": "",
                "details": edu_desc,
            }
        )

    skills = [str(s).strip() for s in (detected_skills or []) if str(s).strip()][:20]

    return {
        "title": f"{professional_title or 'Resume'} Builder Draft",
        "personal_info": {
            "full_name": full_name,
            "email": email,
            "phone": phone,
            "address": "",
            "city": "",
            "state": "",
            "zip": "",
            "country": "",
            "linkedin": linkedin,
            "github": github,
            "website": website,
            "professional_title": professional_title,
        },
        "professional_summary": summary,
        "experience": experience_list,
        "education": education_list,
        "project": [],
        "skills": skills,
    }


@app.get("/api/health")
def health():
    import traceback
    db_status = "ok"
    trace = ""
    try:
        # Check DB connection
        import sqlalchemy
        db.session.execute(sqlalchemy.text('SELECT 1'))
    except Exception as e:
        db_status = str(e)
        trace = traceback.format_exc()
    
    masked_url = DATABASE_URL
    if "MYSQLPASSWORD" in os.environ:
        masked_url = masked_url.replace(os.environ["MYSQLPASSWORD"], "***")
        
    return jsonify({
        "status": "ok",
        "database_status": db_status,
        "database_url_masked": masked_url,
        "smtp_server": os.environ.get("SMTP_SERVER", "NOT SET"),
        "smtp_port": os.environ.get("SMTP_PORT", "NOT SET"),
        "smtp_user": os.environ.get("SMTP_USER", "NOT SET"),
        "smtp_pass_set": "yes" if os.environ.get("SMTP_PASS") else "NO",
        "mail_sender": os.environ.get("MAIL_SENDER", "NOT SET"),
        "trace": trace
    })


@app.get("/api/test-smtp")
def test_smtp():
    """Temporary diagnostic: test SMTP connection synchronously and return exact error."""
    import traceback
    smtp_server = os.environ.get("SMTP_SERVER", "").strip()
    try:
        smtp_port = int(os.environ.get("SMTP_PORT") or 587)
    except Exception:
        smtp_port = 587
    smtp_user = os.environ.get("SMTP_USER", "").strip()
    smtp_pass = os.environ.get("SMTP_PASS", "").strip()

    if not all([smtp_server, smtp_user, smtp_pass]):
        return jsonify({"error": "Missing SMTP config", "server": smtp_server, "user": smtp_user, "pass_set": bool(smtp_pass)})

    results = []

    # Try STARTTLS (port 587)
    try:
        server = smtplib.SMTP(smtp_server, smtp_port, timeout=10)
        server.ehlo()
        server.starttls()
        server.ehlo()
        server.login(smtp_user, smtp_pass)
        server.quit()
        results.append({"method": "STARTTLS", "port": smtp_port, "status": "SUCCESS"})
    except Exception as e:
        results.append({"method": "STARTTLS", "port": smtp_port, "status": "FAILED", "error": str(e), "trace": traceback.format_exc()})

    # Try SSL (port 465)
    try:
        server = smtplib.SMTP_SSL(smtp_server, 465, timeout=10)
        server.ehlo()
        server.login(smtp_user, smtp_pass)
        server.quit()
        results.append({"method": "SSL", "port": 465, "status": "SUCCESS"})
    except Exception as e:
        results.append({"method": "SSL", "port": 465, "status": "FAILED", "error": str(e), "trace": traceback.format_exc()})

    return jsonify({"smtp_server": smtp_server, "smtp_port": smtp_port, "smtp_user": smtp_user, "results": results})


@app.post("/api/generate-summary")
def generate_summary():
    try:
        payload: Dict = request.get_json(force=True) or {}
        professional_title = str(payload.get("professional_title", "")).strip()
        stream_or_category = str(payload.get("stream_or_category", "")).strip()
        skills = payload.get("skills", "")
        experience = payload.get("experience", "")
        current_summary = payload.get("current_summary", "")

        if not professional_title and not stream_or_category:
            raise ValueError("Professional Title or ATS Category/Stream is required.")

        gemini_summary = get_gemini_professional_summary(
            professional_title=professional_title,
            stream_or_category=stream_or_category,
            skills=str(skills or ""),
            experience=str(experience or ""),
            current_summary=str(current_summary or ""),
        )

        source = "gemini"
        summary = str(gemini_summary or "").strip()
        if not summary or summary.lower().startswith("gemini error"):
            source = "fallback"
            summary = _fallback_professional_summary(
                professional_title=professional_title,
                stream_or_category=stream_or_category,
                skills=str(skills or ""),
                experience=str(experience or ""),
            )

        return jsonify({"success": True, "summary": summary, "source": source})
    except Exception as exc:
        return jsonify({"success": False, "error": str(exc)}), 400

@app.post("/api/enhance-text")
def enhance_text():
    try:
        payload = request.get_json(force=True) or {}
        text_to_enhance = str(payload.get("text", "")).strip()
        if not text_to_enhance:
            return jsonify({"success": False, "error": "No text provided"}), 400
        
        enhanced = get_gemini_enhanced_text(text_to_enhance)
        return jsonify({"success": True, "enhanced_text": enhanced})
    except Exception as exc:
        return jsonify({"success": False, "error": str(exc)}), 500

@app.post("/api/analyze-resume")
def analyze_resume():
    try:
        job_description = request.form.get("job_description", "").strip()
        stream_or_category = request.form.get("stream_or_category", "").strip()
        resume_text = ""
        if "resume" in request.files and request.files.get("resume") and request.files.get("resume").filename:
            resume_text = _read_resume_from_request("resume")
        elif not (stream_or_category and job_description):
            raise ValueError("Please upload a resume, or provide both Category/Stream and Job Description.")

        use_dataset_for_category = not stream_or_category or service.has_category_in_dataset(stream_or_category)

        def merge_suggestions(*groups):
            merged = []
            seen = set()
            for group in groups:
                if not group:
                    continue
                for item in group:
                    text = str(item or "").strip()
                    if not text:
                        continue
                    key = text.lower()
                    if key in seen:
                        continue
                    seen.add(key)
                    merged.append(text)
            return merged

        if stream_or_category and job_description:
            # User supplied explicit category + JD:
            # - category should be user category
            # - ATS should be JD-based
            analysis = service.analyze_resume(resume_text, job_description)
            merged_suggestions = list(analysis.suggestions)
            gemini_ats_feedback = get_gemini_ats_feedback(resume_text, job_description, analysis.ats_score)
            if gemini_ats_feedback and not gemini_ats_feedback.lower().startswith("gemini error"):
                merged_suggestions.append(gemini_ats_feedback)
            response_analysis = {
                "category": stream_or_category,
                "ats_score": analysis.ats_score,
                "skills": analysis.resume_skills,
                "missing_keywords": analysis.missing_keywords,
                "suggestions": merged_suggestions,
                "mode": "user_category_plus_jd",
            }
            jobs = service.recommend_jobs(resume_text or stream_or_category, top_k=5)
            gemini_career_map = get_gemini_career_strategy(resume_text)
            return jsonify(
                {
                    "success": True,
                    "analysis": response_analysis,
                    "job_recommendations": jobs,
                    "gemini_ats_feedback": None,
                    "gemini_career_map": gemini_career_map,
                    "prefill_data": _build_resume_prefill(resume_text, response_analysis.get("category", stream_or_category) or "", response_analysis.get("skills", [])),
                }
            )

        if not job_description:
            # No JD: estimate ATS using Gemini first, then fallback to dataset/category profile.
            analysis = service.analyze_resume(resume_text, "")
            final_category = stream_or_category or analysis.category
            gemini_full = get_gemini_full_resume_analysis(
                resume_text=resume_text,
                job_description="",
                stream_or_category=final_category,
            )
            if gemini_full.get("gemini_ok"):
                response_analysis = {
                    "category": gemini_full.get("category", final_category),
                    "ats_score": gemini_full.get("ats_score", 0.0),
                    "ats_available": True,
                    "skills": analysis.resume_skills,
                    "missing_keywords": gemini_full.get("missing_keywords", []),
                    "suggestions": merge_suggestions(analysis.suggestions, gemini_full.get("suggestions", [])),
                    "mode": "gemini_no_jd",
                }
            else:
                dataset_ats = service.estimate_ats_without_jd(resume_text, final_category)
                response_analysis = {
                    "category": final_category,
                    "ats_score": dataset_ats,
                    "ats_available": True,
                    "skills": analysis.resume_skills,
                    "missing_keywords": [],
                    "suggestions": merge_suggestions(
                        analysis.suggestions,
                        ["Gemini unavailable, so ATS is estimated using the resume dataset profile."],
                    ),
                    "mode": "dataset_no_jd_fallback",
                }
        elif use_dataset_for_category:
            # Resume + known stream/category (or empty stream): dataset ATS + optional Gemini ATS tips.
            analysis = service.analyze_resume(resume_text, job_description)
            final_category = stream_or_category or analysis.category
            gemini_ats_feedback = get_gemini_ats_feedback(resume_text, job_description, analysis.ats_score)
            merged_suggestions = merge_suggestions(
                analysis.suggestions,
                [] if not gemini_ats_feedback or gemini_ats_feedback.lower().startswith("gemini error") else [gemini_ats_feedback],
            )
            response_analysis = {
                "category": final_category,
                "ats_score": analysis.ats_score,
                "ats_available": True,
                "skills": analysis.resume_skills,
                "missing_keywords": analysis.missing_keywords,
                "suggestions": merged_suggestions,
                "mode": "dataset_category",
            }
        else:
            # Unknown category with JD: try Gemini full analysis, fallback to dataset ATS if Gemini fails.
            analysis = service.analyze_resume(resume_text, job_description)
            gemini_full = get_gemini_full_resume_analysis(
                resume_text=resume_text,
                job_description=job_description,
                stream_or_category=stream_or_category,
            )
            if gemini_full.get("gemini_ok"):
                response_analysis = {
                    "category": gemini_full.get("category", stream_or_category or "General"),
                    "ats_score": gemini_full.get("ats_score", analysis.ats_score),
                    "ats_available": True,
                    "skills": analysis.resume_skills,
                    "missing_keywords": gemini_full.get("missing_keywords", []),
                    "suggestions": merge_suggestions(analysis.suggestions, gemini_full.get("suggestions", [])),
                    "mode": "gemini_only_unknown_category",
                }
            else:
                response_analysis = {
                    "category": stream_or_category or analysis.category,
                    "ats_score": analysis.ats_score,
                    "ats_available": True,
                    "skills": analysis.resume_skills,
                    "missing_keywords": analysis.missing_keywords,
                    "suggestions": merge_suggestions(
                        analysis.suggestions,
                        ["Gemini analysis failed, so dataset ATS scoring is used as fallback."],
                    ),
                    "mode": "dataset_fallback_unknown_category",
                }

        jobs = service.recommend_jobs(resume_text or stream_or_category, top_k=5)
        gemini_career_map = get_gemini_career_strategy(resume_text or stream_or_category)

        return jsonify(
            {
                "success": True,
                "analysis": response_analysis,
                "job_recommendations": jobs,
                "gemini_ats_feedback": None,
                "gemini_career_map": gemini_career_map,
                "prefill_data": _build_resume_prefill(resume_text, response_analysis.get("category", stream_or_category) or "", response_analysis.get("skills", [])),
            }
        )
    except Exception as exc:
        return jsonify({"success": False, "error": str(exc)}), 400


@app.post("/api/recommend-jobs")
def recommend_jobs():
    try:
        resume_text = request.form.get("resume_text", "").strip()
        if not resume_text:
            resume_text = _read_resume_from_request("resume")
            
        jobs = service.recommend_jobs(resume_text, top_k=5)
        gemini_career_map = get_gemini_career_strategy(resume_text)
        
        return jsonify({"success": True, "jobs": jobs, "gemini_career_map": gemini_career_map})
    except Exception as exc:
        return jsonify({"success": False, "error": str(exc)}), 400


@app.post("/api/rank-candidates")
def rank_candidates():
    try:
        if "job_description" not in request.form:
            raise ValueError("job_description is required")
        job_description = request.form.get("job_description", "").strip()
        uploaded_files = request.files.getlist("resumes")
        if not uploaded_files:
            raise ValueError("Upload at least one resume in 'resumes'")

        parsed: List[tuple[str, str]] = []
        for file_storage in uploaded_files:
            if not file_storage or not file_storage.filename:
                continue
            text = extract_resume_text(file_storage.filename, file_storage.read())
            parsed.append((file_storage.filename, text))

        if not parsed:
            raise ValueError("No valid resume files were uploaded")

        ranked = service.rank_candidates(parsed, job_description)
        return jsonify({"success": True, "ranked_candidates": ranked})
    except Exception as exc:
        return jsonify({"success": False, "error": str(exc)}), 400


@app.get("/api/chatbot/questions")
def chatbot_questions():
    return jsonify({"success": True, "questions": CHATBOT_QUESTIONS})


@app.post("/api/chatbot/generate-resume")
def chatbot_generate_resume():
    try:
        payload: Dict = request.get_json(force=True)
        answers = payload.get("answers", {})
        template_choice = payload.get("template_choice", "classical.pdf")
        
        if not isinstance(answers, dict) or not answers:
            raise ValueError("answers must be a non-empty object")
            
        data = {
            "name": answers.get("full_name", "Candidate"),
            "headline": answers.get("headline", ""),
            "email": answers.get("email", ""),
            "phone": answers.get("phone", ""),
            "location": answers.get("location", ""),
            "website": answers.get("website", ""),
            "linkedin": answers.get("location", ""),
            "summary": answers.get("summary", ""),
            "skills": answers.get("skills", ""),
            "side_skills": answers.get("side_skills", ""),
            "languages": answers.get("languages", ""),
            "experience": answers.get("experience", ""),
            "education": answers.get("education", "")
        }
            
        resume_text = build_resume_from_answers(answers)
        jobs = service.recommend_jobs(resume_text, top_k=3)
        
        suggestions = get_gemini_resume_suggestions(data)
        
        pdf_bytes = generate_pdf(data, template_choice)
        docx_bytes = generate_docx(data, template_choice)
        
        pdf_b64 = base64.b64encode(pdf_bytes).decode('utf-8')
        docx_b64 = base64.b64encode(docx_bytes).decode('utf-8')
        
        return jsonify({
            "success": True, 
            "resume_text": resume_text, 
            "job_recommendations": jobs,
            "gemini_suggestions": suggestions,
            "selected_template": template_choice,
            "pdf_b64": pdf_b64,
            "docx_b64": docx_b64
        })
    except Exception as exc:
        return jsonify({"success": False, "error": str(exc)}), 400


@app.route("/api/download-docx", methods=["POST"])
def download_docx_api():
    """Generate a .docx from the React Resume Builder data and return it as a file."""
    try:
        data = request.get_json(force=True)
        if not data:
            return jsonify({"error": "No data provided"}), 400

        docx_bytes = generate_docx_from_builder(data)
        docx_b64 = base64.b64encode(docx_bytes).decode('utf-8')

        return jsonify({"success": True, "docx_b64": docx_b64})
    except Exception as exc:
        return jsonify({"success": False, "error": str(exc)}), 400

# =============================================
# AUTH & USER API ENDPOINTS
# =============================================

@app.route("/api/auth/register", methods=["POST"])
def register():
    """Register a new user."""
    try:
        data = request.get_json(force=True)
        full_name = (data.get("full_name") or "").strip()
        email = (data.get("email") or "").strip().lower()
        mobile = (data.get("mobile") or "").strip()
        password = data.get("password") or ""

        if not full_name or not email or not password:
            return jsonify({"success": False, "error": "Name, email, and password are required."}), 400
        if len(password) < 6:
            return jsonify({"success": False, "error": "Password must be at least 6 characters."}), 400

        existing = User.query.filter_by(email=email).first()
        if existing:
            if existing.is_verified:
                return jsonify({"success": False, "error": "Email already registered."}), 409
            # Delete unverified user so they can re-register
            OTP.query.filter_by(email=email).delete()
            db.session.delete(existing)
            db.session.commit()

        user = User(full_name=full_name, email=email, mobile=mobile, is_verified=False)
        user.set_password(password)
        db.session.add(user)

        otp_code = generate_otp()
        otp_entry = OTP(email=email, code=otp_code, purpose="registration")
        db.session.add(otp_entry)
        db.session.commit()

        email_body = f"""
        <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
            <h2 style="color: #ff6b6b;">Confirm Your AI Resume Account</h2>
            <p>Hello {full_name},</p>
            <p>Use the code below to verify your email address and start building your premium resume:</p>
            <div style="background: #f8f9fa; padding: 15px; font-size: 24px; font-weight: bold; text-align: center; color: #333; letter-spacing: 5px;">
                {otp_code}
            </div>
            <p>This code will expire in 10 minutes.</p>
            <p>Best regards,<br>The AI Resume Team</p>
        </div>
        """
        send_email("Verify your AI Resume Account", email, email_body)

        return jsonify({"success": True, "message": "Verify your email with the OTP sent.", "email": email}), 201
    except Exception as exc:
        import traceback
        db.session.rollback()
        _log_api_exception("register", exc)
        return jsonify({"success": False, "error": str(exc), "trace": traceback.format_exc()}), 500


@app.route("/api/auth/verify-otp", methods=["POST"])
def verify_otp():
    """Verify the OTP sent to an email."""
    data = request.get_json(force=True)
    email = (data.get("email") or "").strip().lower()
    code = (data.get("code") or "").strip()

    if not email or not code:
        print(f"[OTP Verify] Error: Missing email or code. Email: '{email}', Code: '{code}'")
        return jsonify({"success": False, "error": "Email and code are required."}), 400

    otp_record = OTP.query.filter_by(email=email, code=code).order_by(OTP.created_at.desc()).first()
    
    if not otp_record:
        print(f"[OTP Verify] Error: OTP not found for {email} with code {code}.")
        # Optional: Log what codes ARE in the DB for this email to debug
        all_otps = OTP.query.filter_by(email=email).all()
        print(f"[OTP Verify] Existing codes for {email}: {[o.code for o in all_otps]}")
        return jsonify({"success": False, "error": "Invalid OTP code."}), 400
    
    if otp_record.is_expired:
        print(f"[OTP Verify] Error: OTP expired for {email}.")
        return jsonify({"success": False, "error": "OTP has expired. Please request a new one."}), 400

    # Mark user as verified
    user = User.query.filter_by(email=email).first()
    if user:
        user.is_verified = True
        db.session.delete(otp_record) # Cleanup
        db.session.commit()
        
        session["user_id"] = user.id
        return jsonify({"success": True, "user": user.to_dict()})
    
    return jsonify({"success": False, "error": "User not found."}), 404


@app.route("/api/auth/resend-otp", methods=["POST"])
def resend_otp():
    """Resend a new OTP to the user's email."""
    data = request.get_json(force=True)
    email = (data.get("email") or "").strip().lower()

    if not email:
        return jsonify({"success": False, "error": "Email is required."}), 400

    user = User.query.filter_by(email=email).first()
    if not user:
        return jsonify({"success": False, "error": "Email not found."}), 404

    otp_code = generate_otp()
    otp_entry = OTP(email=email, code=otp_code, purpose="registration")
    db.session.add(otp_entry)
    db.session.commit()

    send_email("New Verification Code", email, f"Your new code is: {otp_code}")
    return jsonify({"success": True, "message": "New OTP sent."})


@app.route("/api/auth/login", methods=["POST"])
def login():
    """Login an existing user."""
    data = request.get_json(force=True)
    email = (data.get("email") or "").strip().lower()
    password = data.get("password") or ""

    user = User.query.filter_by(email=email).first()
    if not user or not user.check_password(password):
        return jsonify({"success": False, "error": "Invalid email or password."}), 401

    if not user.is_verified:
        return jsonify({
            "success": False, 
            "error": "Email not verified. Please verify your account first.",
            "unverified": True,
            "email": user.email
        }), 403

    session["user_id"] = user.id
    return jsonify({"success": True, "user": user.to_dict()})


@app.route("/api/auth/logout", methods=["POST"])
def logout():
    """Logout the current user."""
    session.pop("user_id", None)
    session.pop("analysis_result", None)
    return jsonify({"success": True})


@app.route("/api/auth/google", methods=["POST"])
def google_auth():
    """Login or register via Google ID token."""
    data = request.get_json(force=True)
    id_token_str = data.get("id_token", "")
    if not id_token_str:
        return jsonify({"success": False, "error": "No id_token provided."}), 400

    try:
        from google.oauth2 import id_token as gid_token
        from google.auth.transport import requests as google_requests
        GOOGLE_CLIENT_ID = os.environ.get("GOOGLE_CLIENT_ID", "")
        info = gid_token.verify_oauth2_token(
            id_token_str,
            google_requests.Request(),
            GOOGLE_CLIENT_ID,
        )
        email = info.get("email", "").lower().strip()
        full_name = info.get("name", "").strip()
        if not email:
            return jsonify({"success": False, "error": "Google account has no email."}), 400

        # Find or create user
        user = User.query.filter_by(email=email).first()
        if not user:
            user = User(full_name=full_name, email=email)
            user.set_password(os.urandom(24).hex())  # random password for Google users
            db.session.add(user)
            db.session.commit()

        session["user_id"] = user.id
        return jsonify({"success": True, "user": user.to_dict()})
    except ValueError as e:
        return jsonify({"success": False, "error": f"Invalid Google token: {e}"}), 401
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


@app.route("/api/session/analysis", methods=["POST"])
def save_analysis_to_session():
    """Store analysis result in server-side session (replaces localStorage)."""
    data = request.get_json(force=True)
    session["analysis_result"] = json.dumps(data)
    
    # Also save to DB if user is logged in
    user_id = session.get("user_id")
    if user_id and data.get("analysis"):
        analysis = data["analysis"]
        resume = Resume(
            user_id=user_id,
            title=f"ATS Analysis - {analysis.get('category', 'General')}",
            resume_text=data.get("resume_text", ""),
            ats_score=analysis.get("ats_score"),
            category=analysis.get("category"),
            resume_json=json.dumps(data),
        )
        db.session.add(resume)
        db.session.commit()
    
    return jsonify({"success": True})


@app.route("/api/session/analysis", methods=["GET"])
def get_analysis_from_session():
    """Retrieve analysis result from server-side session."""
    raw = session.get("analysis_result")
    if not raw:
        return jsonify({"success": False, "error": "No analysis result in session."}), 404
    return jsonify({"success": True, "data": json.loads(raw)})


@app.route("/api/auth/me", methods=["GET"])
def get_current_user():
    """Get the currently logged-in user profile."""
    user_id = session.get("user_id")
    if not user_id:
        return jsonify({"success": False, "error": "Not logged in."}), 401
    user = db.session.get(User, user_id)
    if not user:
        session.pop("user_id", None)
        return jsonify({"success": False, "error": "User not found."}), 401
    return jsonify({"success": True, "user": user.to_dict()})


@app.route("/api/auth/update", methods=["PUT"])
def update_profile():
    """Update user profile fields."""
    user_id = session.get("user_id")
    if not user_id:
        return jsonify({"success": False, "error": "Not logged in."}), 401
    user = db.session.get(User, user_id)
    if not user:
        return jsonify({"success": False, "error": "User not found."}), 401

    data = request.get_json(force=True)
    if "full_name" in data:
        user.full_name = data["full_name"].strip()
    if "mobile" in data:
        user.mobile = data["mobile"].strip()
    db.session.commit()
    return jsonify({"success": True, "user": user.to_dict()})


@app.route("/api/dashboard", methods=["GET"])
def get_dashboard():
    """Get dashboard stats for the logged-in user."""
    user_id = session.get("user_id")
    if not user_id:
        return jsonify({"success": False, "error": "Not logged in."}), 401
    user = db.session.get(User, user_id)
    if not user:
        return jsonify({"success": False, "error": "User not found."}), 401

    resumes = Resume.query.filter_by(user_id=user_id).order_by(Resume.updated_at.desc()).all()
    
    total_resumes = len(resumes)
    scores = [r.ats_score for r in resumes if r.ats_score is not None]
    avg_score = round(sum(scores) / len(scores), 1) if scores else 0
    best_score = round(max(scores), 1) if scores else 0
    categories = list(set(r.category for r in resumes if r.category))
    
    recent = []
    for r in resumes[:5]:
        recent.append({
            "id": r.id,
            "title": r.title,
            "ats_score": r.ats_score,
            "category": r.category,
            "date": r.updated_at.strftime("%b %d, %Y") if r.updated_at else "",
        })

    return jsonify({
        "success": True,
        "user": user.to_dict(),
        "stats": {
            "total_resumes": total_resumes,
            "avg_score": avg_score,
            "best_score": best_score,
            "categories": categories,
            "total_analyses": len(scores),
        },
        "recent_activity": recent,
    })


@app.route("/profile.html")
def profile_page():
    """Serve the profile/dashboard page."""
    if not is_authenticated():
        return redirect("/login.html")
    return render_template("profile.html", google_client_id=os.environ.get("GOOGLE_CLIENT_ID", ""))


# =============================================
# RESUME CRUD ENDPOINTS
# =============================================

@app.route("/api/resumes", methods=["GET"])
def list_resumes():
    """List all resumes for the logged-in user."""
    user_id = session.get("user_id")
    if not user_id:
        return jsonify({"success": False, "error": "Not logged in."}), 401
    resumes = Resume.query.filter_by(user_id=user_id).order_by(Resume.updated_at.desc()).all()
    return jsonify({"success": True, "resumes": [r.to_dict() for r in resumes]})


@app.route("/api/resumes", methods=["POST"])
def save_resume():
    """Create or update a resume."""
    user_id = session.get("user_id")
    if not user_id:
        return jsonify({"success": False, "error": "Not logged in."}), 401

    data = request.get_json(force=True)
    resume_id = data.get("id")
    title = data.get("title", "Untitled Resume")
    resume_json = json.dumps(data.get("resume_data", {})) if data.get("resume_data") else None
    resume_text = data.get("resume_text")
    ats_score = data.get("ats_score")
    category = data.get("category")

    if resume_id:
        resume = Resume.query.filter_by(id=resume_id, user_id=user_id).first()
        if not resume:
            return jsonify({"success": False, "error": "Resume not found."}), 404
        resume.title = title
        if resume_json:
            resume.resume_json = resume_json
        if resume_text:
            resume.resume_text = resume_text
        if ats_score is not None:
            resume.ats_score = ats_score
        if category:
            resume.category = category
    else:
        resume = Resume(
            user_id=user_id,
            title=title,
            resume_json=resume_json,
            resume_text=resume_text,
            ats_score=ats_score,
            category=category,
        )
        db.session.add(resume)

    db.session.commit()
    return jsonify({"success": True, "resume": resume.to_dict()})


@app.route("/api/resumes/<int:resume_id>", methods=["GET"])
def get_resume(resume_id):
    """Get a single resume by ID."""
    user_id = session.get("user_id")
    if not user_id:
        return jsonify({"success": False, "error": "Not logged in."}), 401
    resume = Resume.query.filter_by(id=resume_id, user_id=user_id).first()
    if not resume:
        return jsonify({"success": False, "error": "Resume not found."}), 404
    return jsonify({"success": True, "resume": resume.to_dict()})


@app.route("/api/resumes/<int:resume_id>", methods=["DELETE"])
def delete_resume(resume_id):
    """Delete a resume."""
    user_id = session.get("user_id")
    if not user_id:
        return jsonify({"success": False, "error": "Not logged in."}), 401
        
    resume = Resume.query.filter_by(id=resume_id, user_id=user_id).first()
    if not resume:
        return jsonify({"success": False, "error": "Resume not found."}), 404
        
    db.session.delete(resume)
    db.session.commit()
    return jsonify({"success": True})


# --- New Standalone Builder API ---
@app.route("/api/build-resume", methods=["POST"])
def api_build_resume_standalone():
    try:
        data = request.json
        from ai_integration import generate_docx_from_builder
        
        # Generate the professional DOCX file
        filename = f"Resume_{int(datetime.now().timestamp())}.docx"
        filepath = os.path.join(DOWNLOAD_FOLDER, filename)
        
        # This will use the reduced spacing and margin logic we added to ai_integration.py
        generate_docx_from_builder(data, filepath)
        
        return jsonify({
            "success": True, 
            "message": "Resume built successfully!",
            "filename": filename,
            "download_url": f"/api/download/{filename}"
        })
    except Exception as e:
        print(f"Error building resume: {e}")
        return jsonify({"success": False, "error": str(e)}), 500


# --- Serve Frontend (SPA Support) ---
@app.route("/resume-maker/app/builder/default")
def serve_builder():
    if not is_authenticated():
        return redirect("/login")

    # Serve React builder when client build exists; otherwise fall back
    # to legacy template so route never hard-404s in deployments without client/dist.
    if _client_build_ready():
        return send_from_directory(CLIENT_DIST_DIR, "index.html")
    return render_template("form.html", google_client_id=os.environ.get("GOOGLE_CLIENT_ID", ""))

@app.route("/", defaults={"path": ""})
@app.route("/<path:path>")
def serve_frontend(path):
    # Skip API routes
    if path.startswith("api/"):
        return jsonify({"error": "Not Found"}), 404
    # Serve index.html for all other frontend routes
    return send_from_directory(app.static_folder, "index.html")


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port)
