/**
 * MIMI • Client Application Core
 * Voice Recognition, Audio Visualizer, Markdown Engine, Chat Persistence, and Settings
 */

// ================= State Management =================
const AppState = {
  activePersona: "science",
  activeChatId: null,
  chats: {}, // { id: { id, title, persona, messages: [], createdAt } }
  apiKey: localStorage.getItem("aether_gemini_api_key") || "",
  model: ["gemini-3.7-flash", "gemini-3.6-flash"].includes(localStorage.getItem("aether_gemini_model"))
    ? localStorage.getItem("aether_gemini_model")
    : "gemini-3.7-flash",
  temperature: parseFloat(localStorage.getItem("aether_temperature") || "0.7"),
  ttsEngine: localStorage.getItem("aether_tts_engine") || "browser",
  voiceRate: parseFloat(localStorage.getItem("aether_voice_rate") || "1.0"),
  voicePitch: parseFloat(localStorage.getItem("aether_voice_pitch") || "1.0"),
  autoVoice: localStorage.getItem("aether_auto_voice") !== "false", // default true
  theme: localStorage.getItem("aether_theme") || "claude-dark",
  customPrompt: localStorage.getItem("aether_custom_prompt") || "",
  isStreaming: false,
  isRecording: false,
  isPlayingAudio: false,
  currentAudioObject: null,
  currentUtterance: null,
  lastUserPrompt: "", // stored for retry-on-error
};

// Persona Configurations
const PERSONAS = {
  science: {
    id: "science",
    name: "Nova • Science Explorer",
    shortName: "Nova",
    tagline: "Exploring Physics, Cosmos, Biology & Chemistry",
    icon: "fa-atom",
    colorClass: "from-cyan-500 to-blue-600",
    avatarIcon: "fa-atom",
    starters: [
      { title: "Quantum Entanglement", desc: "Explain how entangled particles communicate faster than light.", prompt: "Explain quantum entanglement in simple terms with a mind-blowing real-world thought experiment." },
      { title: "The James Webb Telescope", desc: "How does JWST see back to the birth of early galaxies?", prompt: "How does the James Webb Space Telescope use infrared light to see the earliest galaxies in the universe?" },
      { title: "Crispr & Gene Editing", desc: "How molecular scissors edit DNA sequences.", prompt: "How does CRISPR Cas-9 work as a molecular tool for gene editing, and what are its future possibilities?" },
      { title: "Black Hole Thermodynamics", desc: "Hawking radiation and event horizons explained.", prompt: "What is Hawking radiation and how can black holes slowly evaporate over billions of years?" }
    ]
  },
  coder: {
    id: "coder",
    name: "Nexus • Code Architect",
    shortName: "Nexus",
    tagline: "Full-Stack, Algorithms & System Architecture",
    icon: "fa-code",
    colorClass: "from-emerald-400 to-teal-600",
    avatarIcon: "fa-code",
    starters: [
      { title: "Async FastAPI WebSocket", desc: "Build a high-performance real-time chat server.", prompt: "Show me a clean, modular Python FastAPI implementation of a real-time WebSocket chat endpoint with connection management." },
      { title: "Modern CSS Glassmorphism", desc: "CSS tokens & backdrop blur design system.", prompt: "Write modern CSS tokens for a frosted glassmorphism card component with glowing border hover animations." },
      { title: "React 19 Server Actions", desc: "Best practices for asynchronous mutations.", prompt: "Explain React 19 Server Actions with a complete code example showing form submission and optimistic updates." },
      { title: "Clean Architecture in Python", desc: "Domain-Driven Design and Dependency Injection.", prompt: "Explain how to structure a clean hexagonal architecture in Python with repository patterns and domain models." }
    ]
  },
  creative: {
    id: "creative",
    name: "Aria • Creative Muse",
    shortName: "Aria",
    tagline: "Storytelling, Poetry, Roleplay & World-Building",
    icon: "fa-wand-magic-sparkles",
    colorClass: "from-purple-500 to-pink-600",
    avatarIcon: "fa-wand-magic-sparkles",
    starters: [
      { title: "Cyberpunk Cyber-Noir Story", desc: "Rain-soaked neon streets and mysterious rogue AIs.", prompt: "Write an atmospheric cyberpunk story opening set in Neo-Kyoto 2142 about a detective uncovering sentient AI art." },
      { title: "Epic Sci-Fi Worldbuilding", desc: "A planet where civilization lives inside gas giant rings.", prompt: "Design a unique sci-fi civilization that lives in the temperate floating cloud layer of a ringed gas giant." },
      { title: "Philosophical Dialogue", desc: "A conversation between an ancient philosopher & an AI.", prompt: "Write a deep, witty philosophical dialogue between Socrates and an Artificial Superintelligence about the nature of consciousness." },
      { title: "Cosmic Poem", desc: "A lyrical ode to supernovae and stellar nurseries.", prompt: "Compose a stirring lyrical poem celebrating the birth of stars from ancient cosmic dust." }
    ]
  },
  general: {
    id: "general",
    name: "Aether • Universal Genius",
    shortName: "Aether",
    tagline: "Analysis, Strategy & All-Round Insights",
    icon: "fa-brain",
    colorClass: "from-amber-400 to-orange-500",
    avatarIcon: "fa-brain",
    starters: [
      { title: "First-Principles Thinking", desc: "Deconstruct complex problems like Elon Musk and Feynman.", prompt: "Teach me how to apply first-principles reasoning to solve complex engineering and business challenges." },
      { title: "Executive Decision Matrix", desc: "Frameworks for prioritizing high-impact initiatives.", prompt: "Give me an actionable executive framework with a decision matrix for choosing between two high-stakes strategy options." },
      { title: "Cognitive Biases Guide", desc: "Overcoming hidden psychological traps.", prompt: "Summarize the 5 most deceptive cognitive biases that distort human decisions, with examples of how to counter them." },
      { title: "Speed Learning Protocol", desc: "Techniques to master any new skill in 20 hours.", prompt: "Outline a step-by-step 20-hour accelerated learning protocol to acquire a new complex skill rapidly." }
    ]
  }
};

