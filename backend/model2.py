import streamlit as st
import matplotlib.pyplot as plt
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import PyPDF2
import re
from collections import Counter
import nltk
from nltk.corpus import stopwords
from nltk.tokenize import word_tokenize
from nltk import pos_tag
import google.generativeai as genai
import os

# Import model1 to check the resume field/category
from model1 import ResumeModelService

# Setup NLTK resources
@st.cache_resource
def download_nltk_resources():
    try:
        nltk.download("punkt", quietly=True)
        nltk.download("punkt_tab", quietly=True)
        nltk.download("stopwords", quietly=True)
        nltk.download("averaged_perceptron_tagger_eng", quietly=True)
    except Exception:
        pass

download_nltk_resources()

# Load model1 service globally so it's cached
@st.cache_resource
def load_category_model():
    # Assuming UpdatedResumeDataSet.csv is in the same directory
    return ResumeModelService(dataset_path="UpdatedResumeDataSet.csv")

# Page Setup
st.set_page_config(page_title="Resume Job Match Scorer", page_icon="📄", layout="wide")

st.markdown("""
Upload your resume (PDF) and paste a job description to see how well they match!  
This tool uses **Model 1** to predict your field, **TF-IDF + Cosine Similarity** to analyze the ATS score (Model 2), and **Gemini AI** to give you keyword recommendations.
""")

with st.sidebar:
    st.header("Settings")
    gemini_api_key = st.text_input("Gemini API Key", type="password", help="Enter your Gemini API Key here")
    if gemini_api_key:
        genai.configure(api_key=gemini_api_key)
        
    st.header("About")
    st.info("""
    This tool helps you:
    - Determine your resume category (Model 1)
    - Measure how your resume matches a job description (Model 2)
    - Get Gemini AI recommendations for improvements
    - Improve your resume based on missing terms
    """)
    st.header("How It works")
    st.write("""
    1. Enter your Gemini API Key above
    2. Upload your resume (PDF)
    3. Paste the job description
    4. Click **Analyze Match**
    5. Review score & AI suggestions
    """)

# Helper functions
def extract_text_from_pdf(uploaded_file):
    try:
        pdf_reader = PyPDF2.PdfReader(uploaded_file)
        text = ""
        for page in pdf_reader.pages:
            text = text + page.extract_text()
        return text
    except Exception as e:
        st.error(f"Error reading PDF: {e}")
        return ""

def clean_text(text):
    text = text.lower()
    text = re.sub(r'[^a-zA-Z\s]', '', text)
    text = re.sub(r'\s+', ' ', text).strip()
    return text

def remove_stopwords(text):
    stop_words = set(stopwords.words('english'))
    words = word_tokenize(text)
    return " ".join([word for word in words if word not in stop_words])

def calculate_similarity(resume_text, job_description):
    resume_processed = remove_stopwords(clean_text(resume_text))
    job_processed = remove_stopwords(clean_text(job_description))
    
    if not resume_processed or not job_processed:
        return 0.0, resume_processed, job_processed
        
    vectorizer = TfidfVectorizer()
    tfidf_matrix = vectorizer.fit_transform([resume_processed, job_processed])
    score = cosine_similarity(tfidf_matrix[0:1], tfidf_matrix[1:2])[0][0] * 100
    return round(score, 2), resume_processed, job_processed

def get_gemini_recommendation(resume_text, job_description, score):
    try:
        model = genai.GenerativeModel('gemini-1.5-flash')
        prompt = f"""
        You are an expert ATS (Applicant Tracking System) and career coach.
        I have a resume and a job description. The TF-IDF cosine similarity match score is {score}%.
        
        Job Description:
        {job_description}
        
        Resume:
        {resume_text}
        
        Please provide:
        1. A brief analysis of why the match score is {score}%.
        2. Key missing skills or keywords from the resume that are heavily emphasized in the job description.
        3. Actionable recommendations to improve the resume for this specific job.
        """
        response = model.generate_content(prompt)
        return response.text
    except Exception as e:
        return f"Error connecting to Gemini API: {e}. Make sure your API key is correct."

# Main app
def main():
    service = load_category_model()
    
    uploaded_file = st.file_uploader("Upload your resume (PDF)", type=['pdf'])
    job_description = st.text_area("Paste the job description", height=200)

    if st.button("Analyze Match"):
        if not uploaded_file:
            st.warning("Please upload your resume")
            return
        if not job_description:
            st.warning("Please paste the job description")
            return
        if not gemini_api_key:
            st.warning("Please configure your Gemini API Key in the sidebar.")
            return
        
        with st.spinner("Analyzing your resume and consulting Gemini AI..."):
            resume_text = extract_text_from_pdf(uploaded_file)
            if not resume_text:
                st.error("Could not extract text from pdf. Please try another pdf")
                return 
            
            # 1. Model 1 checking the field of the resume
            category = service.classify_resume(resume_text)

            # 2. Calculate similarity
            similarity_score, resume_processed, job_processed = calculate_similarity(resume_text, job_description)
            
            # 3. Get Gemini AI recommendations
            gemini_feedback = get_gemini_recommendation(resume_text, job_description, similarity_score)

            st.markdown("---")
            st.subheader("Results")
            
            # Create columns for layout
            col1, col2 = st.columns([1, 1.5])
            
            with col1:
                st.markdown(f"**Predicted Resume Field (Model 1):** `{category}`")
                
                # Gauge chart
                fig, ax = plt.subplots(figsize=(6, 0.5))
                colors = ['#ff4b4b', '#ffa726', '#0f9d58']
                color_index = min(int(similarity_score // 34), 2)
                ax.barh([0], [similarity_score], color=colors[color_index])
                ax.set_xlim(0, 100)
                ax.set_xlabel("Match percentage")
                ax.set_yticks([])
                ax.set_title(f"Resume Job Match: {similarity_score:.2f}%")
                st.pyplot(fig)

                if similarity_score < 40:
                    st.warning("Low Match, consider tailoring your resume more closely.")
                elif similarity_score < 70:
                    st.info("Good Match. Your resume aligns fairly well.")
                else:
                    st.success("Excellent Match! Your resume strongly aligns.")
            
            with col2:
                st.markdown("### Gemini AI Recommendations")
                st.info(gemini_feedback)

if __name__ == "__main__":
    main()
