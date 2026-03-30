import * as THREE from 'three';
import { GameEngine } from './game/core/GameEngine.js';

let gameEngine = null;

async function startGame() {
    try {
        console.log('🚀 Starting game...');
        
        // कैनवस बनाएं
        const canvas = document.createElement('canvas');
        canvas.style.position = 'fixed';
        canvas.style.top = '0';
        canvas.style.left = '0';
        canvas.style.width = '100%';
        canvas.style.height = '100%';
        canvas.style.zIndex = '1';
        document.body.appendChild(canvas);
        
        // गेम इंजन शुरू करें
        gameEngine = new GameEngine(canvas);
        await gameEngine.init();
        gameEngine.start();
        
        console.log('✨ Game Ready! ✨');
        
    } catch (error) {
        console.error('Game failed to start:', error);
        const errorDiv = document.createElement('div');
        errorDiv.style.position = 'fixed';
        errorDiv.style.top = '50%';
        errorDiv.style.left = '50%';
        errorDiv.style.transform = 'translate(-50%, -50%)';
        errorDiv.style.color = 'red';
        errorDiv.style.background = 'black';
        errorDiv.style.padding = '20px';
        errorDiv.style.zIndex = '10000';
        errorDiv.innerText = 'Error: ' + error.message;
        document.body.appendChild(errorDiv);
    }
}

// पॉज़ मेनू इवेंट्स
function setupMenus() {
    const inventoryBtn = document.getElementById('inventory-btn');
    const inventoryPanel = document.getElementById('inventory-panel');
    const closeInventory = document.getElementById('close-inventory');
    const pauseMenu = document.getElementById('pause-menu');
    const resumeBtn = document.getElementById('resume-btn');
    const settingsBtn = document.getElementById('settings-btn');
    const quitBtn = document.getElementById('quit-btn');
    const settingsMenu = document.getElementById('settings-menu');
    const closeSettings = document.getElementById('close-settings');
    const sensitivitySlider = document.getElementById('sensitivity');
    
    if (inventoryBtn && inventoryPanel) {
        inventoryBtn.addEventListener('click', () => {
            if (gameEngine) gameEngine.isPaused = true;
            inventoryPanel.classList.remove('hidden');
        });
    }
    
    if (closeInventory && inventoryPanel) {
        closeInventory.addEventListener('click', () => {
            if (gameEngine) gameEngine.isPaused = false;
            inventoryPanel.classList.add('hidden');
        });
    }
    
    if (resumeBtn && pauseMenu) {
        resumeBtn.addEventListener('click', () => {
            if (gameEngine) gameEngine.isPaused = false;
            pauseMenu.classList.add('hidden');
        });
    }
    
    if (settingsBtn && pauseMenu && settingsMenu) {
        settingsBtn.addEventListener('click', () => {
            pauseMenu.classList.add('hidden');
            settingsMenu.classList.remove('hidden');
        });
    }
    
    if (closeSettings && settingsMenu && pauseMenu) {
        closeSettings.addEventListener('click', () => {
            settingsMenu.classList.add('hidden');
            pauseMenu.classList.remove('hidden');
        });
    }
    
    if (quitBtn) {
        quitBtn.addEventListener('click', () => {
            if (confirm('क्या आप सच में बाहर निकलना चाहते हैं?')) {
                location.reload();
            }
        });
    }
    
    if (sensitivitySlider && gameEngine) {
        sensitivitySlider.addEventListener('input', (e) => {
            if (gameEngine && gameEngine.player) {
                gameEngine.player.mouseSensitivity = e.target.value / 1000;
            }
        });
    }
    
    // स्क्रीन टैप से प्लेस ब्लॉक (मोबाइल)
    const canvas = document.querySelector('canvas');
    if (canvas) {
        canvas.addEventListener('click', () => {
            if (gameEngine && !gameEngine.isPaused) {
                gameEngine.placeBlockAtCrosshair();
                const placeSound = document.getElementById('place-sound');
                if (placeSound) placeSound.play().catch(e => console.log('Sound error'));
            }
        });
        
        canvas.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            if (gameEngine && !gameEngine.isPaused) {
                gameEngine.breakBlockAtCrosshair();
                const breakSound = document.getElementById('break-sound');
                if (breakSound) breakSound.play().catch(e => console.log('Sound error'));
            }
        });
    }
}

// NPC डायलॉग क्लोज़
const closeDialog = document.getElementById('close-dialog');
if (closeDialog) {
    closeDialog.addEventListener('click', () => {
        document.getElementById('npc-dialog')?.classList.add('hidden');
    });
}

// विंडो लोड होने पर गेम शुरू करें
window.addEventListener('load', () => {
    startGame();
    setupMenus();
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