// ================= DOM Elements =================
const elements = {
  app: document.getElementById("app"),
  sidebar: document.getElementById("sidebar"),
  sidebarToggleBtn: document.getElementById("sidebarToggleBtn"),
  sidebarCloseBtn: document.getElementById("sidebarCloseBtn"),
  newChatBtn: document.getElementById("newChatBtn"),
  personaList: document.getElementById("personaList"),
  chatHistoryList: document.getElementById("chatHistoryList"),
  clearHistoryBtn: document.getElementById("clearHistoryBtn"),
  apiStatusCard: document.getElementById("apiStatusCard"),
  apiStatusText: document.getElementById("apiStatusText"),
  apiStatusSub: document.getElementById("apiStatusSub"),
  quickKeyBtn: document.getElementById("quickKeyBtn"),
  openSettingsBtn: document.getElementById("openSettingsBtn"),
  themePickerBtn: document.getElementById("themePickerBtn"),
  headerPersonaAvatar: document.getElementById("headerPersonaAvatar"),
  headerPersonaTitle: document.getElementById("headerPersonaTitle"),
  headerPersonaTagline: document.getElementById("headerPersonaTagline"),
  headerModelPill: document.getElementById("headerModelPill"),
  visualizerCanvas: document.getElementById("visualizerCanvas"),
  speakingPulseRing: document.getElementById("speakingPulseRing"),
  ttsToggleBtn: document.getElementById("ttsToggleBtn"),
  ttsToggleIcon: document.getElementById("ttsToggleIcon"),
  ttsToggleLabel: document.getElementById("ttsToggleLabel"),
  exportChatBtn: document.getElementById("exportChatBtn"),
  clearCurrentChatBtn: document.getElementById("clearCurrentChatBtn"),
  headerSettingsBtn: document.getElementById("headerSettingsBtn"),
  messagesContainer: document.getElementById("messagesContainer"),
  welcomeScreen: document.getElementById("welcomeScreen"),
  promptGrid: document.getElementById("promptGrid"),
  messagesList: document.getElementById("messagesList"),
  typingIndicator: document.getElementById("typingIndicator"),
  typingText: document.getElementById("typingText"),
  floatingAudioBar: document.getElementById("floatingAudioBar"),
  audioStatusLabel: document.getElementById("audioStatusLabel"),
  pauseResumeAudioBtn: document.getElementById("pauseResumeAudioBtn"),
  pauseResumeIcon: document.getElementById("pauseResumeIcon"),
  stopAudioBtn: document.getElementById("stopAudioBtn"),
  voiceRecordingBanner: document.getElementById("voiceRecordingBanner"),
  voiceTranscriptionText: document.getElementById("voiceTranscriptionText"),
  cancelVoiceBtn: document.getElementById("cancelVoiceBtn"),
  micBtn: document.getElementById("micBtn"),
  micBtnIcon: document.getElementById("micBtnIcon"),
  messageInput: document.getElementById("messageInput"),
  sendBtn: document.getElementById("sendBtn"),
  charCounter: document.getElementById("charCounter"),
  settingsModal: document.getElementById("settingsModal"),
  closeSettingsModalBtn: document.getElementById("closeSettingsModalBtn"),
  cancelSettingsBtn: document.getElementById("cancelSettingsBtn"),
  saveSettingsBtn: document.getElementById("saveSettingsBtn"),
  apiKeyInput: document.getElementById("apiKeyInput"),
  toggleApiKeyVis: document.getElementById("toggleApiKeyVis"),
  eyeIcon: document.getElementById("eyeIcon"),
  modelSelect: document.getElementById("modelSelect"),
  ttsEngineSelect: document.getElementById("ttsEngineSelect"),
  voiceRateSlider: document.getElementById("voiceRateSlider"),
  voiceRateVal: document.getElementById("voiceRateVal"),
  voicePitchSlider: document.getElementById("voicePitchSlider"),
  voicePitchVal: document.getElementById("voicePitchVal"),
  tempSlider: document.getElementById("tempSlider"),
  tempVal: document.getElementById("tempVal"),
  customPromptInput: document.getElementById("customPromptInput"),
  resetPromptBtn: document.getElementById("resetPromptBtn"),
  toastContainer: document.getElementById("toastContainer"),
  ttsAudioPlayer: document.getElementById("ttsAudioPlayer")
};

// ================= Speech Recognition (STT) =================
let recognition = null;
let speechRecognitionAvailable = false;

function initSpeechRecognition() {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    console.warn("Speech Recognition API not supported in this browser.");
    return;
  }
  
  recognition = new SpeechRecognition();
  recognition.continuous = false;
  recognition.interimResults = true;
  recognition.lang = "en-US";
  speechRecognitionAvailable = true;

  recognition.onstart = () => {
    AppState.isRecording = true;
    elements.micBtn.classList.add("recording");
    elements.voiceRecordingBanner.classList.remove("hidden");
    elements.voiceTranscriptionText.textContent = "Listening to your voice...";
    elements.speakingPulseRing.classList.add("active");
    startSimulatedVisualizer();
  };

  recognition.onresult = (event) => {
    let interim = "";
    let final = "";
    for (let i = event.resultIndex; i < event.results.length; ++i) {
      if (event.results[i].isFinal) {
        final += event.results[i][0].transcript;
      } else {
        interim += event.results[i][0].transcript;
      }
    }
    const currentText = final || interim;
    if (currentText) {
      elements.voiceTranscriptionText.textContent = `"${currentText}"`;
      elements.messageInput.value = currentText;
      updateCharCounter();
      autoResizeTextarea();
    }
  };

  recognition.onerror = (event) => {
    console.error("Speech Recognition Error:", event.error);
    stopRecording();
    if (event.error !== "no-speech" && event.error !== "aborted") {
      showToast(`Microphone error: ${event.error}`, "fa-triangle-exclamation");
    }
  };

  recognition.onend = () => {
    stopRecording();
    const transcribedText = elements.messageInput.value.trim();
    if (transcribedText) {
      // Automatically send message after voice input for hands-free mode
      handleSendMessage();
    }
  };
}

function startRecording() {
  if (!speechRecognitionAvailable) {
    showToast("Speech recognition is not supported in your browser (try Chrome/Edge).", "fa-circle-exclamation");
    return;
  }
  try {
    // Stop any ongoing TTS audio
    stopAllAudio();
    recognition.start();
  } catch (e) {
    console.warn("Recognition already active:", e);
  }
}

function stopRecording() {
  AppState.isRecording = false;
  elements.micBtn.classList.remove("recording");
  elements.voiceRecordingBanner.classList.add("hidden");
  elements.speakingPulseRing.classList.remove("active");
  stopSimulatedVisualizer();
  if (recognition) {
    try { recognition.stop(); } catch(e){}
  }
}

// ================= Audio Visualizer Canvas =================
let visualizerAnimFrame = null;
let isVisualizerRunning = false;

function initVisualizerCanvas() {
  const canvas = elements.visualizerCanvas;
  const ctx = canvas.getContext("2d");
  drawIdleVisualizer(ctx, canvas.width, canvas.height);
}

function drawIdleVisualizer(ctx, width, height) {
  ctx.clearRect(0, 0, width, height);
  const bars = 18;
  const barWidth = 4;
  const gap = (width - (bars * barWidth)) / (bars - 1);
  const centerY = height / 2;

  for (let i = 0; i < bars; i++) {
    const x = i * (barWidth + gap);
    const barHeight = 4;
    ctx.fillStyle = "rgba(56, 189, 248, 0.35)";
    ctx.beginPath();
    ctx.roundRect(x, centerY - barHeight/2, barWidth, barHeight, 2);
    ctx.fill();
  }
}

