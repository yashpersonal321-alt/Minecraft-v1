import * as THREE from 'three';

export class NPC {
    constructor(scene, config) {
        this.scene = scene;
        this.type = config.type;
        this.name = config.name;
        this.position = config.position;
        this.dialogList = config.dialog;
        this.dialogColor = config.dialogColor;
        
        this.mesh = null;
        this.speed = 0.5;
        this.wanderTimer = 0;
        this.wanderDirection = { x: 0, z: 0 };
        this.animationTime = 0;
    }
    
    async create() {
        const group = new THREE.Group();
        
        // बॉडी
        const bodyGeo = new THREE.BoxGeometry(0.6, 0.8, 0.6);
        const bodyMat = new THREE.MeshStandardMaterial({ color: this.getBodyColor() });
        const body = new THREE.Mesh(bodyGeo, bodyMat);
        body.position.y = 0.4;
        body.castShadow = true;
        body.receiveShadow = true;
        group.add(body);
        
        // हेड
        const headGeo = new THREE.BoxGeometry(0.5, 0.5, 0.5);
        const headMat = new THREE.MeshStandardMaterial({ color: 0xffccaa });
        const head = new THREE.Mesh(headGeo, headMat);
        head.position.y = 0.85;
        head.castShadow = true;
        group.add(head);
        
        // हैट (प्रोफेशन के हिसाब से)
        const hatGeo = new THREE.BoxGeometry(0.55, 0.15, 0.55);
        const hatMat = new THREE.MeshStandardMaterial({ color: this.getHatColor() });
        const hat = new THREE.Mesh(hatGeo, hatMat);
        hat.position.y = 1.1;
        group.add(hat);
        
        // आंखें
        const eyeGeo = new THREE.SphereGeometry(0.08, 8, 8);
        const eyeMat = new THREE.MeshStandardMaterial({ color: 0x000000 });
        const leftEye = new THREE.Mesh(eyeGeo, eyeMat);
        leftEye.position.set(-0.15, 0.95, 0.26);
        const rightEye = new THREE.Mesh(eyeGeo, eyeMat);
        rightEye.position.set(0.15, 0.95, 0.26);
        group.add(leftEye);
        group.add(rightEye);
        
        group.position.set(this.position.x, this.position.y, this.position.z);
        this.mesh = group;
        this.scene.add(this.mesh);
    }
    
    getBodyColor() {
        const colors = {
            villager: 0x6b8c42,
            farmer: 0x8b5a2b,
            blacksmith: 0x5a3e1a,
            lumberjack: 0x8b5a2b,
            miner: 0x4a5a6a
        };
        return colors[this.type] || 0x6b8c42;
    }
    
    getHatColor() {
        const colors = {
            villager: 0xaa8866,
            farmer: 0xccaa66,
            blacksmith: 0x885522,
            lumberjack: 0x66aa66,
            miner: 0x6688aa
        };
        return colors[this.type] || 0xaa8866;
    }
    
    update(deltaTime, playerPos) {
        this.animationTime += deltaTime;
        
        // आइडल एनीमेशन (थोड़ा ऊपर-नीचे)
        if (this.mesh) {
            const bob = Math.sin(this.animationTime * 3) * 0.02;
            this.mesh.position.y = this.position.y + bob;
        }
        
        // वांडरिंग लॉजिक
        this.wanderTimer -= deltaTime;
        if (this.wanderTimer <= 0) {
            this.wanderTimer = 2 + Math.random() * 3;
            this.wanderDirection = {
                x: (Math.random() - 0.5) * this.speed,
                z: (Math.random() - 0.5) * this.speed
            };
        }
        
        // प्लेयर से दूर न जाए
        const distToPlayer = this.getDistanceTo(playerPos);
        if (distToPlayer < 5 && distToPlayer > 2) {
            // थोड़ा दूर हटे
            const angle = Math.atan2(playerPos.z - this.position.z, playerPos.x - this.position.x);
            this.wanderDirection = {
                x: -Math.cos(angle) * this.speed * 0.5,
                z: -Math.sin(angle) * this.speed * 0.5
            };
        }
        
        // पोजीशन अपडेट
        let newX = this.position.x + this.wanderDirection.x * deltaTime;
        let newZ = this.position.z + this.wanderDirection.z * deltaTime;
        
        // बाउंड्री चेक
        newX = Math.max(-80, Math.min(80, newX));
        newZ = Math.max(-80, Math.min(80, newZ));
        
        this.position.x = newX;
        this.position.z = newZ;
        
        if (this.mesh) {
            this.mesh.position.x = this.position.x;
            this.mesh.position.z = this.position.z;
            
            // प्लेयर की तरफ मुड़ना
            if (distToPlayer < 8) {
                const angle = Math.atan2(playerPos.z - this.position.z, playerPos.x - this.position.x);
                this.mesh.rotation.y = angle;
            } else {
                this.mesh.rotation.y += 0.02;
            }
        }
    }
    
    getDistanceTo(position) {
        const dx = this.position.x - position.x;
        const dz = this.position.z - position.z;
        return Math.sqrt(dx * dx + dz * dz);
    }
    
    getRandomDialog() {
        return this.dialogList[Math.floor(Math.random() * this.dialogList.length)];
    }
          }
