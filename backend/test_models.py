import os
from dotenv import load_dotenv
import google.generativeai as genai

load_dotenv()
sys_key = os.getenv("GEMINI_API_KEY")
genai.configure(api_key=sys_key)

try:
    models = list(genai.list_models())
    for m in models:
        if 'generateContent' in m.supported_generation_methods:
            print("AVAILABLE MODEL:", m.name)
except Exception as e:
    print("API ERROR:", e)
