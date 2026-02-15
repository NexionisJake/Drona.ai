class SoundManager {
    private audioContext: AudioContext | null = null;
    private gainNode: GainNode | null = null;
    private enabled: boolean = true;

    constructor() {
        this.init();
    }

    private init() {
        if (typeof window !== 'undefined' && !this.audioContext) {
            try {
                this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
                this.gainNode = this.audioContext.createGain();
                this.gainNode.connect(this.audioContext.destination);
                this.gainNode.gain.value = 0.1; // Low volume default
            } catch (e) {
                console.error("Web Audio API not supported", e);
            }
        }
    }

    public toggle(enabled: boolean) {
        this.enabled = enabled;
        if (enabled && this.audioContext?.state === 'suspended') {
            this.audioContext.resume();
        }
    }

    public playKeyClick() {
        if (!this.enabled || !this.audioContext || !this.gainNode) return;

        // Create a short, high-pitched "click"
        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();

        osc.connect(gain);
        gain.connect(this.gainNode);

        // Randomize pitch slightly for realism
        const variance = Math.random() * 50 - 25;
        osc.frequency.setValueAtTime(600 + variance, this.audioContext.currentTime);
        osc.type = 'triangle';

        // Envelope
        gain.gain.setValueAtTime(0, this.audioContext.currentTime);
        gain.gain.linearRampToValueAtTime(0.8, this.audioContext.currentTime + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.08);

        osc.start();
        osc.stop(this.audioContext.currentTime + 0.1);
    }

    public playFlowRankUp() {
        if (!this.enabled || !this.audioContext || !this.gainNode) return;

        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();

        osc.connect(gain);
        gain.connect(this.gainNode);

        osc.frequency.setValueAtTime(440, this.audioContext.currentTime);
        osc.frequency.exponentialRampToValueAtTime(880, this.audioContext.currentTime + 0.3);
        osc.type = 'sine';

        gain.gain.setValueAtTime(0, this.audioContext.currentTime);
        gain.gain.linearRampToValueAtTime(0.5, this.audioContext.currentTime + 0.1);
        gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.5);

        osc.start();
        osc.stop(this.audioContext.currentTime + 0.5);
    }

    public playAccessDenied() {
        if (!this.enabled || !this.audioContext || !this.gainNode) return;

        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();

        osc.connect(gain);
        gain.connect(this.gainNode);

        osc.frequency.setValueAtTime(150, this.audioContext.currentTime);
        osc.type = 'sawtooth';

        gain.gain.setValueAtTime(0.5, this.audioContext.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.4);

        osc.start();
        osc.stop(this.audioContext.currentTime + 0.4);
    }
}

export const soundManager = new SoundManager();
