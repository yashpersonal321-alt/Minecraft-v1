import * as THREE from 'three';
import { World } from './World.js';
import { Player } from './Player.js';
import { Renderer } from '../rendering/Renderer.js';
import { NPCManager } from '../npc/NPCManager.js';

export class GameEngine {
    constructor(canvas) {
        this.canvas = canvas;
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.world = null;
        this.player = null;
        this.npcManager = null;
        this.clock = new THREE.Clock();
        
        // गेम स्टेट
        this.isRunning = false;
        this.isPaused = false;
        this.dayTime = 0; // 0 से 1 तक (0 = सुबह, 0.5 = रात)
        this.daySpeed = 0.002;
        
        // इनपुट स्टेट
        this.keys = {
            forward: false, backward: false, left: false, right: false,
            jump: false, breakBlock: false, placeBlock: false
        };
        
        // मोबाइल कंट्रोल्स के लिए
        this.moveDirection = { x: 0, z: 0 };
        this.isBreaking = false;
        this.breakCooldown = 0;
        
        // ब्लॉक सेलेक्शन
        this.selectedBlockSlot = 0;
        this.blocks = ['grass', 'wood', 'stone', 'brick', 'diamond'];
        
        // एनीमेशन टाइमर
        this.animationTime = 0;
        this.breakingAnimation = 0;
        
        this.init();
    }
    
    async init() {
        // सीन बनाएं
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x87CEEB);
        this.scene.fog = new THREE.Fog(0x87CEEB, 100, 200);
        
        // कैमरा बनाएं
        this.camera = new THREE.PerspectiveCamera(
            75, window.innerWidth / window.innerHeight, 0.1, 1000
        );
        this.camera.position.set(0, 1.6, 0);
        
        // रेंडरर बनाएं
        this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        
        // लाइटिंग - नेक्स्ट लेवल
        this.setupLighting();
        
        // वर्ल्ड बनाएं
        this.world = new World(this.scene);
        await this.world.generate();
        
        // प्लेयर बनाएं
        this.player = new Player(this.camera, this.world);
        
        // NPC मैनेजर
        this.npcManager = new NPCManager(this.scene, this.world);
        await this.npcManager.spawnNPCs();
        
        // एनवायरनमेंट इफेक्ट्स
        this.setupEnvironment();
        
        // इवेंट लिसनर
        this.setupEventListeners();
        
