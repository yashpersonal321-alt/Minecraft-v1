import * as THREE from 'three';
import { GameEngine } from './game/core/GameEngine.js';
import { LoadingScreen } from './game/ui/LoadingScreen.js';
import { MobileControls } from './game/ui/MobileControls.js';

// ग्लोबल वेरिएबल्स
let gameEngine = null;
let loadingScreen = null;
let mobileControls = null;

// लोडिंग प्रोग्रेस
let loadingProgress = 0;
const loadingSteps = [
    { name: "इंजन इनिशियलाइज़ हो रहा...", progress: 10 },
    { name: "वर्ल्ड जेनरेट हो रही...", progress: 30 },
    { name: "टेक्सचर लोड हो रहे...", progress: 50 },
    { name: "चंक रेंडर हो रहे...", progress: 70 },
    { name: "NPC स्पॉन हो रहे...", progress: 85 },
    { name: "एनीमेशन सेटअप...", progress: 95 },
    { name: "तैयार!", progress: 100 }
];

let currentStep = 0;

// गेम स्टार्ट करने से पहले लोडिंग सिमुलेट करें
async function startGame() {
    loadingScreen = new LoadingScreen();
    loadingScreen.show();
    
    // लोडिंग स्टेप्स को एनिमेट करें
    for (let i = 0; i < loadingSteps.length; i++) {
        const step = loadingSteps[i];
        loadingScreen.updateText(step.name);
        loadingScreen.updateProgress(step.progress);
        
        // हर स्टेप के बीच थोड़ा इंतज़ार (रियलिस्टिक लगे)
        await sleep(300);
        
        // थोड़ा स्मूथ प्रोग्रेस
        if (i < loadingSteps.length - 1) {
            for (let p = step.progress + 5; p < loadingSteps[i+1].progress; p += 5) {
                loadingScreen.updateProgress(p);
                await sleep(20);
            }
        }
    }
    
    // लोडिंग पूरी - अब गेम शुरू
    loadingScreen.hide();
    
    // गेम इंजन बनाएं
    const canvas = document.createElement('canvas');
    canvas.style.position = 'fixed';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    document.body.appendChild(canvas);
    
    gameEngine = new GameEngine(canvas);
    
    // मोबाइल कंट्रोल्स सेटअप करें
    mobileControls = new MobileControls(gameEngine);
    mobileControls.init();
    
    // गेम लूप शुरू करें
    gameEngine.start();
    
    // NPC डायलॉग के लिए इवेंट लिस्टनर
    setupNPCEvents();
    
    console.log("✨ गेम पूरी तरह से शुरू हो चुका है! ✨");
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function setupNPCEvents() {
    document.getElementById('close-dialog')?.addEventListener('click', () => {
        document.getElementById('npc-dialog')?.classList.add('hidden');
    });
}

// मोबाइल पर टच से क्रॉसहेयर छुपाने/दिखाने की जरूरत नहीं, बस शुरू करें
window.addEventListener('load', () => {
    startGame();
});

// विंडो रीसाइज़ पर कैमरा अपडेट
window.addEventListener('resize', () => {
    if (gameEngine && gameEngine.renderer) {
        gameEngine.renderer.setSize(window.innerWidth, window.innerHeight);
        gameEngine.camera.aspect = window.innerWidth / window.innerHeight;
        gameEngine.camera.updateProjectionMatrix();
    }
});

// PWA सपोर्ट (मोबाइल पर ऐप जैसा अनुभव)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js').catch(err => {
            console.log('ServiceWorker registration failed: ', err);
        });
    });
}
