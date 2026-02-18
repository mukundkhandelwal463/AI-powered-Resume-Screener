🤖 AI Resume Analyzer, Builder & Job Recommendation Platform

An end-to-end AI powered career assistant that helps users create resumes, analyze ATS score, detect missing skills, and get job recommendations — while also helping recruiters automatically screen candidates.

🚀 Features
👤 For Candidates

AI Chatbot Resume Builder (step-by-step Q&A)

Multiple professional resume templates

Download resume (PDF / DOCX / TXT)

ATS Compatibility Score

Skill Gap Detection

Job Recommendation System

🧑‍💼 For Recruiters

Upload multiple resumes

Automatic candidate ranking

Best match detection

Resume classification by job category

🧠 How It Works
User → AI Chatbot → Resume Generated
         ↓
     Resume Analyzer (NLP)
         ↓
 ATS Score + Missing Skills
         ↓
 Job Recommendation Engine

🏗️ System Architecture
Frontend (HTML/CSS/JS)
        ↓
Flask Backend APIs
        ↓
NLP Processing (spaCy)
        ↓
ML Models (Scikit-learn)
        ↓
Database (MongoDB/MySQL)

🛠️ Tech Stack
Frontend

HTML

CSS

JavaScript

Backend

Python

Flask

Machine Learning / NLP

spaCy

Scikit-learn

TF-IDF Vectorizer

Cosine Similarity

SVM / Naive Bayes Classifier

File Processing

pdfplumber

python-docx

PyPDF2

Database

MongoDB / MySQL

Deployment (Optional)

Docker

AWS

📂 Project Structure
AI-Resume-Platform/
│
├── frontend/
│   ├── index.html
│   ├── chatbot.html
│   ├── upload.html
│   └── css/
│
├── backend/
│   ├── app.py
│   ├── utils.py
│   ├── models/
│   └── uploads/
│
├── ml_model/
│   ├── clf.pkl
│   ├── tfidf.pkl
│   └── encoder.pkl
│
└── README.md

⚙️ Installation
1️⃣ Clone Repository
git clone https://github.com/yourusername/ai-resume-platform.git
cd ai-resume-platform

2️⃣ Install Dependencies
pip install -r requirements.txt

3️⃣ Download spaCy Model
python -m spacy download en_core_web_sm

4️⃣ Run Backend Server
python backend/app.py

5️⃣ Open Frontend

Open frontend/index.html in browser

📊 Example Output

Resume Category: Data Scientist

ATS Score: 82%

Missing Skills: Docker, TensorFlow

Recommended Jobs: ML Engineer, Data Analyst

🎯 Applications

Job seekers

College placement portals

HR automation systems

Career guidance platforms

🔮 Future Improvements

BERT based deep resume understanding

Voice chatbot interaction

Interview question generator

LinkedIn profile integration

🧑‍💻 Author

Your Name
AI/ML Developer

📜 License

This project is for educational and research purposes.

⭐ If you like this project, consider giving it a star!