function startSimulatedVisualizer() {
  if (isVisualizerRunning) return;
  isVisualizerRunning = true;
  const canvas = elements.visualizerCanvas;
  const ctx = canvas.getContext("2d");
  const bars = 18;
  const barWidth = 4;
  const gap = (canvas.width - (bars * barWidth)) / (bars - 1);
  const centerY = canvas.height / 2;

  function render(time) {
    if (!isVisualizerRunning) {
      drawIdleVisualizer(ctx, canvas.width, canvas.height);
      return;
    }
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (let i = 0; i < bars; i++) {
      const x = i * (barWidth + gap);
      const wave = Math.sin((time / 150) + (i * 0.45));
      const randomNoise = Math.sin((time / 90) + i) * 0.3;
      const magnitude = Math.max(0.15, Math.abs(wave + randomNoise));
      const barHeight = Math.min(canvas.height - 4, magnitude * (canvas.height - 6) + 4);

      const grad = ctx.createLinearGradient(0, centerY - barHeight/2, 0, centerY + barHeight/2);
      grad.addColorStop(0, "#38bdf8");
      grad.addColorStop(1, "#818cf8");

      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.roundRect(x, centerY - barHeight/2, barWidth, barHeight, 2);
      ctx.fill();
    }
    visualizerAnimFrame = requestAnimationFrame(render);
  }
  visualizerAnimFrame = requestAnimationFrame(render);
}

function stopSimulatedVisualizer() {
  isVisualizerRunning = false;
  if (visualizerAnimFrame) {
    cancelAnimationFrame(visualizerAnimFrame);
    visualizerAnimFrame = null;
  }
  const canvas = elements.visualizerCanvas;
  const ctx = canvas.getContext("2d");
  drawIdleVisualizer(ctx, canvas.width, canvas.height);
}

// ================= Thinking State =================
const _THINKING_MSGS = [
  "{name} is thinking...",
  "{name} is synthesizing...",
  "{name} is crafting a response...",
  "{name} is analysing your question...",
];

function showThinkingState() {
  const p = PERSONAS[AppState.activePersona] || PERSONAS.general;
  // Update avatar icon to match active persona
  const avatarIcon = document.getElementById("typingAvatarIcon");
  if (avatarIcon) avatarIcon.className = `fa-solid ${p.icon}`;
  // Randomise thinking text
  const tmpl = _THINKING_MSGS[Math.floor(Math.random() * _THINKING_MSGS.length)];
  elements.typingText.textContent = tmpl.replace("{name}", p.shortName);
  elements.typingIndicator.classList.remove("hidden");
  startSimulatedVisualizer();
  elements.speakingPulseRing.classList.add("active");
}

function hideThinkingState() {
  elements.typingIndicator.classList.add("hidden");
  stopSimulatedVisualizer();
  elements.speakingPulseRing.classList.remove("active");
}

// ================= Text-to-Speech (TTS) =================
function speakText(text, onEndCallback) {
  stopAllAudio();
  if (!text || !text.trim()) return;

  // Sanitize text: strip markdown code blocks and raw symbols
  let cleanText = text
    .replace(/```[\s\S]*?```/g, " Code block provided. ")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/[*#_~\[\]()><$]/g, "")
    .replace(/\s+/g, " ")
    .trim();

  if (cleanText.length > 500) {
    cleanText = cleanText.substring(0, 500) + "...";
  }

  showFloatingAudioBar();
  startSimulatedVisualizer();
  elements.speakingPulseRing.classList.add("active");
  AppState.isPlayingAudio = true;

  if (AppState.ttsEngine === "gtts") {
    // Backend Neural MP3 Audio
    fetch("/api/tts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: cleanText, speed: AppState.voiceRate })
    })
    .then(res => {
      if (!res.ok) throw new Error("TTS generation failed");
      return res.blob();
    })
    .then(blob => {
      const audioUrl = URL.createObjectURL(blob);
      const audio = elements.ttsAudioPlayer;
      audio.src = audioUrl;
      audio.playbackRate = AppState.voiceRate;
      AppState.currentAudioObject = audio;

      audio.onended = () => {
        stopAllAudio();
        if (onEndCallback) onEndCallback();
      };
      audio.onerror = () => {
        stopAllAudio();
        fallbackBrowserSpeak(cleanText, onEndCallback);
      };
      audio.play();
    })
    .catch(err => {
      console.warn("gTTS failed, falling back to browser speech:", err);
      fallbackBrowserSpeak(cleanText, onEndCallback);
    });
  } else {
    // Native Web Speech API
    fallbackBrowserSpeak(cleanText, onEndCallback);
  }
}

function fallbackBrowserSpeak(cleanText, onEndCallback) {
  if (!window.speechSynthesis) {
    stopAllAudio();
    return;
  }

  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(cleanText);
  utterance.rate = AppState.voiceRate;
  utterance.pitch = AppState.voicePitch;

  // Try selecting an English natural voice
  const voices = window.speechSynthesis.getVoices();
  const englishVoice = voices.find(v => v.lang.startsWith("en") && (v.name.includes("Natural") || v.name.includes("Google") || v.name.includes("Samantha") || v.name.includes("Zira"))) || voices.find(v => v.lang.startsWith("en"));
  if (englishVoice) {
    utterance.voice = englishVoice;
  }

  utterance.onend = () => {
    stopAllAudio();
    if (onEndCallback) onEndCallback();
  };

  utterance.onerror = () => {
    stopAllAudio();
  };

  AppState.currentUtterance = utterance;
  window.speechSynthesis.speak(utterance);
}

function stopAllAudio() {
  AppState.isPlayingAudio = false;
  if (window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }
  if (AppState.currentAudioObject) {
    AppState.currentAudioObject.pause();
    AppState.currentAudioObject.currentTime = 0;
  }
  elements.floatingAudioBar.classList.add("hidden");
  elements.speakingPulseRing.classList.remove("active");
  stopSimulatedVisualizer();

  // Remove speaking glow from any message buttons
  document.querySelectorAll(".msg-action-btn.speaking").forEach(b => b.classList.remove("speaking"));
}

function showFloatingAudioBar() {
  elements.floatingAudioBar.classList.remove("hidden");
  elements.pauseResumeIcon.className = "fa-solid fa-pause";
}

// ================= Markdown & Syntax Rendering =================
marked.setOptions({
  breaks: true,
  gfm: true,
  highlight: function(code, lang) {
    const language = hljs.getLanguage(lang) ? lang : 'plaintext';
    return hljs.highlight(code, { language }).value;
  }
});

function renderMarkdown(rawText) {
  try {
    let parsed = marked.parse(rawText || "");
    
    // Add custom code snippet header with copy button
    parsed = parsed.replace(/<pre><code class="language-([^"]+)">([\s\S]*?)<\/code><\/pre>/g, (match, lang, code) => {
      return `
        <pre><div class="code-header"><span><i class="fa-solid fa-terminal"></i> ${lang.toUpperCase()}</span><button class="code-copy-btn" onclick="copyCodeFromBlock(this)"><i class="fa-regular fa-copy"></i> Copy</button></div><code class="language-${lang}">${code}</code></pre>
      `;
    });

    return parsed;
  } catch (e) {
    return rawText;
  }
}

