import os
from typing import Dict, List

from flask import Flask, jsonify, request
from flask_cors import CORS

from model1 import (
    CHATBOT_QUESTIONS,
    ResumeModelService,
    build_resume_from_answers,
    extract_resume_text,
)


BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATASET_PATH = os.path.join(BASE_DIR, "UpdatedResumeDataSet.csv")

app = Flask(__name__)
CORS(app)

service = ResumeModelService(dataset_path=DATASET_PATH)


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
        resume_text = _read_resume_from_request("resume")
        job_description = request.form.get("job_description", "").strip()
        analysis = service.analyze_resume(resume_text, job_description)
        jobs = service.recommend_jobs(resume_text, top_k=5)

        return jsonify(
            {
                "success": True,
                "analysis": {
                    "category": analysis.category,
                    "ats_score": analysis.ats_score,
                    "skills": analysis.resume_skills,
                    "missing_keywords": analysis.missing_keywords,
                    "suggestions": analysis.suggestions,
                },
                "job_recommendations": jobs,
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
        return jsonify({"success": True, "jobs": jobs})
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
        if not isinstance(answers, dict) or not answers:
            raise ValueError("answers must be a non-empty object")
        resume_text = build_resume_from_answers(answers)
        jobs = service.recommend_jobs(resume_text, top_k=3)
        return jsonify({"success": True, "resume_text": resume_text, "job_recommendations": jobs})
    except Exception as exc:
        return jsonify({"success": False, "error": str(exc)}), 400


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
