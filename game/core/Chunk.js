export class Chunk {
    constructor(x, z, seed) {
        this.x = x;
        this.z = z;
        this.seed = seed;
        this.blocks = new Array(16);
        this.heightMap = new Array(16);
        
        // इनिशियलाइज़
        for (let i = 0; i < 16; i++) {
            this.blocks[i] = new Array(256);
            this.heightMap[i] = new Array(16);
            for (let j = 0; j < 16; j++) {
                this.blocks[i][j] = new Array(256);
                for (let k = 0; k < 256; k++) {
                    this.blocks[i][j][k] = 'air';
                }
            }
        }
    }
    
    async generate() {
        // प्रोसीजरल टेरेन जेनरेशन
        for (let x = 0; x < 16; x++) {
            for (let z = 0; z < 16; z++) {
                const worldX = this.x * 16 + x;
                const worldZ = this.z * 16 + z;
                
                // सिम्पल नॉइज़ फंक्शन
                const height = this.getHeightAt(worldX, worldZ);
                this.heightMap[x][z] = height;
                
                // ग्राउंड ब्लॉक्स
                for (let y = 0; y <= height; y++) {
                    if (y === height) {
                        this.blocks[x][y][z] = 'grass';
                    } else if (y >= height - 3) {
                        this.blocks[x][y][z] = 'dirt';
                    } else {
                        this.blocks[x][y][z] = 'stone';
                    }
                }
            }
        }
        
        // पेड़ जेनरेट करें
        this.generateTrees();
        
        // गुफाएं और अयस्क
        this.generateOres();
        
        return this;
    }
    
    getHeightAt(x, z) {
        // सिम्पल पेरिनॉयड नॉइज़
        const freq = 0.05;
        const amp = 8;
        
        const nx = x * freq;
        const nz = z * freq;
        
        // बेस हाइट 64
        let height = 64;
        
        // पहाड़ी इलाके
        height += Math.sin(nx) * Math.cos(nz) * amp;
        height += Math.sin(nx * 2) * Math.cos(nz * 2) * (amp / 2);
        height += Math.sin(nx * 4) * Math.cos(nz * 4) * (amp / 4);
        
        // सीड बेस्ड रैंडमनेस
        const rnd = Math.sin(x * 0.1 + z * 0.1 + this.seed) * 2;
        height += rnd;
        
        return Math.floor(Math.max(1, Math.min(255, height)));
    }
    
    generateTrees() {
        for (let i = 0; i < 8; i++) {
            const x = Math.floor(Math.random() * 16);
            const z = Math.floor(Math.random() * 16);
            const y = this.heightMap[x][z];
            
            // पेड़ लगाने के लिए पर्याप्त जगह हो
            if (y < 60 || y > 80) continue;
            
            // ट्रंक (4-5 ब्लॉक)
            const treeHeight = 4 + Math.floor(Math.random() * 2);
            for (let h = 1; h <= treeHeight; h++) {
                if (y + h < 256) {
                    this.blocks[x][y + h][z] = 'wood';
                }
            }
            
            // पत्तियां (सिंपल)
            const leafY = y + treeHeight;
            for (let lx = -2; lx <= 2; lx++) {
                for (let lz = -2; lz <= 2; lz++) {
                    const dx = x + lx;
                    const dz = z + lz;
                    if (dx >= 0 && dx < 16 && dz >= 0 && dz < 16) {
                        const dist = Math.abs(lx) + Math.abs(lz);
                        if (dist <= 2 && leafY < 256) {
                            if (this.blocks[dx][leafY][dz] === 'air') {
                                this.blocks[dx][leafY][dz] = 'leaves';
                            }
                        }
                        if (dist <= 1 && leafY - 1 < 256 && leafY - 1 > 0) {
                            if (this.blocks[dx][leafY - 1][dz] === 'air') {
                                this.blocks[dx][leafY - 1][dz] = 'leaves';
                            }
                        }
                    }
                }
            }
        }
    }
    
    generateOres() {
        // कोल
        this.generateOreVein('coal', 0, 64, 12);
        // आयरन
        this.generateOreVein('iron', 0, 48, 8);
        // गोल्ड
        this.generateOreVein('gold', 0, 32, 4);
        // डायमंड
        this.generateOreVein('diamond', 0, 16, 2);
    }
    
    generateOreVein(oreType, minY, maxY, veinCount) {
        for (let i = 0; i < veinCount; i++) {
            const x = Math.floor(Math.random() * 16);
            const z = Math.floor(Math.random() * 16);
            const y = minY + Math.floor(Math.random() * (maxY - minY));
            
            const veinSize = 3 + Math.floor(Math.random() * 4);
            for (let v = 0; v < veinSize; v++) {
                const ox = x + (Math.random() - 0.5) * 2;
                const oy = y + (Math.random() - 0.5) * 2;
                const oz = z + (Math.random() - 0.5) * 2;
                
                const bx = Math.floor(ox);
                const by = Math.floor(oy);
                const bz = Math.floor(oz);
                
                if (bx >= 0 && bx < 16 && bz >= 0 && bz < 16 && by > 0 && by < 256) {
                    if (this.blocks[bx][by][bz] === 'stone') {
                        this.blocks[bx][by][bz] = oreType;
                    }
                }
            }
        }
    }
    
    getBlock(x, y, z) {
        if (x < 0 || x >= 16 || z < 0 || z >= 16 || y < 0 || y >= 256) {
            return 'air';
        }
        return this.blocks[x][y][z] || 'air';
    }
    
    setBlock(x, y, z, blockType) {
        if (x >= 0 && x < 16 && z >= 0 && z < 16 && y >= 0 && y < 256) {
            this.blocks[x][y][z] = blockType;
            return true;
        }
        return false;
    }
                             }