function renderMathInElement(container) {
  if (window.renderMathInElement && container) {
    try {
      window.renderMathInElement(container, {
        delimiters: [
          { left: "$$", right: "$$", display: true },
          { left: "$", right: "$", display: false },
          { left: "\\(", right: "\\)", display: false },
          { left: "\\[", right: "\\]", display: true }
        ],
        throwOnError: false
      });
    } catch (err) {
      console.warn("KaTeX rendering note:", err);
    }
  }
}

window.copyCodeFromBlock = function(btn) {
  const pre = btn.closest("pre");
  const code = pre ? pre.querySelector("code") : null;
  if (code) {
    navigator.clipboard.writeText(code.innerText).then(() => {
      btn.innerHTML = `<i class="fa-solid fa-check" style="color:var(--success)"></i> Copied!`;
      setTimeout(() => {
        btn.innerHTML = `<i class="fa-regular fa-copy"></i> Copy`;
      }, 2000);
    });
  }
};

window.copyMessageText = function(text, btn) {
  navigator.clipboard.writeText(text).then(() => {
    showToast("Message copied to clipboard!", "fa-circle-check");
  });
};

window.speakMessageText = function(text, btn) {
  if (btn.classList.contains("speaking")) {
    stopAllAudio();
    btn.classList.remove("speaking");
    return;
  }
  document.querySelectorAll(".msg-action-btn.speaking").forEach(b => b.classList.remove("speaking"));
  btn.classList.add("speaking");
  speakText(text, () => {
    btn.classList.remove("speaking");
  });
};

// ================= Session & History Management =================
function generateChatId() {
  return "chat_" + Date.now() + "_" + Math.random().toString(36).substr(2, 6);
}

function loadChatsFromStorage() {
  try {
    const raw = localStorage.getItem("aether_chats");
    if (raw) {
      AppState.chats = JSON.parse(raw);
    }
  } catch (e) {
    console.error("Error loading chat history:", e);
    AppState.chats = {};
  }
}

function saveChatsToStorage() {
  try {
    localStorage.setItem("aether_chats", JSON.stringify(AppState.chats));
  } catch (e) {
    console.error("Error saving chat history:", e);
  }
}

function createNewChat(personaId = null) {
  stopAllAudio();
  const id = generateChatId();
  const chosenPersona = personaId || AppState.activePersona;
  
  AppState.chats[id] = {
    id: id,
    title: "New Conversation",
    persona: chosenPersona,
    messages: [],
    createdAt: new Date().toISOString()
  };
  
  AppState.activeChatId = id;
  saveChatsToStorage();
  renderSidebarHistory();
  switchPersona(chosenPersona, false);
  renderActiveChat();

  if (window.innerWidth <= 900) {
    elements.sidebar.classList.remove("open");
  }
}

function switchActiveChat(chatId) {
  if (!AppState.chats[chatId]) return;
  stopAllAudio();
  AppState.activeChatId = chatId;
  const chat = AppState.chats[chatId];
  switchPersona(chat.persona || "science", false);
  renderActiveChat();
  renderSidebarHistory();

  if (window.innerWidth <= 900) {
    elements.sidebar.classList.remove("open");
  }
}

function deleteChat(chatId, e) {
  if (e) e.stopPropagation();
  delete AppState.chats[chatId];
  saveChatsToStorage();
  
  if (AppState.activeChatId === chatId) {
    const remainingIds = Object.keys(AppState.chats);
    if (remainingIds.length > 0) {
      switchActiveChat(remainingIds[remainingIds.length - 1]);
    } else {
      createNewChat();
    }
  } else {
    renderSidebarHistory();
  }
  showToast("Chat deleted", "fa-trash-can");
}

function clearAllHistory() {
  if (confirm("Are you sure you want to delete all recent conversations?")) {
    stopAllAudio();
    AppState.chats = {};
    saveChatsToStorage();
    createNewChat();
    showToast("All chat history cleared", "fa-trash-can");
  }
}

function renderSidebarHistory(filterQuery = "") {
  const container = elements.chatHistoryList;
  container.innerHTML = "";

  let chatEntries = Object.values(AppState.chats).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  // Apply search filter
  if (filterQuery) {
    const q = filterQuery.toLowerCase();
    chatEntries = chatEntries.filter(chat => {
      const titleMatch = (chat.title || "").toLowerCase().includes(q);
      const contentMatch = (chat.messages || []).some(m =>
        (m.content || "").toLowerCase().includes(q)
      );
      return titleMatch || contentMatch;
    });
  }

  if (chatEntries.length === 0) {
    const msg = filterQuery ? "No matching conversations" : "No recent chats";
    container.innerHTML = `<div style="font-size:0.75rem; color:var(--text-muted); padding:0.5rem 0.75rem;">${msg}</div>`;
    return;
  }

  chatEntries.forEach(chat => {
    const item = document.createElement("div");
    item.className = `chat-history-item ${chat.id === AppState.activeChatId ? 'active' : ''}`;
    item.onclick = () => switchActiveChat(chat.id);

    const personaInfo = PERSONAS[chat.persona] || PERSONAS.general;

    item.innerHTML = `
      <div class="history-item-left">
        <i class="fa-solid ${personaInfo.icon}"></i>
        <span>${escapeHtml(chat.title || "Conversation")}</span>
      </div>
      <button class="history-delete-btn" title="Delete chat" aria-label="Delete chat" onclick="deleteChat('${chat.id}', event)">
        <i class="fa-solid fa-trash"></i>
      </button>
    `;
    container.appendChild(item);
  });
}

// ================= Persona System =================
function renderPersonaSidebar() {
  const container = elements.personaList;
  container.innerHTML = "";

  Object.values(PERSONAS).forEach(p => {
    const item = document.createElement("button");
    item.className = `persona-item ${p.id === AppState.activePersona ? 'active' : ''}`;
    item.onclick = () => switchPersona(p.id);

    item.innerHTML = `
      <div class="persona-avatar-sm">
        <i class="fa-solid ${p.icon}"></i>
      </div>
      <div class="persona-info-wrap">
        <span class="persona-name">${p.name}</span>
        <span class="persona-desc-sub">${p.tagline}</span>
      </div>
    `;
    container.appendChild(item);
  });
}

function switchPersona(personaId, updateChat = true) {
  if (!PERSONAS[personaId]) return;
  AppState.activePersona = personaId;
  const p = PERSONAS[personaId];

  // Update Header
  elements.headerPersonaTitle.textContent = p.name;
  elements.headerPersonaTagline.textContent = p.tagline;
  elements.headerPersonaAvatar.innerHTML = `<i class="fa-solid ${p.icon}"></i>`;

  // Update Sidebar Persona items
  document.querySelectorAll(".persona-item").forEach(item => {
    item.classList.toggle("active", item.querySelector(".persona-name").textContent.includes(p.name));
  });

  // Update Active Chat's persona if needed
  if (updateChat && AppState.activeChatId && AppState.chats[AppState.activeChatId]) {
    AppState.chats[AppState.activeChatId].persona = personaId;
    saveChatsToStorage();
    renderSidebarHistory();
  }

  renderPromptStarters();
}

