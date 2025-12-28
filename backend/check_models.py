# check_models.py
import google.generativeai as genai
import os
from dotenv import load_dotenv

load_dotenv()

api_key = os.getenv("GOOGLE_API_KEY")
if not api_key:
    print("❌ Ошибка: Не найден GOOGLE_API_KEY в .env")
else:
    genai.configure(api_key=api_key)
    print("🔍 Ищу доступные модели...")
    try:
        for m in genai.list_models():
            if 'generateContent' in m.supported_generation_methods:
                print(f"✅ Доступна: {m.name}")
    except Exception as e:
        print(f"❌ Ошибка при запросе: {e}")