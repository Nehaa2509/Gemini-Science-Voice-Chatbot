import google.generativeai as genai
import os
import time
import pygame
from gtts import gTTS

# --- 1. CONFIGURE API ---
genai.configure(api_key=os.getenv("ENTER YOUR GEMINI API KEY"))

# --- 2. AUDIO SETUP (INIT ONCE) ---
pygame.mixer.init()

def text_to_speech(text):
    
    try:
        filename = "bot_voice.mp3"

        tts = gTTS(text=text, lang='en')
        tts.save(filename)

        pygame.mixer.music.load(filename)
        pygame.mixer.music.play()

        while pygame.mixer.music.get_busy():
            time.sleep(0.1)

        pygame.mixer.music.stop()
        pygame.mixer.music.unload()

        time.sleep(0.2)  # allow OS to release file
        os.remove(filename)

    except Exception as e:
        print(f"(Audio Error: {e})")

    

# --- 3. MODEL SETUP ---
model = genai.GenerativeModel(
    model_name="gemini-1.5-flash",
    system_instruction=(
        "You are an expert science teacher for kids. "
        "Explain concepts simply using fun examples, humor, "
        "real-world observations, and simple experiments. "
        "Ask follow-up questions to keep learning interactive."
    )
)

chat_session = model.start_chat(history=[])

print("--------------------------------------------------")
print("🤖 Gemini Science Voice Bot Ready (type 'exit')")
print("--------------------------------------------------")

greeting = "Hello! I'm ready to explore science with you. What would you like to learn?"
print("Bot:", greeting)
text_to_speech(greeting)

# --- 4. CHAT LOOP ---
while True:
    user_input = input("\nYou: ")

    if user_input.lower() in ["exit", "quit"]:
        print("Bot: Goodbye! 👋")
        break

    try:
        response = model.generate_content(user_input)
        print("Bot:", response.text)
        text_to_speech(response.text)
        time.sleep(2)   # IMPORTANT

    except Exception as e:
        error_msg = str(e)

        if "429" in error_msg or "quota" in error_msg.lower():
            print("⏳ Free-tier limit hit. Waiting 30 seconds...")
            time.sleep(30)
        else:
            print("❌ Error:", error_msg)
            time.sleep(5)


        
