# 🌌 Aether AI • Next-Generation Multimodal Voice & Text Chatbot

A state-of-the-art AI Assistant built with **FastAPI**, **Google Gemini**, **Web Speech Recognition**, **Audio Visualizers**, and a modern **Glassmorphism UI/UX Design System**.

---

## ✨ Key Features & Capabilities

### 🎙️ Real-time Multimodal Voice Engine
* **Hands-Free Speech-to-Text (STT)**: Speak directly into your microphone with live interim transcription and automatic auto-submit.
* **Realistic Text-to-Speech (TTS)**: Dual voice engine with zero-latency browser speech synthesis or high-fidelity server-side neural MP3 generation via `gTTS`.
* **Animated AI Voice Orb & Waveform Visualizer**: Real-time canvas audio visualizer that pulses synchronously when you speak or when the AI replies.
* **Floating Audio Player**: Floating control dock with Play, Pause, Resume, and Stop controls.

### 🎭 Specialized AI Personas
* 🔬 **Nova • Science Explorer**: Explains astrophysics, quantum mechanics, biology, and chemistry using intuitive analogies, experiments, and KaTeX math formulas.
* 💻 **Nexus • Code Architect**: Senior software engineering mentor providing production-grade code snippets, architecture breakdowns, and 1-click copy blocks.
* ✍️ **Aria • Creative Muse**: Immersive world-builder, scriptwriter, and poet for storytelling and creative brainstorming.
* ⚡ **Aether • Universal Genius**: Razor-sharp strategic reasoning, first-principles analysis, and comprehensive knowledge.

### 🎨 Glassmorphism & Cyberpunk Design System
* **5 Dynamic Themes**: Dark Neon (Cyan/Indigo), Cyberpunk (Pink/Purple), Aurora (Emerald/Teal), Sunset (Amber/Orange), and Clean Light.
* **Ambient Lighting & Micro-Interactions**: Translucent frosted panels with `backdrop-filter`, glowing accents, smooth hover transitions, and keyboard shortcuts (`Alt+N` for New Chat, `Enter` to Send).
* **Rich Markdown Formatting**: Formatted headings, tables, blockquotes, bullet points, and KaTeX mathematical formulas ($E=mc^2$).
* **Syntax-Highlighted Code Blocks**: Highlighted with `highlight.js`, complete with language tags and 1-click clipboard copy.

### 💾 Session & Persistence
* **Multi-Chat History**: Save and organize conversation threads in LocalStorage.
* **Export Options**: Export entire chat transcripts to Markdown (`.md`) with a single click.
* **Custom Configuration**: In-app settings for Google Gemini API keys, model switching (`Gemini 1.5 Flash`, `1.5 Pro`, `2.0 Flash`), temperature, speech rate, and speech pitch.

---

## 🚀 Quick Start Guide

### 1. Install Dependencies
Make sure you have Python 3.10+ installed. Install the required packages:
```bash
pip install -r requirements.txt
```

### 2. Configure Gemini API Key
Create a `.env` file in the project root with your free Google Gemini API key
([get one from Google AI Studio](https://aistudio.google.com/app/apikey)):
```env
API_KEY=your_gemini_api_key_here
```
*(You can also paste the key directly in the web UI via **⚙️ Settings**.)*

---

### Entry Points

There are **two ways** to run this project — pick one:

#### 🌐 Web App (recommended)
Starts the full FastAPI server with the Glassmorphism UI, voice visualizer, multi-persona chat, and TTS:
```bash
python app.py
```
or equivalently:
```bash
uvicorn app:app --host 127.0.0.1 --port 8000 --reload
```
Then open **http://127.0.0.1:8000** in your browser.

#### 🖥️ CLI Demo (terminal-only)
A minimal terminal-based chat with text-to-speech via pygame. Useful for quick testing without a browser:
```bash
python cli_demo.py
```
> **Note:** `cli_demo.py` requires `pygame` (included in `requirements.txt`). It uses `API_KEY` / `GEMINI_API_KEY` from your `.env` — no UI settings panel.

---

## 🛠️ Tech Stack
* **Backend**: Python 3, FastAPI, Uvicorn, Google Generative AI SDK, gTTS, Pydantic
* **Frontend**: HTML5 Semantic Architecture, Modern Vanilla JavaScript (ES6+), CSS3 Variables & Glassmorphism
* **Libraries & CDNs**: Marked.js (Markdown), Highlight.js (Code Syntax), KaTeX (Math), FontAwesome 6 (Icons), Canvas-Confetti