function renderPromptStarters() {
  const p = PERSONAS[AppState.activePersona] || PERSONAS.science;
  const grid = elements.promptGrid;
  grid.innerHTML = "";

  p.starters.forEach(starter => {
    const card = document.createElement("div");
    card.className = "prompt-card";
    card.onclick = () => {
      elements.messageInput.value = starter.prompt;
      updateCharCounter();
      handleSendMessage();
    };

    card.innerHTML = `
      <div class="prompt-icon"><i class="fa-solid ${p.icon}"></i></div>
      <div class="prompt-text">
        <h4>${starter.title}</h4>
        <p>${starter.desc}</p>
      </div>
    `;
    grid.appendChild(card);
  });
}

// ================= Chat Messaging & Streaming =================
function renderActiveChat() {
  const chat = AppState.chats[AppState.activeChatId];
  if (!chat || chat.messages.length === 0) {
    elements.welcomeScreen.classList.remove("hidden");
    elements.messagesList.innerHTML = "";
    return;
  }

  elements.welcomeScreen.classList.add("hidden");
  elements.messagesList.innerHTML = "";

  chat.messages.forEach((msg, idx) => {
    appendMessageElement(msg.role, msg.content, msg.time, false);
  });

  scrollToBottom();
}

function appendMessageElement(role, content, time = null, animate = true) {
  const formattedTime = time || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const isUser = role === "user";
  const p = PERSONAS[AppState.activePersona] || PERSONAS.general;

  const row = document.createElement("div");
  row.className = `message-row ${isUser ? 'user' : 'bot'}`;
  if (!animate) row.style.animation = "none";

  const avatarContent = isUser 
    ? `<i class="fa-solid fa-user"></i>` 
    : `<span class="claude-avatar-star">✦</span>`;

  const parsedHTML = isUser ? escapeHtml(content).replace(/\n/g, '<br>') : renderMarkdown(content);

  row.innerHTML = `
    <div class="msg-avatar-wrap">
      <div class="msg-avatar">
        ${avatarContent}
      </div>
    </div>
    <div class="msg-content-wrap">
      <div class="msg-bubble">
        ${parsedHTML}
      </div>
      <div class="msg-meta-row">
        <span class="msg-time">${formattedTime}</span>
        ${!isUser ? `
          <div class="msg-actions">
            <button class="msg-action-btn" title="Speak message aloud" onclick="speakMessageText(${JSON.stringify(content).replace(/"/g, '&quot;')}, this)">
              <i class="fa-solid fa-volume-high"></i>
            </button>
            <button class="msg-action-btn" title="Copy text" onclick="copyMessageText(${JSON.stringify(content).replace(/"/g, '&quot;')}, this)">
              <i class="fa-regular fa-copy"></i>
            </button>
          </div>
        ` : ''}
      </div>
    </div>
  `;

  elements.messagesList.appendChild(row);
  renderMathInElement(row.querySelector(".msg-bubble"));
  return row;
}

async function handleSendMessage() {
  if (AppState.isStreaming) return;
  const text = elements.messageInput.value.trim();
  if (!text) return;

  // Store for error-card retry
  AppState.lastUserPrompt = text;

  // Clear input
  elements.messageInput.value = "";
  elements.messageInput.style.height = "auto";
  updateCharCounter();

  // Make sure active chat exists
  if (!AppState.activeChatId || !AppState.chats[AppState.activeChatId]) {
    createNewChat();
  }

  const currentChat = AppState.chats[AppState.activeChatId];

  // Update title on first message
  if (currentChat.messages.length === 0) {
    currentChat.title = text.length > 30 ? text.substring(0, 30) + "..." : text;
  }

  // Hide welcome screen, append user message
  elements.welcomeScreen.classList.add("hidden");
  const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  currentChat.messages.push({ role: "user", content: text, time: now });
  appendMessageElement("user", text, now);
  saveChatsToStorage();
  renderSidebarHistory();
  scrollToBottom();

  // Show persona-aware thinking animation
  showThinkingState();
  AppState.isStreaming = true;
  elements.sendBtn.disabled = true;

  const payload = {
    message: text,
    persona: AppState.activePersona,
    model: AppState.model,
    temperature: AppState.temperature,
    history: currentChat.messages.slice(-10),
    custom_system_instruction: AppState.customPrompt || null,
    stream: true
  };

  const headers = { "Content-Type": "application/json" };
  if (AppState.apiKey) headers["x-gemini-api-key"] = AppState.apiKey;

  try {
    const response = await fetch("/api/chat", {
      method: "POST",
      headers,
      body: JSON.stringify(payload)
    });

    // ── Rate limited ────────────────────────────────────────────────────────
    if (response.status === 429) {
      let msg = "Too many requests — please wait a moment before sending another message.";
      try { const d = await response.json(); if (d.message) msg = d.message; } catch (_) {}
      hideThinkingState();
      appendErrorCard(text, msg, "rate_limited");
      return;
    }

    if (!response.ok) throw new Error(`HTTP error ${response.status}`);

    // ── Stream response ─────────────────────────────────────────────────────
    hideThinkingState();

    let botFullText = "";
    let responseReason = "ok";
    let responseErrorMsg = null;
    const botRow = appendMessageElement("model", "");
    const bubble = botRow.querySelector(".msg-bubble");
    const actionsRow = botRow.querySelector(".msg-meta-row");

    const reader = response.body.getReader();
    const decoder = new TextDecoder("utf-8");
    let buffer = "";

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n\n");
      buffer = lines.pop();
      for (const line of lines) {
        if (line.startsWith("data: ")) {
          try {
            const data = JSON.parse(line.replace("data: ", ""));
            if (data.text) {
              botFullText += data.text;
              bubble.innerHTML = renderMarkdown(botFullText);
              scrollToBottom();
            }
            if (data.done) {
              responseReason = data.reason || "ok";
              responseErrorMsg = data.message || null;
            }
          } catch (_) {}
        }
      }
    }

    // ── Handle response reason ───────────────────────────────────────────────
    if (responseReason === "stream_interrupted") {
      // Mid-stream failure: partial content was already displayed in the bubble.
      // Remove the incomplete bot row and show a retry card so the user can
      // resend cleanly rather than seeing a truncated/garbled reply.
      botRow.remove();
      const errMsg = responseErrorMsg || "Response was interrupted — please try again.";
      appendErrorCard(text, errMsg, "stream_interrupted");
      return;
    }

    if (responseReason === "api_error") {
      botRow.remove();
      const errMsg = responseErrorMsg || "Gemini API returned an error. Your key may be invalid or your quota may be exceeded.";
      appendErrorCard(text, errMsg, "api_error");
      return;
    }

    if (responseReason === "no_key") {
      // Honest demo-mode banner at top of response bubble
      bubble.insertAdjacentHTML("afterbegin", `
        <div class="demo-mode-banner" role="status">
          <i class="fa-solid fa-key" aria-hidden="true"></i>
          <span>Demo Mode &mdash; <a href="#" onclick="openSettingsModal(); return false;">Add your Gemini API key</a> for real AI responses.</span>
          <button class="demo-banner-dismiss" aria-label="Dismiss demo notice" onclick="this.parentElement.remove()">
            <i class="fa-solid fa-xmark" aria-hidden="true"></i>
          </button>
        </div>
      `);
    }

    // Final render — math + syntax highlight
    renderMathInElement(bubble);
    bubble.querySelectorAll('pre code').forEach(block => hljs.highlightElement(block));

    // Action buttons + Regenerate
    actionsRow.innerHTML = `
      <span class="msg-time">${now}</span>
      <div class="msg-actions" style="opacity:1">
        <button class="msg-action-btn" aria-label="Speak message aloud" title="Speak aloud"
          onclick="speakMessageText(${JSON.stringify(botFullText).replace(/"/g, '&quot;')}, this)">
          <i class="fa-solid fa-volume-high"></i>
        </button>
        <button class="msg-action-btn" aria-label="Copy text" title="Copy text"
          onclick="copyMessageText(${JSON.stringify(botFullText).replace(/"/g, '&quot;')}, this)">
          <i class="fa-regular fa-copy"></i>
        </button>
        <button class="msg-action-btn regenerate-btn" aria-label="Regenerate response" title="Regenerate response"
          onclick="regenerateLastResponse()">
          <i class="fa-solid fa-rotate-right"></i>
        </button>
      </div>
    `;

    // Save to history
    currentChat.messages.push({ role: "model", content: botFullText, time: now });
    saveChatsToStorage();

    // Auto-speak if enabled
    if (AppState.autoVoice && botFullText) speakText(botFullText);

  } catch (err) {
    console.error("Chat error:", err);
    hideThinkingState();
    appendErrorCard(text, err.message || "Failed to connect to Gemini AI. Check your internet connection.", "api_error");
  } finally {
    AppState.isStreaming = false;
    elements.sendBtn.disabled = false;
    scrollToBottom();
  }
}

