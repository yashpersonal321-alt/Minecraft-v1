import * as THREE from 'three';
import { Chunk } from './Chunk.js';

export class World {
    constructor(scene) {
        this.scene = scene;
        this.chunks = new Map();
        this.renderDistance = 4;
        this.seed = Math.floor(Math.random() * 1000000);
        this.loadedChunks = new Set();
        
        // ब्लॉक टेक्सचर मैपिंग
        this.blockTextures = {
            grass: { top: 0x6b8c42, side: 0x8b5a2b, bottom: 0x5a3e1a },
            wood: { top: 0x8b5a2b, side: 0x8b5a2b, bottom: 0x8b5a2b },
            stone: 0x808080,
            brick: 0xb85c1a,
            diamond: 0x4ec0e9,
            air: null
        };
        
        // ब्लॉक मेश कैश
        this.blockMeshes = new Map();
        this.initBlockMeshes();
    }
    
    initBlockMeshes() {
        // सभी ब्लॉक टाइप्स के लिए मेश प्री-जेनरेट करें
        const blockTypes = ['grass', 'wood', 'stone', 'brick', 'diamond'];
        blockTypes.forEach(type => {
            const geometry = new THREE.BoxGeometry(1, 1, 1);
            let material;
            
            if (type === 'grass') {
                material = [
                    new THREE.MeshStandardMaterial({ color: this.blockTextures.grass.side }), // right
                    new THREE.MeshStandardMaterial({ color: this.blockTextures.grass.side }), // left
                    new THREE.MeshStandardMaterial({ color: this.blockTextures.grass.top }),  // top
                    new THREE.MeshStandardMaterial({ color: this.blockTextures.grass.bottom }), // bottom
                    new THREE.MeshStandardMaterial({ color: this.blockTextures.grass.side }), // front
                    new THREE.MeshStandardMaterial({ color: this.blockTextures.grass.side })  // back
                ];
            } else {
                const color = typeof this.blockTextures[type] === 'object' ? 
                    this.blockTextures[type].side : this.blockTextures[type];
                material = new THREE.MeshStandardMaterial({ color: color });
            }
            
            const mesh = new THREE.Mesh(geometry, material);
            mesh.castShadow = true;
            mesh.receiveShadow = true;
            this.blockMeshes.set(type, mesh);
        });
    }
    
    async generate() {
        const chunksToLoad = [];
        
        for (let x = -this.renderDistance; x <= this.renderDistance; x++) {
            for (let z = -this.renderDistance; z <= this.renderDistance; z++) {
                chunksToLoad.push(this.loadChunk(x, z));
            }
        }
        
        await Promise.all(chunksToLoad);
        console.log(`World generated with seed: ${this.seed}`);
    }
    
    async loadChunk(chunkX, chunkZ) {
        const key = `${chunkX},${chunkZ}`;
        if (this.chunks.has(key)) return;
        
        const chunk = new Chunk(chunkX, chunkZ, this.seed);
        await chunk.generate();
        
        const chunkGroup = new THREE.Group();
        
        // ब्लॉक प्लेस करें
        for (let x = 0; x < 16; x++) {
            for (let z = 0; z < 16; z++) {
                for (let y = 0; y < chunk.heightMap[x][z] + 1; y++) {
                    const blockType = chunk.getBlock(x, y, z);
                    if (blockType && blockType !== 'air') {
                        const mesh = this.blockMeshes.get(blockType);
                        if (mesh) {
                            const instance = mesh.clone();
                            instance.position.set(
                                chunkX * 16 + x,
                                y,
                                chunkZ * 16 + z
                            );
                            chunkGroup.add(instance);
                        }
                    }
                }
            }
        }
        
        chunk.group = chunkGroup;
        this.scene.add(chunkGroup);
        this.chunks.set(key, chunk);
        this.loadedChunks.add(key);
        
        return chunk;
    }
    
