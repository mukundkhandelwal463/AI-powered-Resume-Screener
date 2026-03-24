import os
import base64
from typing import Dict, List

from flask import Flask, jsonify, request, render_template, abort, send_from_directory
from flask_cors import CORS

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
    get_gemini_full_resume_analysis,
    generate_pdf,
    generate_docx
)


BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATASET_PATH = os.path.join(BASE_DIR, "UpdatedResumeDataSet.csv")
FRONTEND_DIR = os.path.join(BASE_DIR, "..", "forntend")
TEMPLATES_DIR = os.path.join(FRONTEND_DIR, "html")

app = Flask(
    __name__,
    template_folder=TEMPLATES_DIR,
    static_folder=FRONTEND_DIR,
)
CORS(app)

service = ResumeModelService(dataset_path=DATASET_PATH)

ALLOWED_PAGES = {
    "home",
    "upload",
    "result",
    "maker_options",
    "chatbot",
    "form",
    "blanks",
    "jobs",
}


@app.get("/")
def home_page():
    return render_template("home.html")


@app.get("/<string:page>")
def serve_page(page: str):
    # Only serve known frontend pages and block unknown paths.
    if page not in ALLOWED_PAGES:
        abort(404)
    return render_template(f"{page}.html")


@app.get("/<string:page>.html")
def serve_page_html(page: str):
    if page not in ALLOWED_PAGES:
        abort(404)
    return render_template(f"{page}.html")


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


@app.get("/api/health")
def health():
    return jsonify({"status": "ok"})


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
                }
            )

        if use_dataset_for_category:
            # Resume + known stream/category (or empty stream): dataset for category, Gemini for ATS tips when JD exists.
            analysis = service.analyze_resume(resume_text, job_description)
            final_category = stream_or_category or analysis.category
            merged_suggestions = list(analysis.suggestions)
            gemini_ats_feedback = get_gemini_ats_feedback(resume_text, job_description, analysis.ats_score) if job_description else None
            if gemini_ats_feedback and not gemini_ats_feedback.lower().startswith("gemini error"):
                merged_suggestions.append(gemini_ats_feedback)
            response_analysis = {
                "category": final_category,
                "ats_score": analysis.ats_score,
                "skills": analysis.resume_skills,
                "missing_keywords": analysis.missing_keywords,
                "suggestions": merged_suggestions,
                "mode": "dataset_category",
            }
        else:
            # Unknown category in dataset: Gemini-only analysis for all major outputs.
            gemini_full = get_gemini_full_resume_analysis(
                resume_text=resume_text,
                job_description=job_description,
                stream_or_category=stream_or_category,
            )
            response_analysis = {
                "category": gemini_full.get("category", stream_or_category or "General"),
                "ats_score": gemini_full.get("ats_score", 0.0),
                "skills": service.analyze_resume(resume_text or stream_or_category, "").resume_skills,
                "missing_keywords": gemini_full.get("missing_keywords", []),
                "suggestions": gemini_full.get("suggestions", []),
                "mode": "gemini_only_unknown_category",
            }

        jobs = service.recommend_jobs(resume_text or stream_or_category, top_k=5)
        gemini_career_map = get_gemini_career_strategy(resume_text or stream_or_category)

        return jsonify(
            {
                "success": True,
                "analysis": response_analysis,
                "job_recommendations": jobs,
                "gemini_ats_feedback": None,
                "gemini_career_map": gemini_career_map
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
        template_choice = payload.get("template_choice", "Classic ATS")
        
        if not isinstance(answers, dict) or not answers:
            raise ValueError("answers must be a non-empty object")
            
        data = {
            "name": answers.get("full_name", "Candidate"),
            "email": answers.get("email", ""),
            "phone": answers.get("phone", ""),
            "linkedin": answers.get("location", ""),
            "summary": answers.get("summary", ""),
            "skills": answers.get("skills", ""),
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
            "pdf_b64": pdf_b64,
            "docx_b64": docx_b64
        })
    except Exception as exc:
        return jsonify({"success": False, "error": str(exc)}), 400


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