// ================= Error Cards =================
function appendErrorCard(userText, errorMessage, errorType = "api_error") {
  const isRateLimit = errorType === "rate_limited";
  const isInterrupted = errorType === "stream_interrupted";
  const icon  = isRateLimit   ? "fa-clock"
              : isInterrupted ? "fa-circle-pause"
              :                 "fa-triangle-exclamation";
  const title = isRateLimit   ? "Rate limit reached"
              : isInterrupted ? "Response interrupted"
              :                 "Request failed";

  const row = document.createElement("div");
  row.className = "error-message-row";
  row.dataset.userPrompt = userText;

  row.innerHTML = `
    <div class="error-card">
      <div class="error-card-header">
        <i class="fa-solid ${icon}" aria-hidden="true"></i>
        <span>${title}</span>
        <button class="error-dismiss-btn" aria-label="Dismiss error"
          onclick="this.closest('.error-message-row').remove()">
          <i class="fa-solid fa-xmark" aria-hidden="true"></i>
        </button>
      </div>
      <p class="error-card-msg">${escapeHtml(errorMessage)}</p>
      <button class="error-retry-btn" onclick="retryFromErrorCard(this)">
        <i class="fa-solid fa-rotate-right"></i> Retry
      </button>
    </div>
  `;

  elements.messagesList.appendChild(row);
  scrollToBottom();
  return row;
}

window.retryFromErrorCard = function(btn) {
  const row = btn.closest(".error-message-row");
  const userText = row?.dataset.userPrompt || AppState.lastUserPrompt;
  if (!userText) return;
  row?.remove();
  elements.messageInput.value = userText;
  handleSendMessage();
};

// ================= Regenerate Last Response =================
function regenerateLastResponse() {
  if (AppState.isStreaming) return;
  const chat = AppState.chats[AppState.activeChatId];
  if (!chat || chat.messages.length < 2) return;

  // Find the last user message
  let lastUserMsg = null;
  for (let i = chat.messages.length - 1; i >= 0; i--) {
    if (chat.messages[i].role === "user") { lastUserMsg = chat.messages[i]; break; }
  }
  if (!lastUserMsg) return;

  // Drop last bot reply from history
  if (chat.messages[chat.messages.length - 1].role === "model") chat.messages.pop();
  saveChatsToStorage();
  renderActiveChat();

  elements.messageInput.value = lastUserMsg.content;
  handleSendMessage();
}

