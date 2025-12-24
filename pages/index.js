import { useState, useEffect, useRef, useCallback } from 'react';
import Head from 'next/head';

export default function Home() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentLyric, setCurrentLyric] = useState('');
  const [neckSize, setNeckSize] = useState(1);
  const [veeGlow, setVeeGlow] = useState(0);
  const [bassIntensity, setBassIntensity] = useState(0);
  const audioContextRef = useRef(null);
  const schedulerRef = useRef(null);
  const beatCountRef = useRef(0);
  const analyserRef = useRef(null);
  const animationRef = useRef(null);

  const lyrics = [
    { text: "The robot called Vee", duration: 2000 },
    { text: "He's a green robot", duration: 2000 },
    { text: "And he's very overpowered", duration: 2500 },
    { text: "And his neck even gets so big", duration: 2500 },
    { text: "IT'S VEE", duration: 800 },
    { text: "IT'S VEE", duration: 800 },
    { text: "IT'S VEE", duration: 800 },
    { text: "IT'S VEE", duration: 800 },
    { text: "IT'S VEE", duration: 800 },
    { text: "IT'S VEE", duration: 800 },
    { text: "IT'S VEE", duration: 800 },
    { text: "IT'S VEE", duration: 800 },
  ];

  const createBrazilianPhonkBeat = useCallback((audioContext, time) => {
    // Kick drum - deep and punchy
    const kickOsc = audioContext.createOscillator();
    const kickGain = audioContext.createGain();
    kickOsc.type = 'sine';
    kickOsc.frequency.setValueAtTime(150, time);
    kickOsc.frequency.exponentialRampToValueAtTime(40, time + 0.1);
    kickGain.gain.setValueAtTime(0.8, time);
    kickGain.gain.exponentialRampToValueAtTime(0.01, time + 0.3);
    kickOsc.connect(kickGain);
    kickGain.connect(audioContext.destination);
    kickOsc.start(time);
    kickOsc.stop(time + 0.3);

    // Sub bass layer
    const subOsc = audioContext.createOscillator();
    const subGain = audioContext.createGain();
    subOsc.type = 'sine';
    subOsc.frequency.setValueAtTime(55, time);
    subGain.gain.setValueAtTime(0.5, time);
    subGain.gain.exponentialRampToValueAtTime(0.01, time + 0.4);
    subOsc.connect(subGain);
    subGain.connect(audioContext.destination);
    subOsc.start(time);
    subOsc.stop(time + 0.4);

    setBassIntensity(1);
    setTimeout(() => setBassIntensity(0), 100);
  }, []);

  const createSnare = useCallback((audioContext, time) => {
    // Snare with noise
    const noiseBuffer = audioContext.createBuffer(1, audioContext.sampleRate * 0.2, audioContext.sampleRate);
    const noiseData = noiseBuffer.getChannelData(0);
    for (let i = 0; i < noiseBuffer.length; i++) {
      noiseData[i] = Math.random() * 2 - 1;
    }
    
    const noiseSource = audioContext.createBufferSource();
    noiseSource.buffer = noiseBuffer;
    
    const noiseFilter = audioContext.createBiquadFilter();
    noiseFilter.type = 'highpass';
    noiseFilter.frequency.value = 1000;
    
    const noiseGain = audioContext.createGain();
    noiseGain.gain.setValueAtTime(0.5, time);
    noiseGain.gain.exponentialRampToValueAtTime(0.01, time + 0.15);
    
    noiseSource.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(audioContext.destination);
    noiseSource.start(time);
    noiseSource.stop(time + 0.2);

    // Snare body
    const snareOsc = audioContext.createOscillator();
    const snareGain = audioContext.createGain();
    snareOsc.type = 'triangle';
    snareOsc.frequency.setValueAtTime(200, time);
    snareGain.gain.setValueAtTime(0.4, time);
    snareGain.gain.exponentialRampToValueAtTime(0.01, time + 0.1);
    snareOsc.connect(snareGain);
    snareGain.connect(audioContext.destination);
    snareOsc.start(time);
    snareOsc.stop(time + 0.15);
  }, []);

  const createHiHat = useCallback((audioContext, time, isOpen = false) => {
    const noiseBuffer = audioContext.createBuffer(1, audioContext.sampleRate * (isOpen ? 0.3 : 0.05), audioContext.sampleRate);
    const noiseData = noiseBuffer.getChannelData(0);
    for (let i = 0; i < noiseBuffer.length; i++) {
      noiseData[i] = Math.random() * 2 - 1;
    }
    
    const noiseSource = audioContext.createBufferSource();
    noiseSource.buffer = noiseBuffer;
    
    const filter = audioContext.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = 8000;
    
    const gain = audioContext.createGain();
    gain.gain.setValueAtTime(0.15, time);
    gain.gain.exponentialRampToValueAtTime(0.01, time + (isOpen ? 0.2 : 0.03));
    
    noiseSource.connect(filter);
    filter.connect(gain);
    gain.connect(audioContext.destination);
    noiseSource.start(time);
    noiseSource.stop(time + (isOpen ? 0.3 : 0.05));
  }, []);

  const createPhonkSynth = useCallback((audioContext, time, note) => {
    // Detuned saw synth typical of phonk
    const frequencies = [note, note * 1.005, note * 0.995];
    
    frequencies.forEach((freq) => {
      const osc = audioContext.createOscillator();
      const filter = audioContext.createBiquadFilter();
      const gain = audioContext.createGain();
      
      osc.type = 'sawtooth';
      osc.frequency.value = freq;
      
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(2000, time);
      filter.frequency.exponentialRampToValueAtTime(500, time + 0.5);
      filter.Q.value = 5;
      
      gain.gain.setValueAtTime(0.1, time);
      gain.gain.exponentialRampToValueAtTime(0.01, time + 0.6);
      
      osc.connect(filter);
      filter.connect(gain);
      gain.connect(audioContext.destination);
      
      osc.start(time);
      osc.stop(time + 0.6);
    });
  }, []);

  const createCowbell = useCallback((audioContext, time) => {
    // Brazilian phonk cowbell
    const osc1 = audioContext.createOscillator();
    const osc2 = audioContext.createOscillator();
    const gain = audioContext.createGain();
    const filter = audioContext.createBiquadFilter();
    
    osc1.type = 'square';
    osc1.frequency.value = 800;
    osc2.type = 'square';
    osc2.frequency.value = 540;
    
    filter.type = 'bandpass';
    filter.frequency.value = 800;
    filter.Q.value = 3;
    
    gain.gain.setValueAtTime(0.25, time);
    gain.gain.exponentialRampToValueAtTime(0.01, time + 0.15);
    
    osc1.connect(filter);
    osc2.connect(filter);
    filter.connect(gain);
    gain.connect(audioContext.destination);
    
    osc1.start(time);
    osc2.start(time);
    osc1.stop(time + 0.15);
    osc2.stop(time + 0.15);
  }, []);

  const scheduleBeat = useCallback(() => {
    if (!audioContextRef.current) return;
    
    const audioContext = audioContextRef.current;
    const bpm = 130; // Brazilian phonk tempo
    const beatDuration = 60 / bpm;
    const currentTime = audioContext.currentTime;
    const beat = beatCountRef.current % 16;

    // Kick pattern (Brazilian phonk style - 4 on the floor with variations)
    if (beat % 4 === 0 || beat === 6 || beat === 10 || beat === 14) {
      createBrazilianPhonkBeat(audioContext, currentTime);
    }

    // Snare on 4 and 12 (2 and 4 in 4/4)
    if (beat === 4 || beat === 12) {
      createSnare(audioContext, currentTime);
    }

    // Hi-hats
    if (beat % 2 === 0) {
      createHiHat(audioContext, currentTime, beat % 8 === 6);
    }

    // Cowbell pattern (signature phonk element)
    if (beat === 2 || beat === 6 || beat === 10 || beat === 14) {
      createCowbell(audioContext, currentTime);
    }

    // Phonk synth stabs
    const synthNotes = [130.81, 146.83, 164.81, 196.0]; // C3, D3, E3, G3
    if (beat === 0 || beat === 8) {
      createPhonkSynth(audioContext, currentTime, synthNotes[Math.floor(Math.random() * synthNotes.length)]);
    }

    // Visual effects sync
    if (beat % 4 === 0) {
      setNeckSize(prev => Math.min(prev + 0.15, 2.5));
      setVeeGlow(1);
    } else {
      setVeeGlow(prev => Math.max(prev - 0.1, 0));
    }

    // Neck shrinks back slowly
    if (beat % 8 === 4) {
      setNeckSize(prev => Math.max(prev - 0.1, 1));
    }

    beatCountRef.current++;

    schedulerRef.current = setTimeout(scheduleBeat, beatDuration * 1000 / 4);
  }, [createBrazilianPhonkBeat, createSnare, createHiHat, createCowbell, createPhonkSynth]);

  const cycleLyrics = useCallback(() => {
    let index = 0;
    const showNextLyric = () => {
      if (!isPlaying) return;
      setCurrentLyric(lyrics[index].text);
      index = (index + 1) % lyrics.length;
      setTimeout(showNextLyric, lyrics[index - 1 < 0 ? lyrics.length - 1 : index - 1].duration);
    };
    showNextLyric();
  }, [isPlaying]);

  const startAudio = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
    }
    
    if (audioContextRef.current.state === 'suspended') {
      audioContextRef.current.resume();
    }

    setIsPlaying(true);
    beatCountRef.current = 0;
    scheduleBeat();
    cycleLyrics();
  }, [scheduleBeat, cycleLyrics]);

  const stopAudio = useCallback(() => {
    setIsPlaying(false);
    if (schedulerRef.current) {
      clearTimeout(schedulerRef.current);
    }
    setCurrentLyric('');
    setNeckSize(1);
    setVeeGlow(0);
  }, []);

  useEffect(() => {
    return () => {
      if (schedulerRef.current) {
        clearTimeout(schedulerRef.current);
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  return (
    <>
      <Head>
        <title>VEE - Brazilian Phonk</title>
        <meta name="description" content="The robot called Vee - Brazilian Phonk Experience" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <main className="container">
        <div className="background-effects">
          <div className="grid-lines"></div>
          <div className={`bass-pulse ${bassIntensity > 0 ? 'active' : ''}`}></div>
        </div>

        <h1 className="title">
          <span className="phonk-text">BRAZILIAN PHONK</span>
          <span className="vee-title">VEE</span>
        </h1>

        <div className="robot-container">
          <div className={`robot ${isPlaying ? 'bouncing' : ''}`} style={{ '--glow-intensity': veeGlow }}>
            {/* Robot Head */}
            <div className="robot-head">
              <div className="antenna">
                <div className="antenna-ball"></div>
              </div>
              <div className="visor">
                <div className="eye left-eye"></div>
                <div className="eye right-eye"></div>
              </div>
              <div className="mouth">
                {isPlaying && <div className="mouth-animation"></div>}
              </div>
            </div>
            
            {/* Robot Neck - Gets bigger */}
            <div className="robot-neck" style={{ transform: `scaleY(${neckSize}) scaleX(${1 + (neckSize - 1) * 0.3})` }}>
              <div className="neck-segment"></div>
              <div className="neck-segment"></div>
              <div className="neck-segment"></div>
            </div>
            
            {/* Robot Body */}
            <div className="robot-body">
              <div className="chest-light"></div>
              <div className="power-core"></div>
            </div>
            
            {/* Robot Arms */}
            <div className="robot-arm left-arm"></div>
            <div className="robot-arm right-arm"></div>
            
            {/* Robot Legs */}
            <div className="robot-legs">
              <div className="leg left-leg"></div>
              <div className="leg right-leg"></div>
            </div>
          </div>
        </div>

        <div className="lyrics-display">
          <p className={`lyric-text ${currentLyric.includes("IT'S VEE") ? 'its-vee' : ''}`}>
            {currentLyric}
          </p>
        </div>

        <button 
          className={`play-button ${isPlaying ? 'playing' : ''}`}
          onClick={isPlaying ? stopAudio : startAudio}
        >
          {isPlaying ? '⏹ STOP' : '▶ DROP THE BEAT'}
        </button>

        <div className="eq-visualizer">
          {[...Array(16)].map((_, i) => (
            <div 
              key={i} 
              className={`eq-bar ${isPlaying ? 'active' : ''}`}
              style={{ 
                animationDelay: `${i * 0.05}s`,
                '--bar-color': `hsl(${120 + i * 5}, 70%, 50%)`
              }}
            ></div>
          ))}
        </div>

        <p className="credits">🤖 The Overpowered Green Robot 🤖</p>
      </main>

      <style jsx>{`
        .container {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 50%, #0f0f23 100%);
          position: relative;
          overflow: hidden;
          padding: 20px;
        }

        .background-effects {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          pointer-events: none;
        }

        .grid-lines {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-image: 
            linear-gradient(rgba(0, 255, 0, 0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0, 255, 0, 0.03) 1px, transparent 1px);
          background-size: 50px 50px;
        }

        .bass-pulse {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 200%;
          height: 200%;
          background: radial-gradient(circle, rgba(0, 255, 0, 0) 0%, rgba(0, 255, 0, 0) 100%);
          transition: all 0.1s;
        }

        .bass-pulse.active {
          background: radial-gradient(circle, rgba(0, 255, 0, 0.15) 0%, rgba(0, 255, 0, 0) 50%);
        }

        .title {
          text-align: center;
          margin-bottom: 20px;
          z-index: 1;
        }

        .phonk-text {
          display: block;
          font-size: 1.2rem;
          color: #ff0044;
          text-shadow: 0 0 10px #ff0044, 0 0 20px #ff0044;
          letter-spacing: 0.5em;
          font-family: 'Arial Black', sans-serif;
        }

        .vee-title {
          display: block;
          font-size: 4rem;
          color: #00ff00;
          text-shadow: 
            0 0 10px #00ff00,
            0 0 20px #00ff00,
            0 0 40px #00ff00,
            0 0 80px #00ff00;
          font-family: 'Arial Black', sans-serif;
          animation: pulse-glow 1s ease-in-out infinite;
        }

        @keyframes pulse-glow {
          0%, 100% { filter: brightness(1); }
          50% { filter: brightness(1.3); }
        }

        .robot-container {
          position: relative;
          z-index: 1;
          margin: 20px 0;
        }

        .robot {
          display: flex;
          flex-direction: column;
          align-items: center;
          filter: drop-shadow(0 0 20px rgba(0, 255, 0, calc(var(--glow-intensity) * 0.8)));
          transition: filter 0.1s;
        }

        .robot.bouncing {
          animation: robot-bounce 0.23s ease-in-out infinite;
        }

        @keyframes robot-bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }

        .robot-head {
          width: 100px;
          height: 80px;
          background: linear-gradient(180deg, #00cc00 0%, #009900 100%);
          border-radius: 20px 20px 10px 10px;
          position: relative;
          border: 3px solid #00ff00;
          box-shadow: inset 0 -10px 20px rgba(0, 0, 0, 0.3);
        }

        .antenna {
          position: absolute;
          top: -25px;
          left: 50%;
          transform: translateX(-50%);
          width: 4px;
          height: 20px;
          background: #00ff00;
        }

        .antenna-ball {
          position: absolute;
          top: -10px;
          left: 50%;
          transform: translateX(-50%);
          width: 12px;
          height: 12px;
          background: #ff0044;
          border-radius: 50%;
          animation: blink 0.5s ease-in-out infinite;
        }

        @keyframes blink {
          0%, 100% { opacity: 1; box-shadow: 0 0 10px #ff0044; }
          50% { opacity: 0.5; box-shadow: 0 0 5px #ff0044; }
        }

        .visor {
          position: absolute;
          top: 20px;
          left: 10px;
          right: 10px;
          height: 30px;
          background: #001100;
          border-radius: 5px;
          display: flex;
          justify-content: space-around;
          align-items: center;
          border: 2px solid #00ff00;
        }

        .eye {
          width: 20px;
          height: 20px;
          background: #00ff00;
          border-radius: 50%;
          box-shadow: 0 0 10px #00ff00, 0 0 20px #00ff00;
          animation: eye-glow 2s ease-in-out infinite;
        }

        @keyframes eye-glow {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.1); }
        }

        .mouth {
          position: absolute;
          bottom: 10px;
          left: 50%;
          transform: translateX(-50%);
          width: 40px;
          height: 10px;
          background: #001100;
          border-radius: 0 0 10px 10px;
          overflow: hidden;
          border: 2px solid #00ff00;
        }

        .mouth-animation {
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, #00ff00, #00cc00, #00ff00);
          animation: mouth-wave 0.2s linear infinite;
        }

        @keyframes mouth-wave {
          0% { transform: translateX(-33%); }
          100% { transform: translateX(33%); }
        }

        .robot-neck {
          width: 40px;
          background: linear-gradient(180deg, #009900 0%, #006600 100%);
          display: flex;
          flex-direction: column;
          align-items: center;
          transition: transform 0.2s ease-out;
          transform-origin: top center;
        }

        .neck-segment {
          width: 100%;
          height: 12px;
          background: linear-gradient(180deg, #00aa00 0%, #008800 100%);
          border: 1px solid #00ff00;
          margin: 2px 0;
        }

        .robot-body {
          width: 120px;
          height: 100px;
          background: linear-gradient(180deg, #00cc00 0%, #008800 100%);
          border-radius: 10px;
          position: relative;
          border: 3px solid #00ff00;
          box-shadow: inset 0 -20px 30px rgba(0, 0, 0, 0.3);
        }

        .chest-light {
          position: absolute;
          top: 20px;
          left: 50%;
          transform: translateX(-50%);
          width: 40px;
          height: 40px;
          background: radial-gradient(circle, #00ff00 0%, #009900 70%);
          border-radius: 50%;
          box-shadow: 0 0 20px #00ff00;
          animation: chest-pulse 0.5s ease-in-out infinite;
        }

        @keyframes chest-pulse {
          0%, 100% { transform: translateX(-50%) scale(1); opacity: 1; }
          50% { transform: translateX(-50%) scale(1.1); opacity: 0.8; }
        }

        .power-core {
          position: absolute;
          bottom: 10px;
          left: 50%;
          transform: translateX(-50%);
          width: 60px;
          height: 20px;
          background: linear-gradient(90deg, #ff0044, #ff0066, #ff0044);
          border-radius: 5px;
          box-shadow: 0 0 10px #ff0044;
        }

        .robot-arm {
          position: absolute;
          width: 20px;
          height: 70px;
          background: linear-gradient(180deg, #00bb00 0%, #008800 100%);
          border: 2px solid #00ff00;
          border-radius: 10px;
        }

        .left-arm {
          left: -30px;
          top: 50%;
          transform: rotate(-15deg);
          animation: arm-swing-left 0.46s ease-in-out infinite;
        }

        .right-arm {
          right: -30px;
          top: 50%;
          transform: rotate(15deg);
          animation: arm-swing-right 0.46s ease-in-out infinite;
        }

        @keyframes arm-swing-left {
          0%, 100% { transform: rotate(-15deg); }
          50% { transform: rotate(-25deg); }
        }

        @keyframes arm-swing-right {
          0%, 100% { transform: rotate(15deg); }
          50% { transform: rotate(25deg); }
        }

        .robot-legs {
          display: flex;
          gap: 20px;
          margin-top: 5px;
        }

        .leg {
          width: 25px;
          height: 50px;
          background: linear-gradient(180deg, #00aa00 0%, #006600 100%);
          border: 2px solid #00ff00;
          border-radius: 5px 5px 10px 10px;
        }

        .left-leg {
          animation: leg-move-left 0.46s ease-in-out infinite;
        }

        .right-leg {
          animation: leg-move-right 0.46s ease-in-out infinite;
        }

        @keyframes leg-move-left {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-5px); }
        }

        @keyframes leg-move-right {
          0%, 100% { transform: translateY(-5px); }
          50% { transform: translateY(0); }
        }

        .lyrics-display {
          height: 80px;
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1;
        }

        .lyric-text {
          font-size: 1.5rem;
          color: #ffffff;
          text-align: center;
          text-shadow: 0 0 10px rgba(255, 255, 255, 0.5);
          animation: lyric-fade 0.3s ease-out;
          font-family: 'Arial Black', sans-serif;
        }

        .lyric-text.its-vee {
          font-size: 3rem;
          color: #00ff00;
          text-shadow: 
            0 0 10px #00ff00,
            0 0 20px #00ff00,
            0 0 40px #00ff00;
          animation: shake 0.1s ease-in-out infinite;
        }

        @keyframes lyric-fade {
          from { opacity: 0; transform: scale(0.8); }
          to { opacity: 1; transform: scale(1); }
        }

        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }

        .play-button {
          padding: 20px 50px;
          font-size: 1.5rem;
          font-weight: bold;
          color: #000;
          background: linear-gradient(180deg, #00ff00 0%, #00cc00 100%);
          border: none;
          border-radius: 50px;
          cursor: pointer;
          z-index: 1;
          transition: all 0.3s;
          box-shadow: 
            0 0 20px rgba(0, 255, 0, 0.5),
            0 5px 20px rgba(0, 0, 0, 0.3);
          font-family: 'Arial Black', sans-serif;
          text-transform: uppercase;
          letter-spacing: 2px;
        }

        .play-button:hover {
          transform: scale(1.05);
          box-shadow: 
            0 0 30px rgba(0, 255, 0, 0.7),
            0 5px 30px rgba(0, 0, 0, 0.4);
        }

        .play-button.playing {
          background: linear-gradient(180deg, #ff0044 0%, #cc0033 100%);
          box-shadow: 
            0 0 20px rgba(255, 0, 68, 0.5),
            0 5px 20px rgba(0, 0, 0, 0.3);
        }

        .eq-visualizer {
          display: flex;
          gap: 4px;
          margin-top: 30px;
          height: 60px;
          align-items: flex-end;
          z-index: 1;
        }

        .eq-bar {
          width: 12px;
          height: 10px;
          background: var(--bar-color);
          border-radius: 2px;
          transition: height 0.1s;
        }

        .eq-bar.active {
          animation: eq-bounce 0.23s ease-in-out infinite;
        }

        @keyframes eq-bounce {
          0%, 100% { height: 10px; }
          50% { height: calc(20px + 40px * var(--random, 0.5)); }
        }

        .eq-bar:nth-child(1) { --random: 0.8; }
        .eq-bar:nth-child(2) { --random: 0.6; }
        .eq-bar:nth-child(3) { --random: 0.9; }
        .eq-bar:nth-child(4) { --random: 0.4; }
        .eq-bar:nth-child(5) { --random: 0.7; }
        .eq-bar:nth-child(6) { --random: 0.5; }
        .eq-bar:nth-child(7) { --random: 1.0; }
        .eq-bar:nth-child(8) { --random: 0.3; }
        .eq-bar:nth-child(9) { --random: 0.8; }
        .eq-bar:nth-child(10) { --random: 0.6; }
        .eq-bar:nth-child(11) { --random: 0.9; }
        .eq-bar:nth-child(12) { --random: 0.4; }
        .eq-bar:nth-child(13) { --random: 0.7; }
        .eq-bar:nth-child(14) { --random: 0.5; }
        .eq-bar:nth-child(15) { --random: 0.8; }
        .eq-bar:nth-child(16) { --random: 0.6; }

        .credits {
          margin-top: 30px;
          color: #666;
          font-size: 0.9rem;
          z-index: 1;
        }

        @media (max-width: 600px) {
          .vee-title {
            font-size: 2.5rem;
          }
          
          .phonk-text {
            font-size: 0.8rem;
            letter-spacing: 0.3em;
          }
          
          .lyric-text {
            font-size: 1.2rem;
          }
          
          .lyric-text.its-vee {
            font-size: 2rem;
          }
          
          .play-button {
            padding: 15px 30px;
            font-size: 1.2rem;
          }
        }
      `}</style>

      <style jsx global>{`
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        html, body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
          background: #0a0a0a;
        }
      `}</style>
    </>
  );
}
