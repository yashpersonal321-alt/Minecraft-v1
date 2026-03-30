import * as THREE from 'three';

export class Renderer {
    constructor(canvas) {
        this.canvas = canvas;
        this.renderer = null;
        this.scene = null;
        this.camera = null;
        
        this.init();
    }
    
    init() {
        this.renderer = new THREE.WebGLRenderer({ 
            canvas: this.canvas, 
            antialias: true,
            powerPreference: "high-performance"
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        
        // पोस्ट प्रोसेसिंग के लिए
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.2;
    }
    
    setScene(scene) {
        this.scene = scene;
    }
    
    setCamera(camera) {
        this.camera = camera;
    }
    
    render() {
        if (this.scene && this.camera) {
            this.renderer.render(this.scene, this.camera);
        }
    }
    
    resize(width, height) {
        this.renderer.setSize(width, height);
    }
    
    dispose() {
        this.renderer.dispose();
    }
}
