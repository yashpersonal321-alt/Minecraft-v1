export class LoadingScreen {
    constructor() {
        this.element = document.getElementById('loading-screen');
        this.loadingBar = document.getElementById('loading-bar');
        this.loadingText = document.getElementById('loading-text');
    }
    
    show() {
        if (this.element) {
            this.element.style.display = 'flex';
            this.element.style.opacity = '1';
        }
    }
    
    hide() {
        if (this.element) {
            this.element.style.opacity = '0';
            setTimeout(() => {
                this.element.style.display = 'none';
            }, 800);
        }
    }
    
    updateProgress(percent) {
        if (this.loadingBar) {
            this.loadingBar.style.width = `${percent}%`;
        }
        if (this.loadingText) {
            this.loadingText.innerText = `लोड हो रहा है... ${percent}%`;
        }
    }
    
    updateText(text) {
        if (this.loadingText) {
            const percent = this.loadingBar ? this.loadingBar.style.width : '0%';
            this.loadingText.innerText = `${text} ${percent}`;
        }
    }
}
