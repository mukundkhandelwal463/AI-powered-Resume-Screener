import streamlit as st
import PyPDF2
import google.generativeai as genai
import pandas as pd
from model1 import ResumeModelService

# Page Setup
st.set_page_config(page_title="Job Recommendations (Model 4)", page_icon="💼", layout="wide")

# Load model1 service (includes the job recommendation logic and catalog)
@st.cache_resource
def load_job_recommender():
    # Model 1 already has a 'recommend_jobs' function that scores against a local database
    return ResumeModelService(dataset_path="UpdatedResumeDataSet.csv")

def extract_text_from_pdf(uploaded_file):
    try:
        pdf_reader = PyPDF2.PdfReader(uploaded_file)
        text = ""
        for page in pdf_reader.pages:
            text += page.extract_text()
        return text
    except Exception as e:
        st.error(f"Error reading PDF: {e}")
        return ""

def get_gemini_career_strategy(api_key, resume_text):
    try:
        genai.configure(api_key=api_key)
        model = genai.GenerativeModel('gemini-1.5-flash')
        prompt = f"""
        You are an elite Career Coach and Tech Recruiter.
        Based on the following resume text, please provide a highly personalized Job Recommendation Report.
        
        Resume text:
        {resume_text}
        
        Your report must include:
        1. Top 5 Exact Job Titles they should be searching for on LinkedIn / Indeed.
        2. Top 3 Industries or Niches they are heavily qualified for.
        3. 2 New Skills they should learn right now to bump up their salary or become a stronger candidate.
        
        Keep it structured, encouraging, and formatted in Markdown.
        """
        response = model.generate_content(prompt)
        return response.text
    except Exception as e:
        return f"Error connecting to Gemini API: {e}. Ensure your API key is correct."


st.title("Model 4: AI Job Recommendation System")
st.markdown("Upload your resume. Our system will scan your skills, **match you to internal open positions**, and consult **Gemini AI** to build a personalized career and job-search strategy!")

with st.sidebar:
    st.header("Settings")
    gemini_api_key = st.text_input("Gemini API Key", type="password", help="Required for personalized AI career coaching.")
    st.info("This Job Recommendation engine relies on both local pattern matching (Model 1) and advanced AI reasoning (Gemini).")

service = load_job_recommender()

uploaded_file = st.file_uploader("Upload your resume (PDF)", type=['pdf'])

if st.button("Get Job Recommendations", use_container_width=True):
    if not uploaded_file:
        st.warning("Please upload a resume first.")
    else:
        with st.spinner("Scanning resume and consulting the job database..."):
            resume_text = extract_text_from_pdf(uploaded_file)
            
            if not resume_text.strip():
                st.error("No text could be extracted. Please try a different PDF.")
            else:
                # 1. Local Job Matching (Using logic originally from model1.py)
                matched_jobs = service.recommend_jobs(resume_text, top_k=5)
                
                st.markdown("---")
                st.header("🏢 Live Job Matches (Arbeitnow)")
                st.markdown("These are the live open positions pulled directly from Arbeitnow that align closest with your detected skills.")
                
                if matched_jobs:
                    # Convert matching dictionary to a stylish dataframe presentation
                    for job in matched_jobs:
                        score_color = "green" if job['score'] >= 70 else "orange" if job['score'] >= 40 else "red"
                        with st.expander(f"{job['title']} at {job['company']} - Match: {job['score']}%", expanded=(job['score'] > 50)):
                            st.write(f"**Location:** {job.get('location', 'Remote')}")
                            st.write(f"**Matched Skills:** {', '.join(job['matched_skills']) if job['matched_skills'] else 'None'}")
                            st.write(f"**Missing Skills to Learn:** {', '.join(job['missing_skills']) if job['missing_skills'] else 'None'}")
                            if job.get('url') and job.get('url') != '#':
                                st.markdown(f"**[Apply Here (View on Arbeitnow)]({job['url']})**")
                else:
                    st.info("No strong live job matches found today. You might have a highly specialized skill set!")

                # 2. Gemini AI Career Coaching
                st.markdown("---")
                st.header("🤖 AI Career & Job-Search Strategy")
                
                if not gemini_api_key:
                    st.warning("Enter your Gemini API Key in the sidebar to unlock personalized career mapping, best job titles to search, and upskilling advice!")
                else:
                    with st.spinner("Gemini is building your career map..."):
                        ai_report = get_gemini_career_strategy(gemini_api_key, resume_text)
                        
                        st.markdown(ai_report)