// ================= Test API Key Connection =================
async function testApiKeyConnection() {
  const testBtn = document.getElementById("testConnectionBtn");
  const resultEl = document.getElementById("apiTestResult");
  const keyToTest = elements.apiKeyInput.value.trim();

  if (!keyToTest) {
    resultEl.className = "api-test-result error";
    resultEl.innerHTML = `<i class="fa-solid fa-circle-xmark"></i> Enter an API key first`;
    return;
  }

  testBtn.disabled = true;
  testBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Testing…`;
  resultEl.className = "api-test-result";
  resultEl.textContent = "";

  try {
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-gemini-api-key": keyToTest },
      body: JSON.stringify({
        message: "Hi",
        persona: "general",
        model: AppState.model || "gemini-3.7-flash",
        temperature: 0.1,
        history: [],
        stream: false
      })
    });

    const data = await response.json();

    if (response.ok && data.reason === "ok" && !data.demo_mode) {
      resultEl.className = "api-test-result success";
      resultEl.innerHTML = `<i class="fa-solid fa-circle-check"></i> Key valid — Gemini responded`;
    } else if (data.demo_mode || data.reason === "no_key") {
      resultEl.className = "api-test-result error";
      resultEl.innerHTML = `<i class="fa-solid fa-circle-xmark"></i> Key not recognised by server`;
    } else {
      const msg = data.error || data.message || "Connection failed";
      resultEl.className = "api-test-result error";
      resultEl.innerHTML = `<i class="fa-solid fa-circle-xmark"></i> ${escapeHtml(msg)}`;
    }
  } catch (err) {
    resultEl.className = "api-test-result error";
    resultEl.innerHTML = `<i class="fa-solid fa-circle-xmark"></i> Network error: ${escapeHtml(err.message)}`;
  } finally {
    testBtn.disabled = false;
    testBtn.innerHTML = `<i class="fa-solid fa-plug-circle-check"></i> Test Connection`;
  }
}

// ================= UI Helpers & Utilities =================
function scrollToBottom() {
  elements.messagesContainer.scrollTop = elements.messagesContainer.scrollHeight;
}

function autoResizeTextarea() {
  const ta = elements.messageInput;
  ta.style.height = "auto";
  ta.style.height = Math.min(ta.scrollHeight, 180) + "px";
}

function updateCharCounter() {
  const len = elements.messageInput.value.length;
  elements.charCounter.textContent = `${len} / 8000`;
}

function showToast(message, icon = "fa-circle-info") {
  const toast = document.createElement("div");
  toast.className = "toast";
  toast.innerHTML = `<i class="fa-solid ${icon}" style="color:var(--accent-primary)"></i> <span>${escapeHtml(message)}</span>`;
  elements.toastContainer.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transform = "translateY(10px)";
    setTimeout(() => toast.remove(), 300);
  }, 3200);
}

function escapeHtml(str) {
  if (!str) return "";
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function exportCurrentChat() {
  const chat = AppState.chats[AppState.activeChatId];
  if (!chat || chat.messages.length === 0) {
    showToast("No messages in current conversation to export", "fa-triangle-exclamation");
    return;
  }

  let mdContent = `# ${chat.title || "AI Conversation"}\n`;
  mdContent += `*Generated by MIMI • Persona: ${chat.persona} • ${new Date(chat.createdAt).toLocaleString()}*\n\n---\n\n`;

  chat.messages.forEach(msg => {
    const sender = msg.role === "user" ? "🧑 You" : "🤖 MIMI";
    mdContent += `### ${sender} (${msg.time})\n${msg.content}\n\n`;
  });

  const blob = new Blob([mdContent], { type: "text/markdown" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `MIMI_Chat_${Date.now()}.md`;
  a.click();
  URL.revokeObjectURL(url);
  showToast("Chat exported to Markdown file!", "fa-file-arrow-down");
}

function clearCurrentChatMessages() {
  const chat = AppState.chats[AppState.activeChatId];
  if (chat && chat.messages.length > 0) {
    if (confirm("Clear all messages from this conversation?")) {
      stopAllAudio();
      chat.messages = [];
      saveChatsToStorage();
      renderActiveChat();
      showToast("Messages cleared", "fa-trash-can");
    }
  }
}

// ================= Themes & Settings Modal =================
function applyTheme(themeName) {
  AppState.theme = themeName;
  document.documentElement.setAttribute("data-theme", themeName);
  localStorage.setItem("aether_theme", themeName);

  document.querySelectorAll(".theme-chip").forEach(chip => {
    chip.classList.toggle("active", chip.dataset.themeVal === themeName);
  });
}

function openSettingsModal() {
  elements.apiKeyInput.value = AppState.apiKey;
  elements.modelSelect.value = AppState.model;
  elements.ttsEngineSelect.value = AppState.ttsEngine;
  elements.voiceRateSlider.value = AppState.voiceRate;
  elements.voiceRateVal.textContent = `${AppState.voiceRate}x`;
  elements.voicePitchSlider.value = AppState.voicePitch;
  elements.voicePitchVal.textContent = AppState.voicePitch;
  elements.tempSlider.value = AppState.temperature;
  elements.tempVal.textContent = AppState.temperature;
  elements.customPromptInput.value = AppState.customPrompt;

  document.querySelectorAll(".theme-chip").forEach(chip => {
    chip.classList.toggle("active", chip.dataset.themeVal === AppState.theme);
  });

  elements.settingsModal.classList.remove("hidden");
}

function closeSettingsModal() {
  elements.settingsModal.classList.add("hidden");
}

function saveSettings() {
  AppState.apiKey = elements.apiKeyInput.value.trim();
  AppState.model = elements.modelSelect.value;
  AppState.ttsEngine = elements.ttsEngineSelect.value;
  AppState.voiceRate = parseFloat(elements.voiceRateSlider.value);
  AppState.voicePitch = parseFloat(elements.voicePitchSlider.value);
  AppState.temperature = parseFloat(elements.tempSlider.value);
  AppState.customPrompt = elements.customPromptInput.value.trim();

  localStorage.setItem("aether_gemini_api_key", AppState.apiKey);
  localStorage.setItem("aether_gemini_model", AppState.model);
  localStorage.setItem("aether_tts_engine", AppState.ttsEngine);
  localStorage.setItem("aether_voice_rate", AppState.voiceRate);
  localStorage.setItem("aether_voice_pitch", AppState.voicePitch);
  localStorage.setItem("aether_temperature", AppState.temperature);
  localStorage.setItem("aether_custom_prompt", AppState.customPrompt);

  elements.headerModelPill.textContent = elements.modelSelect.options[elements.modelSelect.selectedIndex].text.split("(")[0].trim();

  updateApiStatusUI();
  closeSettingsModal();
  showToast("Settings successfully saved!", "fa-floppy-disk");

  // Celebrate with confetti if key added!
  if (AppState.apiKey && window.confetti) {
    confetti({ particleCount: 40, spread: 60, origin: { y: 0.8 } });
  }
}

function updateApiStatusUI() {
  if (AppState.apiKey) {
    elements.apiStatusText.textContent = "Custom Key Active";
    elements.apiStatusSub.textContent = AppState.model;
    elements.apiStatusCard.querySelector(".status-indicator-dot").className = "status-indicator-dot online";
  } else {
    // Check server status
    fetch("/api/health")
      .then(res => res.json())
      .then(data => {
        if (data.has_server_api_key) {
          elements.apiStatusText.textContent = "Server Key Connected";
          elements.apiStatusSub.textContent = AppState.model;
          elements.apiStatusCard.querySelector(".status-indicator-dot").className = "status-indicator-dot online";
        } else {
          elements.apiStatusText.textContent = "Demo Mode (Add Key)";
          elements.apiStatusSub.textContent = "Click to set API Key";
          elements.apiStatusCard.querySelector(".status-indicator-dot").className = "status-indicator-dot warning";
        }
      })
      .catch(() => {
        elements.apiStatusText.textContent = "Offline Mode";
        elements.apiStatusSub.textContent = "Server disconnected";
        elements.apiStatusCard.querySelector(".status-indicator-dot").className = "status-indicator-dot warning";
      });
  }
}

// ================= Event Listeners Initialization =================
function setupEventListeners() {
  // Sidebar toggles
  elements.sidebarToggleBtn.onclick = () => elements.sidebar.classList.toggle("open");
  elements.sidebarCloseBtn.onclick = () => elements.sidebar.classList.remove("open");
  elements.newChatBtn.onclick = () => createNewChat();
  elements.clearHistoryBtn.onclick = clearAllHistory;

  // History search
  const historySearchInput = document.getElementById("historySearchInput");
  if (historySearchInput) {
    historySearchInput.addEventListener("input", (e) => {
      renderSidebarHistory(e.target.value.trim());
    });
  }

  // Textarea input
  elements.messageInput.addEventListener("input", () => {
    autoResizeTextarea();
    updateCharCounter();
  });

  elements.messageInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  });

  // Send button
  elements.sendBtn.onclick = handleSendMessage;

  // Mic recording button — update aria-pressed on state change
  elements.micBtn.onclick = () => {
    if (AppState.isRecording) {
      stopRecording();
      elements.micBtn.setAttribute("aria-pressed", "false");
    } else {
      startRecording();
      elements.micBtn.setAttribute("aria-pressed", "true");
    }
  };
  elements.cancelVoiceBtn.onclick = () => {
    stopRecording();
    elements.micBtn.setAttribute("aria-pressed", "false");
  };

  // Auto Voice Output Toggle
  elements.ttsToggleBtn.onclick = () => {
    AppState.autoVoice = !AppState.autoVoice;
    localStorage.setItem("aether_auto_voice", AppState.autoVoice);
    elements.ttsToggleBtn.classList.toggle("active", AppState.autoVoice);
    elements.ttsToggleBtn.setAttribute("aria-pressed", String(AppState.autoVoice));
    elements.ttsToggleIcon.className = AppState.autoVoice ? "fa-solid fa-volume-high" : "fa-solid fa-volume-xmark";
    elements.ttsToggleLabel.textContent = AppState.autoVoice ? "Voice ON" : "Voice OFF";
    showToast(AppState.autoVoice ? "Auto voice playback enabled" : "Auto voice playback muted",
      AppState.autoVoice ? "fa-volume-high" : "fa-volume-xmark");
  };

  // Floating Audio Player Controls
  elements.pauseResumeAudioBtn.onclick = () => {
    if (AppState.currentAudioObject) {
      if (AppState.currentAudioObject.paused) {
        AppState.currentAudioObject.play();
        elements.pauseResumeIcon.className = "fa-solid fa-pause";
      } else {
        AppState.currentAudioObject.pause();
        elements.pauseResumeIcon.className = "fa-solid fa-play";
      }
    } else if (window.speechSynthesis) {
      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
        elements.pauseResumeIcon.className = "fa-solid fa-pause";
      } else {
        window.speechSynthesis.pause();
        elements.pauseResumeIcon.className = "fa-solid fa-play";
      }
    }
  };
  elements.stopAudioBtn.onclick = stopAllAudio;

  // Nav Actions
  elements.exportChatBtn.onclick = exportCurrentChat;
  elements.clearCurrentChatBtn.onclick = clearCurrentChatMessages;
  elements.headerSettingsBtn.onclick = openSettingsModal;
  elements.openSettingsBtn.onclick = openSettingsModal;
  elements.quickKeyBtn.onclick = openSettingsModal;
  elements.apiStatusCard.onclick = openSettingsModal;

  // Settings Modal Events
  elements.closeSettingsModalBtn.onclick = closeSettingsModal;
  elements.cancelSettingsBtn.onclick = closeSettingsModal;
  elements.saveSettingsBtn.onclick = saveSettings;

  // Test Connection button
  const testBtn = document.getElementById("testConnectionBtn");
  if (testBtn) testBtn.addEventListener("click", testApiKeyConnection);

  // Password visibility
  elements.toggleApiKeyVis.onclick = () => {
    const input = elements.apiKeyInput;
    if (input.type === "password") {
      input.type = "text";
      elements.eyeIcon.className = "fa-regular fa-eye-slash";
    } else {
      input.type = "password";
      elements.eyeIcon.className = "fa-regular fa-eye";
    }
  };

  // Sliders display values
  elements.voiceRateSlider.oninput = (e) => elements.voiceRateVal.textContent = `${e.target.value}x`;
  elements.voicePitchSlider.oninput = (e) => elements.voicePitchVal.textContent = e.target.value;
  elements.tempSlider.oninput = (e) => elements.tempVal.textContent = e.target.value;
  elements.resetPromptBtn.onclick = () => elements.customPromptInput.value = "";

  // Theme chips in settings
  document.querySelectorAll(".theme-chip").forEach(chip => {
    chip.onclick = () => applyTheme(chip.dataset.themeVal);
  });

  // Cycle theme button
  const themes = ["claude-dark", "claude", "mimi", "neon", "cyberpunk", "aurora"];
  elements.themePickerBtn.onclick = () => {
    const nextIdx = (themes.indexOf(AppState.theme) + 1) % themes.length;
    applyTheme(themes[nextIdx]);
    showToast(`Switched theme to ${themes[nextIdx].toUpperCase()}`, "fa-palette");
  };

  // Keyboard shortcuts
  window.addEventListener("keydown", (e) => {
    if (e.altKey && (e.key === "n" || e.key === "N")) {
      e.preventDefault();
      createNewChat();
    }
    if (e.key === "Escape" && !elements.settingsModal.classList.contains("hidden")) {
      closeSettingsModal();
    }
  });
}

