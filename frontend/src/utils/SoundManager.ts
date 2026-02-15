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

        // Dynamic Pitching: Randomize pitch slightly for realism (Mechanical Switch Feel)
        // Base frequency 600Hz, variance +/- 50Hz
        const variance = (Math.random() * 100) - 50;
        const baseFreq = 600;
        osc.frequency.setValueAtTime(baseFreq + variance, this.audioContext.currentTime);

        // Also add a tiny bit of detune for "imperfection"
        osc.detune.value = Math.random() * 20 - 10;

        osc.type = 'triangle';

        // Envelope - crisp attack, short decay
        gain.gain.setValueAtTime(0, this.audioContext.currentTime);
        gain.gain.linearRampToValueAtTime(0.8, this.audioContext.currentTime + 0.005); // Faster attack
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
