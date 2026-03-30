import * as THREE from 'three';
import { GameEngine } from './game/core/GameEngine.js';

let gameEngine = null;
let loadingProgress = 0;

// लोडिंग स्टेप्स
const loadingSteps = [
    { text: "🎮 इंजन शुरू हो रहा...", progress: 10, detail: "Initializing Three.js" },
    { text: "🌍 वर्ल्ड जनरेट हो रही...", progress: 30, detail: "Generating terrain" },
    { text: "🎨 टेक्सचर लोड हो रहे...", progress: 50, detail: "Loading textures & shaders" },
    { text: "🏔️ चंक रेंडर हो रहे...", progress: 70, detail: "Building chunks" },
    { text: "👥 NPC स्पॉन हो रहे...", progress: 85, detail: "Spawning villagers" },
    { text: "✨ एनीमेशन सेटअप...", progress: 95, detail: "Setting up animations" },
    { text: "🚀 गेम तैयार!", progress: 100, detail: "Ready to play!" }
];

let currentStep = 0;
let tips = [
    "💡 Tip: ब्लॉक रखने के लिए स्क्रीन टैप करें",
    "🎮 जॉयस्टिक से चलें, बटन से एक्शन करें",
    "🌙 रात में मॉब्स से सावधान रहें",
    "🔨 ब्लॉक तोड़ने के लिए होल्ड करें",
    "🎒 इन्वेंटरी खोलने के लिए बैग बटन दबाएं",
    "⭐ XP से नए आइटम अनलॉक होंगे"
];

function updateLoadingUI(text, progress, detail) {
    const loadingBar = document.getElementById('loading-bar');
    const loadingText = document.getElementById('loading-text');
    const loadingDetail = document.getElementById('loading-detail');
    const tipText = document.getElementById('tip-text');
    
    if (loadingBar) loadingBar.style.width = `${progress}%`;
    if (loadingText) loadingText.innerText = text;
    if (loadingDetail) loadingDetail.innerText = detail;
    
    // टिप्स बदलें
    if (tipText && Math.random() < 0.1) {
        const randomTip = tips[Math.floor(Math.random() * tips.length)];
        tipText.innerText = randomTip;
    }
}

async function simulateLoading() {
    for (let i = 0; i < loadingSteps.length; i++) {
        const step = loadingSteps[i];
        updateLoadingUI(step.text, step.progress, step.detail);
        
        // रियलिस्टिक लोडिंग डिले
        await new Promise(resolve => setTimeout(resolve, 200));
        
        // स्मूथ प्रोग्रेस
        if (i < loadingSteps.length - 1) {
            const nextProgress = loadingSteps[i+1].progress;
            for (let p = step.progress + 5; p < nextProgress; p += 5) {
                updateLoadingUI(step.text, p, step.detail);
                await new Promise(resolve => setTimeout(resolve, 15));
            }
        }
    }
}

async function startGame() {
    try {
        // लोडिंग सिमुलेट
        await simulateLoading();
        
        // गेम इंजन बनाएं
        const canvas = document.createElement('canvas');
        canvas.style.position = 'fixed';
        canvas.style.top = '0';
        canvas.style.left = '0';
        canvas.style.width = '100%';
        canvas.style.height = '100%';
        canvas.style.zIndex = '1';
        document.body.appendChild(canvas);
        
        gameEngine = new GameEngine(canvas);
        await gameEngine.init();
        gameEngine.start();
        
        // लोडिंग स्क्रीन हाइड करें
        const loadingScreen = document.getElementById('loading-screen');
        if (loadingScreen) {
            loadingScreen.style.opacity = '0';
            setTimeout(() => {
                loadingScreen.style.display = 'none';
            }, 500);
        }
        
        // बैकग्राउंड म्यूजिक शुरू करें
        const bgMusic = document.getElementById('bg-music');
        if (bgMusic) {
            bgMusic.volume = 0.3;
            bgMusic.play().catch(e => console.log('Audio autoplay blocked'));
        }
        
        console.log('✨ Game Started Successfully! ✨');
        
    } catch (error) {
        console.error('Game failed to start:', error);
        const loadingText = document.getElementById('loading-text');
        if (loadingText) {
            loadingText.innerText = '❌ Error loading game. Please refresh.';
            loadingText.style.color = '#ff5555';
        }
    }
}

// पॉज़ मेनू इवेंट्स
function setupPauseMenu() {
    const pauseBtn = document.getElementById('inventory-btn');
    const pauseMenu = document.getElementById('pause-menu');
    const resumeBtn = document.getElementById('resume-btn');
    const settingsBtn = document.getElementById('settings-btn');
    const quitBtn = document.getElementById('quit-btn');
    const settingsMenu = document.getElementById('settings-menu');
    const closeSettings = document.getElementById('close-settings');
    const sensitivitySlider = document.getElementById('sensitivity');
    
    if (pauseBtn) {
        pauseBtn.addEventListener('click', () => {
            if (gameEngine) gameEngine.isPaused = true;
            if (pauseMenu) pauseMenu.classList.remove('hidden');
        });
    }
    
    if (resumeBtn) {
        resumeBtn.addEventListener('click', () => {
            if (gameEngine) gameEngine.isPaused = false;
            if (pauseMenu) pauseMenu.classList.add('hidden');
        });
    }
    
    if (settingsBtn) {
        settingsBtn.addEventListener('click', () => {
            if (pauseMenu) pauseMenu.classList.add('hidden');
            if (settingsMenu) settingsMenu.classList.remove('hidden');
        });
    }
    
    if (closeSettings) {
        closeSettings.addEventListener('click', () => {
            if (settingsMenu) settingsMenu.classList.add('hidden');
            if (pauseMenu) pauseMenu.classList.remove('hidden');
        });
    }
    
    if (quitBtn) {
        quitBtn.addEventListener('click', () => {
            if (confirm('क्या आप सच में बाहर निकलना चाहते हैं?')) {
                location.reload();
            }
        });
    }
    
    if (sensitivitySlider) {
        sensitivitySlider.addEventListener('input', (e) => {
            if (gameEngine && gameEngine.player) {
                gameEngine.player.mouseSensitivity = e.target.value / 1000;
            }
        });
    }
}

// विंडो लोड होने पर गेम शुरू करें
window.addEventListener('load', () => {
    startGame();
    setupPauseMenu();
});

window.addEventListener('resize', () => {
    if (gameEngine && gameEngine.renderer) {
        gameEngine.renderer.setSize(window.innerWidth, window.innerHeight);
        if (gameEngine.camera) {
            gameEngine.camera.aspect = window.innerWidth / window.innerHeight;
            gameEngine.camera.updateProjectionMatrix();
        }
    }
});
