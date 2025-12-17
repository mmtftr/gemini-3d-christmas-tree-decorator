/**
 * LiveMusicHelper - Manages real-time Lyria music generation
 */
import type { AudioChunk, GoogleGenAI, LiveMusicServerMessage, LiveMusicSession } from '@google/genai';
import { decode, decodeAudioData } from './audio';
import { throttle } from './throttle';

export interface MusicPrompt {
  text: string;
  weight: number;
}

export type PlaybackState = 'stopped' | 'playing' | 'loading' | 'paused';

export class LiveMusicHelper extends EventTarget {
  private ai: GoogleGenAI;
  private model: string;

  private session: LiveMusicSession | null = null;
  private sessionPromise: Promise<LiveMusicSession> | null = null;

  private connectionError = true;
  private filteredPrompts = new Set<string>();
  private nextStartTime = 0;
  private bufferTime = 2;

  public readonly audioContext: AudioContext;
  private outputNode: GainNode;
  private playbackState: PlaybackState = 'stopped';

  private prompts: MusicPrompt[] = [];

  constructor(ai: GoogleGenAI, model: string) {
    super();
    this.ai = ai;
    this.model = model;
    this.audioContext = new AudioContext({ sampleRate: 48000 });
    this.outputNode = this.audioContext.createGain();
  }

  private getSession(): Promise<LiveMusicSession> {
    if (!this.sessionPromise) this.sessionPromise = this.connect();
    return this.sessionPromise;
  }

  private async connect(): Promise<LiveMusicSession> {
    this.sessionPromise = this.ai.live.music.connect({
      model: this.model,
      callbacks: {
        onmessage: async (e: LiveMusicServerMessage) => {
          if (e.setupComplete) {
            this.connectionError = false;
          }
          if (e.filteredPrompt) {
            this.filteredPrompts = new Set([...this.filteredPrompts, e.filteredPrompt.text!]);
            this.dispatchEvent(new CustomEvent('filtered-prompt', { detail: e.filteredPrompt }));
          }
          if (e.serverContent?.audioChunks) {
            await this.processAudioChunks(e.serverContent.audioChunks);
          }
        },
        onerror: () => {
          this.connectionError = true;
          this.stop();
          this.dispatchEvent(new CustomEvent('error', { detail: 'Connection error, please restart audio.' }));
        },
        onclose: () => {
          this.connectionError = true;
          this.stop();
          this.dispatchEvent(new CustomEvent('error', { detail: 'Connection closed, please restart audio.' }));
        },
      },
    });
    return this.sessionPromise;
  }

  private setPlaybackState(state: PlaybackState) {
    this.playbackState = state;
    this.dispatchEvent(new CustomEvent('playback-state-changed', { detail: state }));
  }

  private async processAudioChunks(audioChunks: AudioChunk[]) {
    if (this.playbackState === 'paused' || this.playbackState === 'stopped') return;
    const audioBuffer = await decodeAudioData(
      decode(audioChunks[0].data!),
      this.audioContext,
      48000,
      2,
    );
    const source = this.audioContext.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(this.outputNode);
    if (this.nextStartTime === 0) {
      this.nextStartTime = this.audioContext.currentTime + this.bufferTime;
      setTimeout(() => {
        this.setPlaybackState('playing');
      }, this.bufferTime * 1000);
    }
    if (this.nextStartTime < this.audioContext.currentTime) {
      this.setPlaybackState('loading');
      this.nextStartTime = 0;
      return;
    }
    source.start(this.nextStartTime);
    this.nextStartTime += audioBuffer.duration;
  }

  public get activePrompts() {
    return this.prompts.filter((p) => !this.filteredPrompts.has(p.text) && p.weight > 0);
  }

  private async sendPromptsToSession() {
    if (!this.session || this.activePrompts.length === 0) return;

    const weightedPrompts = this.activePrompts.map((p) => ({
      text: p.text,
      weight: p.weight,
    }));

    try {
      await this.session.setWeightedPrompts({ weightedPrompts });
    } catch (e: any) {
      this.dispatchEvent(new CustomEvent('error', { detail: e.message }));
      this.pause();
    }
  }

  private readonly throttledSendPrompts = throttle(async () => {
    await this.sendPromptsToSession();
  }, 200);

  public setWeightedPrompts(prompts: MusicPrompt[]) {
    this.prompts = prompts;
    this.throttledSendPrompts();
  }

  public async play() {
    this.setPlaybackState('loading');
    this.session = await this.getSession();
    await this.sendPromptsToSession();
    this.audioContext.resume();
    this.session.play();
    this.outputNode.connect(this.audioContext.destination);
    this.outputNode.gain.setValueAtTime(0, this.audioContext.currentTime);
    this.outputNode.gain.linearRampToValueAtTime(1, this.audioContext.currentTime + 0.1);
  }

  public pause() {
    if (this.session) this.session.pause();
    this.setPlaybackState('paused');
    this.outputNode.gain.setValueAtTime(1, this.audioContext.currentTime);
    this.outputNode.gain.linearRampToValueAtTime(0, this.audioContext.currentTime + 0.1);
    this.nextStartTime = 0;
    this.outputNode = this.audioContext.createGain();
  }

  public stop() {
    if (this.session) this.session.stop();
    this.setPlaybackState('stopped');
    this.outputNode.gain.setValueAtTime(0, this.audioContext.currentTime);
    this.nextStartTime = 0;
    this.session = null;
    this.sessionPromise = null;
  }

  public async playPause() {
    switch (this.playbackState) {
      case 'playing':
        return this.pause();
      case 'paused':
      case 'stopped':
        return this.play();
      case 'loading':
        return this.stop();
    }
  }

  public getPlaybackState(): PlaybackState {
    return this.playbackState;
  }
}
