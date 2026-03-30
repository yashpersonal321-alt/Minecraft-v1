export class MobileControls {
    constructor(gameEngine) {
        this.gameEngine = gameEngine;
        this.joystickActive = false;
        this.joystickStart = { x: 0, y: 0 };
        this.joystickCurrent = { x: 0, y: 0 };
        
        this.init();
    }
    
    init() {
        const joystickArea = document.getElementById('joystick-area');
        const joystickHandle = document.getElementById('joystick-handle');
        
        if (!joystickArea || !joystickHandle) return;
        
        // टच स्टार्ट
        joystickArea.addEventListener('touchstart', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            const rect = joystickArea.getBoundingClientRect();
            this.joystickStart = {
                x: rect.left + rect.width / 2,
                y: rect.top + rect.height / 2
            };
            this.joystickActive = true;
            this.updateJoystick(touch.clientX, touch.clientY, joystickHandle);
        });
        
        // टच मूव
        joystickArea.addEventListener('touchmove', (e) => {
            e.preventDefault();
            if (!this.joystickActive) return;
            const touch = e.touches[0];
            this.updateJoystick(touch.clientX, touch.clientY, joystickHandle);
        });
        
        // टच एंड
        joystickArea.addEventListener('touchend', (e) => {
            e.preventDefault();
            this.joystickActive = false;
            joystickHandle.style.transform = 'translate(-50%, -50%)';
            
            if (this.gameEngine) {
                this.gameEngine.moveDirection = { x: 0, z: 0 };
            }
        });
        
        // माउस सपोर्ट (डिबगिंग के लिए)
        joystickArea.addEventListener('mousedown', (e) => {
            const rect = joystickArea.getBoundingClientRect();
            this.joystickStart = {
                x: rect.left + rect.width / 2,
                y: rect.top + rect.height / 2
            };
            this.joystickActive = true;
            
            const moveHandler = (moveEvent) => {
                this.updateJoystick(moveEvent.clientX, moveEvent.clientY, joystickHandle);
            };
            const upHandler = () => {
                this.joystickActive = false;
                joystickHandle.style.transform = 'translate(-50%, -50%)';
                if (this.gameEngine) {
                    this.gameEngine.moveDirection = { x: 0, z: 0 };
                }
                window.removeEventListener('mousemove', moveHandler);
                window.removeEventListener('mouseup', upHandler);
            };
            window.addEventListener('mousemove', moveHandler);
            window.addEventListener('mouseup', upHandler);
        });
    }
    
    updateJoystick(clientX, clientY, handle) {
        const dx = clientX - this.joystickStart.x;
        const dy = clientY - this.joystickStart.y;
        
        const distance = Math.min(40, Math.sqrt(dx * dx + dy * dy));
        const angle = Math.atan2(dy, dx);
        
        const offsetX = Math.cos(angle) * distance;
        const offsetY = Math.sin(angle) * distance;
        
        handle.style.transform = `translate(calc(-50% + ${offsetX}px), calc(-50% + ${offsetY}px))`;
        
        // मूवमेंट वैल्यू नॉर्मलाइज़ करें
        let moveX = (dx / 40) * 2;
        let moveZ = (dy / 40) * 2;
        
        moveX = Math.max(-1, Math.min(1, moveX));
        moveZ = Math.max(-1, Math.min(1, moveZ));
        
        if (this.gameEngine) {
            this.gameEngine.moveDirection = { x: moveX, z: moveZ };
        }
    }
}
