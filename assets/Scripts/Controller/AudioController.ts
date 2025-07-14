import { _decorator, Component, Node, AudioSource, AudioClip, resources, sys, game } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('AudioManager')
export class AudioManager extends Component {
    
    private static instance: AudioManager = null;
    
    @property(AudioSource)
    musicSource: AudioSource = null;
    
    @property(AudioSource)
    sfxSource: AudioSource = null;
    
    @property([AudioClip])
    musicClips: AudioClip[] = [];
    
    @property([AudioClip])
    sfxClips: AudioClip[] = [];
    
    // Settings
    private musicVolume: number = 1.0;
    private sfxVolume: number = 1.0;
    private musicEnabled: boolean = true;
    private sfxEnabled: boolean = true;
    
    // Audio clip maps for easy access
    private musicMap: Map<string, AudioClip> = new Map();
    private sfxMap: Map<string, AudioClip> = new Map();
    
    onLoad() {
        // Singleton pattern
        if (AudioManager.instance) {
            this.destroy();
            return;
        }
        AudioManager.instance = this;
        
        // Don't destroy on scene change
        game.addPersistRootNode(this.node);
        
        // Initialize audio maps
        this.initializeAudioMaps();
        
        // Load settings
        this.loadSettings();
    }
    
    start() {
        // Set initial volumes
        this.updateVolumes();

        this.playMusic('BGM_MM', true, true); // Play default music if available
    }
    
    private initializeAudioMaps() {
        // Map music clips by name
        this.musicClips.forEach(clip => {
            if (clip) {
                this.musicMap.set(clip.name, clip);
            }
        });
        
        // Map SFX clips by name
        this.sfxClips.forEach(clip => {
            if (clip) {
                this.sfxMap.set(clip.name, clip);
            }
        });
    }
    
    static getInstance(): AudioManager {
        return AudioManager.instance;
    }
    
    // Music Methods
    playMusic(clipName: string, loop: boolean = true, fadeIn: boolean = false) {
        if (!this.musicEnabled) return;
        
        const clip = this.musicMap.get(clipName);
        if (!clip) {
            console.warn(`Music clip ${clipName} not found`);
            return;
        }
        
        this.musicSource.stop();
        this.musicSource.clip = clip;
        this.musicSource.loop = loop;
        
        if (fadeIn) {
            this.musicSource.volume = 0;
            this.musicSource.play();
            this.fadeInMusic();
        } else {
            this.musicSource.play();
        }
    }
    
    stopMusic(fadeOut: boolean = false) {
        if (fadeOut) {
            this.fadeOutMusic();
        } else {
            this.musicSource.stop();
        }
    }
    
    pauseMusic() {
        this.musicSource.pause();
    }
    
    resumeMusic() {
        if (this.musicEnabled) {
            this.musicSource.play();
        }
    }
    
    // SFX Methods
    playSound(clipName: string, volume: number = 1.0) {
        if (!this.sfxEnabled) return;
        
        const clip = this.sfxMap.get(clipName);
        if (!clip) {
            console.warn(`SFX clip ${clipName} not found`);
            return;
        }
        
        this.sfxSource.playOneShot(clip, volume);
    }
    
    // Volume Control
    setMusicVolume(volume: number) {
        this.musicVolume = Math.max(0, Math.min(1, volume));
        this.updateVolumes();
        this.saveSettings();
    }
    
    setSFXVolume(volume: number) {
        this.sfxVolume = Math.max(0, Math.min(1, volume));
        this.updateVolumes();
        this.saveSettings();
    }
    
    getMusicVolume(): number {
        return this.musicVolume;
    }
    
    getSFXVolume(): number {
        return this.sfxVolume;
    }
    
    // Enable/Disable Audio
    enableMusic(enabled: boolean) {
        this.musicEnabled = enabled;
        if (!enabled) {
            this.musicSource.pause();
        } else {
            this.musicSource.play();
        }
        this.saveSettings();
    }
    
    enableSFX(enabled: boolean) {
        this.sfxEnabled = enabled;
        this.saveSettings();
    }
    
    isMusicEnabled(): boolean {
        return this.musicEnabled;
    }
    
    isSFXEnabled(): boolean {
        return this.sfxEnabled;
    }
    
    // Private Methods
    private updateVolumes() {
        this.musicSource.volume = this.musicVolume;
        this.sfxSource.volume = this.sfxVolume;
    }
    
    private fadeInMusic(duration: number = 1.0) {
        const targetVolume = this.musicVolume;
        const startVolume = 0;
        const startTime = Date.now();
        
        const fade = () => {
            const elapsed = (Date.now() - startTime) / 1000;
            const progress = Math.min(elapsed / duration, 1);
            
            this.musicSource.volume = startVolume + (targetVolume - startVolume) * progress;
            
            if (progress < 1) {
                requestAnimationFrame(fade);
            }
        };
        
        fade();
    }
    
    private fadeOutMusic(duration: number = 1.0) {
        const startVolume = this.musicSource.volume;
        const startTime = Date.now();
        
        const fade = () => {
            const elapsed = (Date.now() - startTime) / 1000;
            const progress = Math.min(elapsed / duration, 1);
            
            this.musicSource.volume = startVolume * (1 - progress);
            
            if (progress < 1) {
                requestAnimationFrame(fade);
            } else {
                this.musicSource.stop();
                this.musicSource.volume = this.musicVolume;
            }
        };
        
        fade();
    }
    
    // Settings Persistence
    private saveSettings() {
        const settings = {
            musicVolume: this.musicVolume,
            sfxVolume: this.sfxVolume,
            musicEnabled: this.musicEnabled,
            sfxEnabled: this.sfxEnabled
        };
        
        sys.localStorage.setItem('audioSettings', JSON.stringify(settings));
    }
    
    private loadSettings() {
        const savedSettings = sys.localStorage.getItem('audioSettings');
        if (savedSettings) {
            try {
                const settings = JSON.parse(savedSettings);
                this.musicVolume = settings.musicVolume || 1.0;
                this.sfxVolume = settings.sfxVolume || 1.0;
                this.musicEnabled = settings.musicEnabled !== false;
                this.sfxEnabled = settings.sfxEnabled !== false;
            } catch (e) {
                console.warn('Failed to load audio settings:', e);
            }
        }
    }
    
    // Utility Methods
    getCurrentMusicName(): string {
        return this.musicSource.clip ? this.musicSource.clip.name : '';
    }
    
    isMusicPlaying(): boolean {
        return this.musicSource.playing;
    }
    
    // Dynamic Loading
    loadAudioFromResources(path: string, callback?: (clip: AudioClip) => void) {
        resources.load(path, AudioClip, (err, clip) => {
            if (err) {
                console.error(`Failed to load audio: ${path}`, err);
                return;
            }
            
            if (callback) {
                callback(clip);
            }
        });
    }
}

// Usage Examples:
/*
// In your game scripts:
const audioManager = AudioManager.getInstance();

// Play background music
audioManager.playMusic('background_music', true, true);

// Play sound effects
audioManager.playSound('shoot_sound');
audioManager.playSound('explosion_sound', 0.8);

// Control volumes
audioManager.setMusicVolume(0.7);
audioManager.setSFXVolume(0.9);

// Enable/disable audio
audioManager.enableMusic(false);
audioManager.enableSFX(true);
*/