    unloadChunk(chunkX, chunkZ) {
        const key = `${chunkX},${chunkZ}`;
        const chunk = this.chunks.get(key);
        if (chunk && chunk.group) {
            this.scene.remove(chunk.group);
            chunk.group.children.forEach(child => {
                if (child.geometry) child.geometry.dispose();
                if (child.material) child.material.dispose();
            });
            this.chunks.delete(key);
            this.loadedChunks.delete(key);
        }
    }
    
    update(playerPos) {
        const playerChunkX = Math.floor(playerPos.x / 16);
        const playerChunkZ = Math.floor(playerPos.z / 16);
        
        // लोड चंक्स
        for (let x = -this.renderDistance; x <= this.renderDistance; x++) {
            for (let z = -this.renderDistance; z <= this.renderDistance; z++) {
                const chunkX = playerChunkX + x;
                const chunkZ = playerChunkZ + z;
                const key = `${chunkX},${chunkZ}`;
                
                if (!this.chunks.has(key)) {
                    this.loadChunk(chunkX, chunkZ);
                }
            }
        }
        
        // अनलोड दूर वाले चंक्स
        this.loadedChunks.forEach(key => {
            const [cx, cz] = key.split(',').map(Number);
            const dx = Math.abs(cx - playerChunkX);
            const dz = Math.abs(cz - playerChunkZ);
            
            if (dx > this.renderDistance + 1 || dz > this.renderDistance + 1) {
                this.unloadChunk(cx, cz);
            }
        });
    }
    
    getBlock(x, y, z) {
        const chunkX = Math.floor(x / 16);
        const chunkZ = Math.floor(z / 16);
        const key = `${chunkX},${chunkZ}`;
        const chunk = this.chunks.get(key);
        
        if (!chunk) return 'air';
        if (y < 0 || y > 255) return 'air';
        
        const localX = ((x % 16) + 16) % 16;
        const localZ = ((z % 16) + 16) % 16;
        
        return chunk.getBlock(localX, y, localZ);
    }
    
    setBlock(x, y, z, blockType) {
        const chunkX = Math.floor(x / 16);
        const chunkZ = Math.floor(z / 16);
        const key = `${chunkX},${chunkZ}`;
        const chunk = this.chunks.get(key);
        
        if (!chunk) return false;
        if (y < 0 || y > 255) return false;
        
        const localX = ((x % 16) + 16) % 16;
        const localZ = ((z % 16) + 16) % 16;
        
        const oldBlock = chunk.getBlock(localX, y, localZ);
        if (oldBlock === blockType) return false;
        
        chunk.setBlock(localX, y, localZ, blockType);
        
        // मेश अपडेट करें
        this.updateBlockMesh(chunkX, chunkZ, localX, y, localZ, blockType);
        
        return true;
    }
    
    updateBlockMesh(chunkX, chunkZ, localX, y, localZ, blockType) {
        const key = `${chunkX},${chunkZ}`;
        const chunk = this.chunks.get(key);
        if (!chunk || !chunk.group) return;
        
        const worldX = chunkX * 16 + localX;
        const worldZ = chunkZ * 16 + localZ;
        
        // पुराने ब्लॉक को हटाएं
        chunk.group.children.forEach(child => {
            if (child.position.x === worldX && 
                child.position.y === y && 
                child.position.z === worldZ) {
                chunk.group.remove(child);
                if (child.geometry) child.geometry.dispose();
                if (child.material) child.material.dispose();
            }
        });
        
        // नया ब्लॉक जोड़ें
        if (blockType !== 'air') {
            const mesh = this.blockMeshes.get(blockType);
            if (mesh) {
                const instance = mesh.clone();
                instance.position.set(worldX, y, worldZ);
                chunk.group.add(instance);
            }
        }
    }
    
    getHeight(x, z) {
        const chunkX = Math.floor(x / 16);
        const chunkZ = Math.floor(z / 16);
        const key = `${chunkX},${chunkZ}`;
        const chunk = this.chunks.get(key);
        
        if (!chunk) return 64;
        
        const localX = ((x % 16) + 16) % 16;
        const localZ = ((z % 16) + 16) % 16;
        
        return chunk.heightMap[localX][localZ];
    }
             }
