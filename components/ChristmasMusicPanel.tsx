import React, { useEffect, useRef, useState, useCallback } from 'react';
import { GoogleGenAI } from '@google/genai';
import { LiveMusicHelper, MusicPrompt, PlaybackState } from '../utils/LiveMusicHelper';
import { Music, Play, Pause, Loader2, Square, Volume2 } from 'lucide-react';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY, apiVersion: 'v1alpha' });
const model = 'lyria-realtime-exp';

interface ChristmasSlider {
  id: string;
  label: string;
  prompt: string;
  color: string;
  icon: string;
}

const CHRISTMAS_SLIDERS: ChristmasSlider[] = [
  { id: 'jingle', label: 'Jingle Bells', prompt: 'Jingle bells sleigh bells', color: '#ffd700', icon: '🔔' },
  { id: 'orchestral', label: 'Orchestral', prompt: 'Orchestral Christmas symphony', color: '#c0392b', icon: '🎻' },
  { id: 'cozy', label: 'Cozy Fireplace', prompt: 'Cozy warm acoustic christmas', color: '#e67e22', icon: '🔥' },
  { id: 'choir', label: 'Choir', prompt: 'Christmas choir angelic vocals', color: '#9b59b6', icon: '👼' },
  { id: 'jazz', label: 'Holiday Jazz', prompt: 'Smooth jazz christmas lounge', color: '#2980b9', icon: '🎷' },
  { id: 'magical', label: 'Magical', prompt: 'Magical enchanted christmas celesta glockenspiel', color: '#1abc9c', icon: '✨' },
];

export function ChristmasMusicPanel() {
  const liveMusicRef = useRef<LiveMusicHelper | null>(null);
  const [playbackState, setPlaybackState] = useState<PlaybackState>('stopped');
  const [sliderValues, setSliderValues] = useState<Record<string, number>>({
    jingle: 0.7,
    orchestral: 0.4,
    cozy: 0.8,
    choir: 0,
    jazz: 0.65,
    magical: 0.35,
  });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    liveMusicRef.current = new LiveMusicHelper(ai, model);

    const helper = liveMusicRef.current;

    const handleStateChange = (e: Event) => {
      const state = (e as CustomEvent<PlaybackState>).detail;
      setPlaybackState(state);
    };

    const handleError = (e: Event) => {
      const msg = (e as CustomEvent<string>).detail;
      setError(msg);
      setTimeout(() => setError(null), 5000);
    };

    helper.addEventListener('playback-state-changed', handleStateChange);
    helper.addEventListener('error', handleError);

    return () => {
      helper.removeEventListener('playback-state-changed', handleStateChange);
      helper.removeEventListener('error', handleError);
      helper.stop();
    };
  }, []);

  const updatePrompts = useCallback(() => {
    if (!liveMusicRef.current) return;

    const prompts: MusicPrompt[] = CHRISTMAS_SLIDERS
      .filter(s => sliderValues[s.id] > 0)
      .map(s => ({
        text: s.prompt,
        weight: sliderValues[s.id],
      }));

    liveMusicRef.current.setWeightedPrompts(prompts);
  }, [sliderValues]);

  useEffect(() => {
    if (playbackState === 'playing') {
      updatePrompts();
    }
  }, [sliderValues, playbackState, updatePrompts]);

  const handleSliderChange = (id: string, value: number) => {
    setSliderValues(prev => ({ ...prev, [id]: value }));
  };

  const handlePlayPause = async () => {
    if (!liveMusicRef.current) return;

    const activeCount = Object.values(sliderValues).filter(v => v > 0).length;
    if (activeCount === 0 && playbackState === 'stopped') {
      setError('Enable at least one slider to play music');
      setTimeout(() => setError(null), 3000);
      return;
    }

    const prompts: MusicPrompt[] = CHRISTMAS_SLIDERS
      .filter(s => sliderValues[s.id] > 0)
      .map(s => ({
        text: s.prompt,
        weight: sliderValues[s.id],
      }));

    liveMusicRef.current.setWeightedPrompts(prompts);
    await liveMusicRef.current.playPause();
  };

  const getPlayIcon = () => {
    switch (playbackState) {
      case 'loading':
        return <Loader2 className="animate-spin" size={20} />;
      case 'playing':
        return <Pause size={20} />;
      case 'paused':
      case 'stopped':
        return <Play size={20} />;
    }
  };

  const getPlayLabel = () => {
    switch (playbackState) {
      case 'loading':
        return 'Loading...';
      case 'playing':
        return 'Pause';
      case 'paused':
        return 'Resume';
      case 'stopped':
        return 'Play';
    }
  };

  return (
    <div className="bg-black/50 backdrop-blur-md p-4 rounded-xl border border-white/10 w-72">
      <div className="flex items-center gap-2 mb-4">
        <Music size={18} className="text-red-400" />
        <h2 className="text-sm font-bold text-white">Christmas Music</h2>
        <span className="text-[10px] px-1.5 py-0.5 bg-green-600/30 text-green-300 rounded ml-auto">
          Lyria AI
        </span>
      </div>

      {error && (
        <div className="mb-3 text-xs text-red-400 bg-red-400/10 rounded px-2 py-1.5">
          {error}
        </div>
      )}

      <div className="space-y-3 mb-4">
        {CHRISTMAS_SLIDERS.map(slider => (
          <div key={slider.id} className="space-y-1">
            <div className="flex justify-between items-center text-xs">
              <span className="text-gray-300 flex items-center gap-1.5">
                <span>{slider.icon}</span>
                {slider.label}
              </span>
              <span
                className="font-mono text-[10px] px-1 rounded"
                style={{
                  backgroundColor: sliderValues[slider.id] > 0 ? `${slider.color}30` : 'transparent',
                  color: sliderValues[slider.id] > 0 ? slider.color : '#666'
                }}
              >
                {Math.round(sliderValues[slider.id] * 100)}%
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={sliderValues[slider.id]}
              onChange={(e) => handleSliderChange(slider.id, parseFloat(e.target.value))}
              className="w-full h-1.5 rounded-lg appearance-none cursor-pointer"
              style={{
                background: `linear-gradient(to right, ${slider.color} 0%, ${slider.color} ${sliderValues[slider.id] * 100}%, #374151 ${sliderValues[slider.id] * 100}%, #374151 100%)`,
              }}
            />
          </div>
        ))}
      </div>

      <button
        onClick={handlePlayPause}
        disabled={playbackState === 'loading'}
        className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-lg font-medium text-sm transition-all ${
          playbackState === 'playing'
            ? 'bg-red-600 hover:bg-red-500 text-white'
            : playbackState === 'loading'
            ? 'bg-gray-600 text-gray-300 cursor-wait'
            : 'bg-green-600 hover:bg-green-500 text-white'
        }`}
      >
        {getPlayIcon()}
        {getPlayLabel()}
      </button>

      {playbackState === 'playing' && (
        <div className="mt-3 flex items-center justify-center gap-1 text-green-400">
          <Volume2 size={14} className="animate-pulse" />
          <span className="text-[10px]">Generating Christmas music...</span>
        </div>
      )}
    </div>
  );
}
