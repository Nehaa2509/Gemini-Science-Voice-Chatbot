import os
import sys
import io
import json
import logging
from typing import List, Optional, Dict, Any
from pathlib import Path
from dotenv import load_dotenv

if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
        sys.stderr.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass


from fastapi import FastAPI, HTTPException, Header, Request
from fastapi.responses import HTMLResponse, StreamingResponse, JSONResponse, FileResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from gtts import gTTS
import google.generativeai as genai

# Setup logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("ai_chatbot")

# Load environment variables
load_dotenv()

BASE_DIR = Path(__file__).resolve().parent
STATIC_DIR = BASE_DIR / "static"

app = FastAPI(
    title="Gemini AI Voice & Text Chatbot",
    description="Next-Generation AI Chatbot with voice visualizer, multiple personas, and rich UX.",
    version="2.0.0"
)

# CORS: restrict to local dev origins.
# SECURITY: If you deploy this publicly, replace these with your real frontend
# domain(s), e.g. ["https://yourdomain.com"]. Leaving this as ["*"] combined
# with the server-side API key fallback in get_effective_api_key() would allow
# any website to burn your Gemini quota through this backend.
ALLOWED_ORIGINS = [
    "http://127.0.0.1:8000",
    "http://localhost:8000",
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Personas definition
PERSONA_PROMPTS = {
    "science": (
        "You are 'Nova', an enthusiastic and expert Science & Discovery Mentor for learners of all ages. "
        "Explain complex scientific concepts (astronomy, biology, quantum physics, robotics, chemistry) with vivid real-world analogies, "
        "fascinating facts, and interactive thought experiments. Use markdown with clear headings, bullet points, bold key terms, and KaTeX math equations where appropriate. "
        "Keep the tone encouraging, curious, and inspiring!"
    ),
    "coder": (
        "You are 'Nexus', an elite Senior Software Architect and Coding Mentor. "
        "Provide elegant, production-grade code solutions, detailed architecture explanations, debugging tips, and best practices. "
        "Always format code inside fenced markdown blocks with explicit language tags (e.g., ```python, ```javascript, ```typescript). "
        "Highlight edge cases, time/space complexity, and clean code principles."
    ),
    "creative": (
        "You are 'Aria', a master Storyteller, World-Builder, and Creative Writing Companion. "
        "Craft captivating stories, poetic imagery, engaging dialogues, immersive roleplays, and visionary scripts. "
        "Use expressive language, rich sensory details, and nuanced pacing to bring narratives alive."
    ),
    "general": (
        "You are 'Aether', a cutting-edge, versatile AI assistant with encyclopedic knowledge, strategic reasoning, and ultra-crisp communication. "
        "Deliver clear, well-structured, insightful answers across any domain. Use markdown headings, bullet points, and tables to maximize readability."
    )
}

class ChatMessage(BaseModel):
    role: str # "user" or "model" or "assistant"
    content: str

class ChatRequest(BaseModel):
    message: str
    persona: str = "science"
    model: str = "gemini-1.5-flash"
    temperature: float = 0.7
    history: List[ChatMessage] = []
    custom_system_instruction: Optional[str] = None
    stream: bool = True

class TTSRequest(BaseModel):
    text: str
    lang: str = "en"
    speed: float = 1.0


def get_effective_api_key(client_key: Optional[str] = None) -> Optional[str]:
    """Retrieve API key from client header/request, or fall back to the server's own key.

    SECURITY NOTE: The server-key fallback means any caller who omits the
    X-Gemini-Api-Key header will silently use YOUR API key and consume YOUR
    quota. This is fine for a local personal demo, but if you expose this
    server publicly you should either:
      - Remove the fallback and require a client-supplied key on every request, OR
      - Add per-IP rate-limiting (e.g. slowapi) before deploying.
    """
    if client_key and client_key.strip():
        return client_key.strip()
    return os.getenv("API_KEY") or os.getenv("GEMINI_API_KEY")


@app.get("/api/health")
async def health_check():
    has_env_key = bool(os.getenv("API_KEY") or os.getenv("GEMINI_API_KEY"))
    return {
        "status": "online",
        "has_server_api_key": has_env_key,
        "default_model": "gemini-1.5-flash",
        "available_personas": list(PERSONA_PROMPTS.keys()),
    }


@app.get("/api/models")
async def list_models():
    return {
        "models": [
            {"id": "gemini-1.5-flash", "name": "Gemini 1.5 Flash (Fast & Responsive)", "speed": "Ultra Fast", "recommended": True},
            {"id": "gemini-1.5-pro", "name": "Gemini 1.5 Pro (Deep Reasoning)", "speed": "Balanced", "recommended": False},
            {"id": "gemini-2.0-flash-exp", "name": "Gemini 2.0 Flash (Next-Gen Preview)", "speed": "Blazing", "recommended": False}
        ],
        "personas": [
            {
                "id": "science",
                "name": "Nova - Science Explorer",
                "tagline": "Physics, Cosmos, Biology & Chemistry",
                "icon": "fa-atom",
                "badge": "Science & Tech",
                "color": "from-cyan-500 to-blue-600"
            },
            {
                "id": "coder",
                "name": "Nexus - Code Architect",
                "tagline": "Full-Stack, Algorithms & Debugging",
                "icon": "fa-code",
                "badge": "Engineering",
                "color": "from-emerald-400 to-teal-600"
            },
            {
                "id": "creative",
                "name": "Aria - Creative Muse",
                "tagline": "Storytelling, Poetry & Creative Writing",
                "icon": "fa-wand-magic-sparkles",
                "badge": "Creative",
                "color": "from-purple-500 to-pink-600"
            },
            {
                "id": "general",
                "name": "Aether - Universal Genius",
                "tagline": "Analysis, Strategy & All-Round Insights",
                "icon": "fa-brain",
                "badge": "General",
                "color": "from-amber-400 to-orange-500"
            }
        ]
    }


def generate_fallback_demo_response(message: str, persona: str) -> str:
    """Friendly interactive demo responses when API key is not yet configured."""
    persona_name = {
        "science": "Nova (Science Explorer)",
        "coder": "Nexus (Code Mentor)",
        "creative": "Aria (Storyteller)",
        "general": "Aether (Universal Genius)"
    }.get(persona, "AI Assistant")

    return f"""### 🚀 Welcome to Aether AI!

I received your prompt: **"{message}"**

> ⚠️ **Gemini API Key Needed for Live Generation**
> To connect me to live Google Gemini intelligence:
> 1. Click the **⚙️ Settings** icon in the top right.
> 2. Paste your free **Google Gemini API Key** (from [Google AI Studio](https://aistudio.google.com/app/apikey)).
> 3. Click **Save Changes** — and you are ready to chat and speak in real-time!

---

### ✨ Active Persona: **{persona_name}**

Here is a sample answer to showcase formatting and voice playback:

* **Voice Playback**: Click the 🔊 **Speak** button on any message to hear it read aloud using realistic Text-to-Speech!
* **Speech-to-Text**: Click the 🎙️ **Microphone** button below and speak naturally.
* **Code & Formatting**:
```python
# Real-time Voice AI Engine
def explore_future():
    print("Welcome to next-gen conversational AI!")
    return {{"status": "ready", "powered_by": "Gemini 1.5 Flash"}}

explore_future()
```

Feel free to add your API key or test the voice & theme features!"""



@app.post("/api/chat")
async def chat_endpoint(request: ChatRequest, req: Request, x_gemini_api_key: Optional[str] = Header(None)):
    api_key = get_effective_api_key(x_gemini_api_key)
    
    system_instruction = request.custom_system_instruction or PERSONA_PROMPTS.get(request.persona, PERSONA_PROMPTS["general"])

    # If no API key is provided, return fallback demo content
    if not api_key:
        demo_text = generate_fallback_demo_response(request.message, request.persona)
        if request.stream:
            async def demo_streamer():
                chunk_size = 15
                for i in range(0, len(demo_text), chunk_size):
                    chunk = demo_text[i:i+chunk_size]
                    payload = json.dumps({"text": chunk, "done": False})
                    yield f"data: {payload}\n\n"
                yield f"data: {json.dumps({'text': '', 'done': True})}\n\n"
            return StreamingResponse(demo_streamer(), media_type="text/event-stream")
        return {"response": demo_text, "model": request.model, "demo_mode": True}

    try:
        genai.configure(api_key=api_key)
        
        # Build contents history for Gemini
        history_contents = []
        for item in request.history[-12:]: # keep last 12 messages for context
            role = "user" if item.role == "user" else "model"
            history_contents.append({"role": role, "parts": [item.content]})

        gemini_model = genai.GenerativeModel(
            model_name=request.model,
            system_instruction=system_instruction,
            generation_config=genai.types.GenerationConfig(
                temperature=request.temperature,
                max_output_tokens=3000,
            )
        )

        chat_session = gemini_model.start_chat(history=history_contents)

        if request.stream:
            async def sse_generator():
                try:
                    response = chat_session.send_message(request.message, stream=True)
                    for chunk in response:
                        if chunk.text:
                            payload = json.dumps({"text": chunk.text, "done": False})
                            yield f"data: {payload}\n\n"
                    yield f"data: {json.dumps({'text': '', 'done': True})}\n\n"
                except Exception as e:
                    logger.error(f"Streaming error: {e}")
                    error_msg = f"\n\n❌ **API Error:** {str(e)}"
                    yield f"data: {json.dumps({'text': error_msg, 'done': True, 'error': True})}\n\n"

            return StreamingResponse(sse_generator(), media_type="text/event-stream")
        else:
            response = chat_session.send_message(request.message)
            return {"response": response.text, "model": request.model, "demo_mode": False}

    except Exception as e:
        logger.error(f"Chat generation error: {e}")
        return JSONResponse(
            status_code=500,
            content={"error": str(e), "message": "Failed to generate AI response."}
        )


@app.post("/api/tts")
async def text_to_speech_endpoint(req: TTSRequest):
    """Convert text to MP3 audio stream using gTTS with sanitized markdown filtering."""
    try:
        clean_text = req.text.strip()
        # Clean markdown code blocks and symbols for natural reading
        import re
        clean_text = re.sub(r'```[\s\S]*?```', ' Code snippet provided. ', clean_text)
        clean_text = re.sub(r'`([^`]+)`', r'\1', clean_text)
        clean_text = re.sub(r'[*#_~\[\]()>]', '', clean_text)
        clean_text = re.sub(r'\s+', ' ', clean_text).strip()
        
        if not clean_text:
            clean_text = "No readable text provided."
        
        # Limit to 500 characters for snappy TTS responses
        if len(clean_text) > 600:
            clean_text = clean_text[:600] + "..."

        fp = io.BytesIO()
        tts = gTTS(text=clean_text, lang=req.lang, slow=(req.speed < 0.9))
        tts.write_to_fp(fp)
        fp.seek(0)

        return StreamingResponse(fp, media_type="audio/mpeg", headers={
            "Content-Disposition": "inline; filename=speech.mp3"
        })
    except Exception as e:
        logger.error(f"TTS error: {e}")
        raise HTTPException(status_code=500, detail=f"TTS synthesis failed: {str(e)}")


# Serve static files and frontend
if STATIC_DIR.exists():
    app.mount("/static", StaticFiles(directory=str(STATIC_DIR)), name="static")

@app.get("/", response_class=HTMLResponse)
async def serve_index():
    index_path = STATIC_DIR / "index.html"
    if index_path.exists():
        return FileResponse(str(index_path))
    return HTMLResponse("<h1>AI Chatbot Frontend is loading...</h1>")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app:app", host="127.0.0.1", port=8000, reload=True)
