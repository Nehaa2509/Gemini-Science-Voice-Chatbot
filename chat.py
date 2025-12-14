import os
import sys
import time
import re
import random
import tempfile

from dotenv import load_dotenv
import google.generativeai as genai
from gtts import gTTS
import pygame

# Load .env (if present)
load_dotenv()

# Read API key from a simple env var name
API_KEY = os.getenv("API_KEY")
if not API_KEY:
    print("ERROR: API key not found. Set API_KEY or GEMINI_API_KEY in your environment or .env file.")
    sys.exit(1)

# Configure SDK
genai.configure(api_key=API_KEY)
with open(".env", "rb") as f:
    for i, line in enumerate(f, 1):
        print(i, repr(line))
# Initialize audio (pygame)
try:
    pygame.mixer.init()
except Exception as e:
    print("WARNING: pygame mixer init failed:", e)
    # continue — text-to-speech will attempt, but may fail

def text_to_speech(text: str, lang: str = "en"):
    """Convert text to speech, play it, then remove temp file."""
    tmp = None
    try:
        with tempfile.NamedTemporaryFile(suffix=".mp3", delete=False) as fp:
            tmp = fp.name
        tts = gTTS(text=text, lang=lang)
        tts.save(tmp)

        pygame.mixer.music.load(tmp)
        pygame.mixer.music.play()
        while pygame.mixer.music.get_busy():
            time.sleep(0.1)
        pygame.mixer.music.stop()
    except Exception as e:
        print(f"(Audio Error: {e})")
    finally:
        if tmp and os.path.exists(tmp):
            try:
                os.remove(tmp)
            except Exception:
                pass

# Create model + chat session (use chat_session for conversation)
system_instruction = (
    "You are an expert science teacher for kids. "
    "Explain concepts simply using fun examples, humor, "
    "real-world observations, and simple experiments. "
    "Ask follow-up questions to keep learning interactive."
)

model = genai.GenerativeModel(
    model_name="gemini-1.5-flash",
    # you can also set generation_config and safety_settings here if desired
)

# Provide the system instruction as initial history so it persists
chat_session = model.start_chat(history=[{"role": "system", "parts": [system_instruction]}])

def send_with_retries(chat_session, user_input, max_attempts=5):
    attempt = 0
    while attempt < max_attempts:
        attempt += 1
        try:
            return chat_session.send_message(user_input)
        except Exception as e:
            text = str(e)
            # If API provided a retry hint "Please retry in XXs", honor it
            m = re.search(r"retry in ([0-9.]+)s", text, re.IGNORECASE)
            if m:
                wait = float(m.group(1))
            else:
                wait = min(2 ** attempt + random.random(), 60)
            # If quota/billing problem appears, surface advice and stop retrying
            if "quota" in text.lower() or "quota exceeded" in text.lower() or "limit: 0" in text.lower() or "429" in text:
                print("API quota/billing issue detected:", text.splitlines()[0])
                print("Check Google Cloud Console → APIs & Services → Quotas and Billing, or use a different project/key.")
                # wait once then raise to avoid tight loop
                time.sleep(wait)
                raise
            if attempt >= max_attempts:
                raise
            print(f"Request failed (attempt {attempt}/{max_attempts}), sleeping {wait:.1f}s before retry...")
            time.sleep(wait)

# Greeting and loop
print("--------------------------------------------------")
print("🤖 Gemini Science Voice Bot Ready (type 'exit' or Ctrl-C)")
print("--------------------------------------------------")
greeting = "Hello! I'm ready to explore science with you. What would you like to learn?"
print("Bot:", greeting)
text_to_speech(greeting)

try:
    while True:
        user_input = input("\nYou: ").strip()
        if not user_input:
            continue
        if user_input.lower() in ("exit", "quit"):
            print("Bot: Goodbye! 👋")
            text_to_speech("Goodbye!")
            break

        try:
            response = send_with_retries(chat_session, user_input)
        except Exception as e:
            print("❌ Error sending request:", e)
            # small pause so we don't tight-loop on persistent errors
            time.sleep(5)
            continue

        # response may have .text or .output depending on SDK; prefer .text
        model_text = getattr(response, "text", None) or getattr(response, "output", None) or str(response)
        print("Bot:", model_text)
        text_to_speech(model_text)
        # small sleep to avoid immediate repeat requests
        time.sleep(1)

except KeyboardInterrupt:
    print("\nInterrupted. Exiting.")
finally:
    try:
        pygame.mixer.quit()
    except Exception:
        pass