        console.log('GameEngine initialized successfully');
    }
    
    setupLighting() {
        // एम्बियंट लाइट
        this.ambientLight = new THREE.AmbientLight(0x404060, 0.6);
        this.scene.add(this.ambientLight);
        
        // डायरेक्शनल लाइट (सूरज)
        this.sunLight = new THREE.DirectionalLight(0xfff5d1, 1.2);
        this.sunLight.position.set(50, 100, 50);
        this.sunLight.castShadow = true;
        this.sunLight.receiveShadow = true;
        this.sunLight.shadow.mapSize.width = 1024;
        this.sunLight.shadow.mapSize.height = 1024;
        this.sunLight.shadow.camera.near = 0.5;
        this.sunLight.shadow.camera.far = 150;
        this.sunLight.shadow.camera.left = -20;
        this.sunLight.shadow.camera.right = 20;
        this.sunLight.shadow.camera.top = 20;
        this.sunLight.shadow.camera.bottom = -20;
        this.scene.add(this.sunLight);
        
        // भराव लाइट (fill light)
        this.fillLight = new THREE.PointLight(0x4466cc, 0.3);
        this.fillLight.position.set(0, 10, 0);
        this.scene.add(this.fillLight);
        
        // रात की रोशनी के लिए मूनलाइट
        this.moonLight = new THREE.DirectionalLight(0x6688aa, 0.2);
        this.moonLight.position.set(-50, 80, -50);
        this.scene.add(this.moonLight);
        
        // टॉर्च इफेक्ट के लिए (प्लेयर के आसपास)
        this.playerLight = new THREE.PointLight(0xffaa66, 0.5, 15);
        this.scene.add(this.playerLight);
    }
    
    setupEnvironment() {
        // बादलों के लिए (सिंपल)
        this.clouds = [];
        for (let i = 0; i < 30; i++) {
            const cloudGeo = new THREE.BoxGeometry(2, 0.3, 1.5);
            const cloudMat = new THREE.MeshStandardMaterial({ color: 0xffffff, transparent: true, opacity: 0.7 });
            const cloud = new THREE.Mesh(cloudGeo, cloudMat);
            cloud.position.x = (Math.random() - 0.5) * 200;
            cloud.position.y = 70 + Math.random() * 10;
            cloud.position.z = (Math.random() - 0.5) * 200;
            cloud.castShadow = false;
            this.scene.add(cloud);
            this.clouds.push(cloud);
        }
        
        // पार्टिकल सिस्टम (तितलियाँ / पत्तियाँ)
        this.particles = [];
        const particleCount = 200;
        for (let i = 0; i < particleCount; i++) {
            const particleGeo = new THREE.SphereGeometry(0.05, 4, 4);
            const particleMat = new THREE.MeshStandardMaterial({ color: 0x88ff88, emissive: 0x226622 });
            const particle = new THREE.Mesh(particleGeo, particleMat);
            particle.userData = {
                velocityY: Math.random() * 0.02,
                speed: 0.01 + Math.random() * 0.02,
                angle: Math.random() * Math.PI * 2
            };
            this.scene.add(particle);
            this.particles.push(particle);
        }
    }
    
    setupEventListeners() {
        // कीबोर्ड
        window.addEventListener('keydown', (e) => this.onKeyDown(e));
        window.addEventListener('keyup', (e) => this.onKeyUp(e));
        
        // माउस लॉक (PC के लिए)
        this.canvas.addEventListener('click', () => {
            this.canvas.requestPointerLock();
        });
        
        document.addEventListener('pointerlockchange', () => {
            if (document.pointerLockElement === this.canvas) {
                document.addEventListener('mousemove', (e) => this.onMouseMove(e));
            } else {
                document.removeEventListener('mousemove', (e) => this.onMouseMove(e));
            }
        });
        
        // मोबाइल टच इवेंट्स
        this.setupMobileEvents();
    }
    
    setupMobileEvents() {
        // ब्रेक बटन
        const breakBtn = document.getElementById('break-btn');
        if (breakBtn) {
            breakBtn.addEventListener('mousedown', () => { this.isBreaking = true; });
            breakBtn.addEventListener('mouseup', () => { this.isBreaking = false; });
            breakBtn.addEventListener('touchstart', (e) => { e.preventDefault(); this.isBreaking = true; });
            breakBtn.addEventListener('touchend', () => { this.isBreaking = false; });
        }
        
        // प्लेस बटन
        const placeBtn = document.getElementById('place-btn');
        if (placeBtn) {
            placeBtn.addEventListener('click', () => {
                this.placeBlockAtCrosshair();
            });
            placeBtn.addEventListener('touchstart', (e) => {
                e.preventDefault();
                this.placeBlockAtCrosshair();
            });
        }
        
        // जंप बटन
        const jumpBtn = document.getElementById('jump-btn');
        if (jumpBtn) {
            jumpBtn.addEventListener('click', () => { this.keys.jump = true; setTimeout(() => { this.keys.jump = false; }, 200); });
            jumpBtn.addEventListener('touchstart', (e) => { e.preventDefault(); this.keys.jump = true; setTimeout(() => { this.keys.jump = false; }, 200); });
        }
        
        // हॉटबार सिलेक्शन
        const slots = document.querySelectorAll('.hotbar-slot');
        slots.forEach((slot, idx) => {
            slot.addEventListener('click', () => {
                this.selectedBlockSlot = idx;
                slots.forEach(s => s.classList.remove('selected'));
                slot.classList.add('selected');
                this.updateBlockInfo();
            });
        });
    }
    
    onKeyDown(e) {
        switch(e.code) {
            case 'KeyW': this.keys.forward = true; break;
            case 'KeyS': this.keys.backward = true; break;
            case 'KeyA': this.keys.left = true; break;
            case 'KeyD': this.keys.right = true; break;
            case 'Space': this.keys.jump = true; break;
            case 'Digit1': this.selectedBlockSlot = 0; this.updateBlockInfo(); break;
            case 'Digit2': this.selectedBlockSlot = 1; this.updateBlockInfo(); break;
            case 'Digit3': this.selectedBlockSlot = 2; this.updateBlockInfo(); break;
            case 'Digit4': this.selectedBlockSlot = 3; this.updateBlockInfo(); break;
            case 'Digit5': this.selectedBlockSlot = 4; this.updateBlockInfo(); break;
        }
    }
    
    onKeyUp(e) {
        switch(e.code) {
            case 'KeyW': this.keys.forward = false; break;
            case 'KeyS': this.keys.backward = false; break;
            case 'KeyA': this.keys.left = false; break;
            case 'KeyD': this.keys.right = false; break;
            case 'Space': this.keys.jump = false; break;
        }
    }
    
    onMouseMove(e) {
        if (document.pointerLockElement !== this.canvas) return;
        const sensitivity = 0.002;
        this.player.rotate(e.movementX * sensitivity, e.movementY * sensitivity);
    }
    
    updateBlockInfo() {
        const blockName = document.getElementById('block-name');
        if (blockName) {
            const names = { grass: '🌿 घास', wood: '🪵 लकड़ी', stone: '🪨 पत्थर', brick: '🧱 ईंट', diamond: '💎 हीरा' };
            blockName.innerText = names[this.blocks[this.selectedBlockSlot]] || 'ब्लॉक';
        }
    }
    
    placeBlockAtCrosshair() {
        const hit = this.player.getLookingAtBlock(4);
        if (hit) {
            const placePos = hit.face === 'front' ? { x: hit.x, y: hit.y, z: hit.z + 1 } :
                            hit.face === 'back' ? { x: hit.x, y: hit.y, z: hit.z - 1 } :
                            hit.face === 'right' ? { x: hit.x + 1, y: hit.y, z: hit.z } :
                            hit.face === 'left' ? { x: hit.x - 1, y: hit.y, z: hit.z } :
                            hit.face === 'top' ? { x: hit.x, y: hit.y + 1, z: hit.z } :
                            { x: hit.x, y: hit.y - 1, z: hit.z };
            this.world.setBlock(placePos.x, placePos.y, placePos.z, this.blocks[this.selectedBlockSlot]);
        }
    }
    
    breakBlockAtCrosshair() {
        const hit = this.player.getLookingAtBlock(4);
        if (hit) {
            this.world.setBlock(hit.x, hit.y, hit.z, 'air');
            this.breakingAnimation = 0.5;
        }
    }
    
    updateDayNightCycle() {
        this.dayTime += this.daySpeed;
        if (this.dayTime > 1) this.dayTime -= 1;
        
        // सूरज की पोजीशन
        const angle = this.dayTime * Math.PI * 2;
        const sunX = Math.sin(angle) * 100;
        const sunY = Math.cos(angle) * 80;
        this.sunLight.position.set(sunX, sunY + 20, 50);
        
        // लाइट का रंग और इंटेंसिटी
        const intensity = Math.max(0.1, Math.sin(angle) * 0.8 + 0.3);
        this.sunLight.intensity = intensity * 1.2;
        this.moonLight.intensity = (1 - intensity) * 0.4;
        
        // एम्बियंट लाइट भी बदले
        const ambientIntensity = 0.3 + intensity * 0.4;
        this.ambientLight.intensity = ambientIntensity;
        
        // स्काई कलर बदले
        const skyColor = new THREE.Color().setHSL(0.55, 0.6, 0.4 + intensity * 0.3);
        this.scene.background = skyColor;
        if (this.scene.fog) this.scene.fog.color = skyColor;
        
        // HUD अपडेट
        const sunMoonIcon = document.getElementById('sun-moon-icon');
        if (sunMoonIcon) {
            sunMoonIcon.innerText = intensity > 0.6 ? '☀️' : '🌙';
        }
        const timeBar = document.getElementById('time-bar');
        if (timeBar) {
            timeBar.style.width = `${this.dayTime * 100}%`;
            timeBar.style.background = intensity > 0.6 ? '#ffaa44' : '#6688aa';
        }
    }
    
    updateParticles() {
        // पार्टिकल्स को प्लेयर के आसपास रखें
        this.particles.forEach((part, i) => {
            if (!part.userData) return;
            const angle = part.userData.angle + this.animationTime * part.userData.speed;
            const radius = 3 + Math.sin(this.animationTime * 0.5 + i) * 1;
            part.position.x = this.player.position.x + Math.cos(angle) * radius;
            part.position.z = this.player.position.z + Math.sin(angle) * radius;
            part.position.y = this.player.position.y + 0.5 + Math.sin(this.animationTime * 2 + i) * 0.5;
        });
    }
    
    updateClouds() {
        this.clouds.forEach(cloud => {
            cloud.position.x += 0.01;
            if (cloud.position.x > 100) cloud.position.x = -100;
        });
    }
    
    updateAnimation() {
        this.animationTime += 0.016;
        this.breakingAnimation *= 0.95;
        
        // हाथ की एनीमेशन (crosshair के आसपास)
        const crosshair = document.getElementById('crosshair');
        if (crosshair) {
            const scale = 1 + Math.sin(this.animationTime * 20) * 0.1 * this.breakingAnimation;
            crosshair.style.transform = `translate(-50%, -50%) scale(${scale})`;
        }
    }
    
    update() {
        const deltaTime = Math.min(0.033, this.clock.getDelta());
        
        // मूवमेंट
        let moveX = 0, moveZ = 0;
        if (this.keys.forward) moveZ -= 1;
        if (this.keys.backward) moveZ += 1;
        if (this.keys.left) moveX -= 1;
        if (this.keys.right) moveX += 1;
        
        // मोबाइल जॉयस्टिक से मूवमेंट
        if (this.moveDirection.x !== 0 || this.moveDirection.z !== 0) {
            moveX = this.moveDirection.x;
            moveZ = this.moveDirection.z;
        }
        
        this.player.update(moveX, moveZ, this.keys.jump, deltaTime);
        
        // ब्रेकिंग
        if (this.isBreaking) {
            if (this.breakCooldown <= 0) {
                this.breakBlockAtCrosshair();
                this.breakCooldown = 0.2;
            }
            this.breakCooldown -= deltaTime;
        }
        
        // प्लेयर लाइट अपडेट
        this.playerLight.position.copy(this.player.position);
        
        // वर्ल्ड अपडेट
        this.world.update(this.player.position);
        
        // NPC अपडेट
        this.npcManager.update(deltaTime, this.player.position);
        
        // एनवायरनमेंट
        this.updateDayNightCycle();
        this.updateParticles();
        this.updateClouds();
        this.updateAnimation();
        
        // कोऑर्डिनेट्स HUD
        const coordsEl = document.getElementById('coords');
        if (coordsEl) {
            const px = Math.floor(this.player.position.x);
            const py = Math.floor(this.player.position.y);
            const pz = Math.floor(this.player.position.z);
            coordsEl.innerText = `${px}, ${py}, ${pz}`;
        }
        
        // रेंडर
        this.renderer.render(this.scene, this.camera);
    }
    
    start() {
        this.isRunning = true;
        const gameLoop = () => {
            if (!this.isRunning) return;
            if (!this.isPaused) {
                this.update();
            }
            requestAnimationFrame(gameLoop);
        };
        gameLoop();
    }
    
    stop() {
        this.isRunning = false;
    }
                  }
