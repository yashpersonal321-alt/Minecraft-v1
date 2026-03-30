import * as THREE from 'three';

export class Player {
    constructor(camera, world) {
        this.camera = camera;
        this.world = world;
        this.position = new THREE.Vector3(0, 70, 0);
        this.velocity = new THREE.Vector3(0, 0, 0);
        this.rotation = { x: 0, y: 0 };
        
        this.speed = 5.0;
        this.jumpPower = 5.0;
        this.gravity = 20.0;
        this.onGround = true;
        
        // कैमरा सेट करें
        this.camera.position.copy(this.position);
        this.updateCameraRotation();
    }
    
    update(moveX, moveZ, jump, deltaTime) {
        // मूवमेंट
        const move = new THREE.Vector3(moveX, 0, moveZ);
        move.normalize();
        
        const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(this.camera.quaternion);
        const right = new THREE.Vector3(1, 0, 0).applyQuaternion(this.camera.quaternion);
        forward.y = 0;
        right.y = 0;
        forward.normalize();
        right.normalize();
        
        let dx = 0, dz = 0;
        if (move.z !== 0) {
            dx += forward.x * move.z;
            dz += forward.z * move.z;
        }
        if (move.x !== 0) {
            dx += right.x * move.x;
            dz += right.z * move.x;
        }
        
        // नई पोजीशन
        let newX = this.position.x + dx * this.speed * deltaTime;
        let newZ = this.position.z + dz * this.speed * deltaTime;
        
        // कॉलिजन चेक (X)
        if (!this.checkCollision(newX, this.position.y, this.position.z)) {
            this.position.x = newX;
        }
        
        // कॉलिजन चेक (Z)
        if (!this.checkCollision(this.position.x, this.position.y, newZ)) {
            this.position.z = newZ;
        }
        
        // ग्रेविटी और जंप
        this.velocity.y -= this.gravity * deltaTime;
        
        if (jump && this.onGround) {
            this.velocity.y = this.jumpPower;
            this.onGround = false;
        }
        
        // Y पोजीशन अपडेट
        let newY = this.position.y + this.velocity.y * deltaTime;
        
        // ग्राउंड कॉलिजन
        const feetY = Math.floor(newY);
        const headY = Math.ceil(newY + 1.6);
        let grounded = false;
        
        for (let y = feetY; y <= headY; y++) {
            if (this.checkCollision(this.position.x, y, this.position.z)) {
                if (this.velocity.y < 0) {
                    newY = y;
                    this.velocity.y = 0;
                    grounded = true;
                } else if (this.velocity.y > 0) {
                    newY = y - 1.6;
                    this.velocity.y = 0;
                }
            }
        }
        
        this.position.y = newY;
        this.onGround = grounded;
        
        // कैमरा अपडेट
        this.camera.position.copy(this.position);
        this.updateCameraRotation();
    }
    
    checkCollision(x, y, z) {
        // प्लेयर का हिटबॉक्स 0.6x1.6
        const minX = Math.floor(x - 0.3);
        const maxX = Math.ceil(x + 0.3);
        const minY = Math.floor(y);
        const maxY = Math.ceil(y + 1.6);
        const minZ = Math.floor(z - 0.3);
        const maxZ = Math.ceil(z + 0.3);
        
        for (let ix = minX; ix <= maxX; ix++) {
            for (let iy = minY; iy <= maxY; iy++) {
                for (let iz = minZ; iz <= maxZ; iz++) {
                    const block = this.world.getBlock(ix, iy, iz);
                    if (block && block !== 'air' && block !== 'leaves') {
                        return true;
                    }
                }
            }
        }
        return false;
    }
    
    getLookingAtBlock(maxDistance) {
        const direction = new THREE.Vector3(0, 0, -1).applyQuaternion(this.camera.quaternion);
        const start = this.camera.position.clone();
        
        for (let i = 0; i <= maxDistance * 2; i++) {
            const point = start.clone().add(direction.clone().multiplyScalar(i * 0.5));
            const blockX = Math.floor(point.x);
            const blockY = Math.floor(point.y);
            const blockZ = Math.floor(point.z);
            
            const block = this.world.getBlock(blockX, blockY, blockZ);
            if (block && block !== 'air') {
                // फेस डिटेक्ट करें
                const hitPoint = point;
                const face = this.getFace(hitPoint, blockX, blockY, blockZ);
                return { x: blockX, y: blockY, z: blockZ, face: face };
            }
        }
        return null;
    }
    
    getFace(point, bx, by, bz) {
        const dx = point.x - bx - 0.5;
        const dy = point.y - by - 0.5;
        const dz = point.z - bz - 0.5;
        
        const absDx = Math.abs(dx);
        const absDy = Math.abs(dy);
        const absDz = Math.abs(dz);
        
        if (absDx > absDy && absDx > absDz) {
            return dx > 0 ? 'right' : 'left';
        } else if (absDy > absDx && absDy > absDz) {
            return dy > 0 ? 'top' : 'bottom';
        } else {
            return dz > 0 ? 'front' : 'back';
        }
    }
    
    rotate(dx, dy) {
        this.rotation.y -= dx;
        this.rotation.x -= dy;
        
        // लिमिट vertical rotation
        this.rotation.x = Math.max(-Math.PI / 2.2, Math.min(Math.PI / 2.2, this.rotation.x));
        
        this.updateCameraRotation();
    }
    
    updateCameraRotation() {
        const euler = new THREE.Euler(this.rotation.x, this.rotation.y, 0, 'YXZ');
        this.camera.quaternion.setFromEuler(euler);
    }
  }