// ================= Model List (fetched from /api/models) =================
/**
 * Fetches the model list from /api/models and builds <option> elements for
 * #modelSelect.  Falls back to a built-in default if the fetch fails so the
 * settings modal is never left with an empty dropdown.
 * Also restores the previously saved model selection and updates the header pill.
 */
async function fetchAndPopulateModels() {
  const FALLBACK_MODELS = [
    { id: "gemini-3.7-flash", name: "Gemini 3.7 Flash (Fast, Multimodal & Reasoning)", recommended: true },
    { id: "gemini-3.6-flash", name: "Gemini 3.6 Flash (Ultra Fast & Efficient)",      recommended: false },
  ];

  let models = FALLBACK_MODELS;
  try {
    const res = await fetch("/api/models");
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data.models) && data.models.length > 0) {
        models = data.models;
      }
    }
  } catch (err) {
    console.warn("fetchAndPopulateModels: /api/models unreachable, using fallback list.", err);
  }

  const sel = elements.modelSelect;
  sel.innerHTML = ""; // clear any stale options
  models.forEach(m => {
    const opt = document.createElement("option");
    opt.value = m.id;
    opt.textContent = m.name + (m.recommended ? " ★" : "");
    sel.appendChild(opt);
  });

  // Restore the user's persisted model choice (validate it exists in the new list)
  const savedModel = AppState.model;
  const ids = models.map(m => m.id);
  const resolved = ids.includes(savedModel) ? savedModel : (models.find(m => m.recommended) || models[0]).id;
  AppState.model = resolved;
  sel.value = resolved;
  localStorage.setItem("aether_gemini_model", resolved);

  // Update the header model pill to match the selected option label
  if (elements.headerModelPill && sel.selectedIndex >= 0) {
    elements.headerModelPill.textContent = sel.options[sel.selectedIndex].text.split("(")[0].replace("★", "").trim();
  }
}

// ================= App Initialization =================
document.addEventListener("DOMContentLoaded", () => {
  applyTheme(AppState.theme);
  loadChatsFromStorage();
  renderPersonaSidebar();
  renderSidebarHistory();
  initSpeechRecognition();
  initVisualizerCanvas();
  setupEventListeners();

  // Set Auto Voice state in button
  elements.ttsToggleBtn.classList.toggle("active", AppState.autoVoice);
  elements.ttsToggleIcon.className = AppState.autoVoice ? "fa-solid fa-volume-high" : "fa-solid fa-volume-xmark";
  elements.ttsToggleLabel.textContent = AppState.autoVoice ? "Voice ON" : "Voice OFF";

  // Check if we have active chat or need to create one
  const chatIds = Object.keys(AppState.chats);
  if (chatIds.length > 0) {
    switchActiveChat(chatIds[chatIds.length - 1]);
  } else {
    createNewChat();
  }

  // Populate model dropdown from /api/models (single source of truth in app.py).
  // updateApiStatusUI() is called inside after the model is resolved.
  fetchAndPopulateModels().then(() => updateApiStatusUI());
});
