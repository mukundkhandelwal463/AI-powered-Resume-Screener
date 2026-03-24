import os
from dotenv import load_dotenv
import google.generativeai as genai

load_dotenv()
sys_key = os.getenv("GEMINI_API_KEY")

if sys_key and "your_gemini" not in sys_key:
    genai.configure(api_key=sys_key)
    model = genai.GenerativeModel('gemini-1.5-flash')
    try:
        resp = model.generate_content("Respond with exactly 'Test Passed' if you can read this.")
        print("SUCCESS! Output:", resp.text)
    except Exception as e:
        print("API ERROR:", e)
else:
    print("No Key Loaded!")
