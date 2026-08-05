const AudioEngine = (function() {
    let audioCtx = null;
    let bgOscillator = null;
    let bgGainNode = null;
    let isMuted = false;
    let isPlaying = false;
    let currentVolume = 0.15;

    let delayNode = null;
    let feedbackNode = null;
    let filterNode = null;

    // Magical Fairy-tale Melody (Pentatonic Arpeggios)
    const melody = [
        261.63, 329.63, 392.00, 440.00,
        523.25, 392.00, 329.63, 261.63,
        293.66, 329.63, 392.00, 523.25,
        659.25, 523.25, 392.00, 329.63
    ];
    let noteIndex = 0;
    let nextNoteTime = 0;
    let timerID = null;

    // Ses motorunda oluşan HERHANGİ bir hata (özellikle iOS Safari'nin Web Audio
    // tuhaflıkları) oyunun kilitlenmesine yol açmasın diye tüm ses işlemleri
    // bu sarmalayıcıyla korunuyor. Hata olursa sessizce yutulur, oyun devam eder.
    function safe(fn) {
        try {
            fn();
        } catch (e) {
            console.warn('AudioEngine hatası (yoksayıldı):', e);
        }
    }

    function init() {
        safe(() => {
            if (!audioCtx) {
                const AudioContext = window.AudioContext || window.webkitAudioContext;
                audioCtx = new AudioContext();

                // Dreamy Delay Effect (Fairy-tale vibe)
                delayNode = audioCtx.createDelay();
                delayNode.delayTime.value = 0.4; // 400ms delay

                feedbackNode = audioCtx.createGain();
                feedbackNode.gain.value = 0.4; // 40% feedback

                filterNode = audioCtx.createBiquadFilter();
                filterNode.type = 'lowpass';
                filterNode.frequency.value = 1000; // Soften high frequencies

                delayNode.connect(feedbackNode);
                feedbackNode.connect(delayNode);

                delayNode.connect(filterNode);
                filterNode.connect(audioCtx.destination);
            }
        });
    }

    function playNote(freq, time) {
        if (!audioCtx || isMuted) return;

        safe(() => {
            // Two oscillators for a richer "music box / bell" sound
            const osc1 = audioCtx.createOscillator();
            const osc2 = audioCtx.createOscillator();
            const gain = audioCtx.createGain();

            osc1.type = 'sine';
            osc2.type = 'triangle';

            osc1.frequency.value = freq;
            osc2.frequency.value = freq * 2; // an octave higher

            osc1.connect(gain);
            osc2.connect(gain);

            // Connect to both main output and the delay line
            gain.connect(audioCtx.destination);
            gain.connect(delayNode);

            // Percussive bell-like envelope
            gain.gain.setValueAtTime(0, time);
            gain.gain.linearRampToValueAtTime(currentVolume, time + 0.02); // Fast attack
            gain.gain.exponentialRampToValueAtTime(0.001, time + 1.2); // Slow dreamy decay

            osc1.start(time);
            osc2.start(time);
            osc1.stop(time + 1.2);
            osc2.stop(time + 1.2);
        });
    }

    function scheduler() {
        if (!audioCtx || !isPlaying) return;
        safe(() => {
            while (nextNoteTime < audioCtx.currentTime + 0.1) {
                playNote(melody[noteIndex], nextNoteTime);
                nextNoteTime += 0.35; // Note duration (faster, magical pace)
                noteIndex = (noteIndex + 1) % melody.length;
            }
        });
        timerID = window.setTimeout(scheduler, 50.0);
    }

    function startBGM() {
        init();
        if (!audioCtx) return; // init() failed silently; don't proceed

        safe(() => {
            if (audioCtx.state === 'suspended') {
                audioCtx.resume();
            }
        });

        if (isPlaying || isMuted) return;
        isPlaying = true;
        noteIndex = 0;
        nextNoteTime = audioCtx.currentTime + 0.1;
        scheduler();
    }

    function stopBGM() {
        isPlaying = false;
        if (timerID) {
            window.clearTimeout(timerID);
        }
    }

    function toggleMute(mutedState) {
        isMuted = mutedState;
        if (isMuted) {
            stopBGM();
        } else {
            startBGM();
        }
    }

    function setVolume(vol) {
        currentVolume = parseFloat(vol);
        if (currentVolume > 0 && isMuted) {
            // Unmute if volume is increased while muted
            // Let the app.js handle UI sync if necessary, here we just update state.
        }
    }

    // Sound Effects
    function playCorrectSound() {
        init();
        if (isMuted || !audioCtx) return;

        safe(() => {
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();

            osc.type = 'sine';
            osc.frequency.setValueAtTime(523.25, audioCtx.currentTime); // C5
            osc.frequency.setValueAtTime(659.25, audioCtx.currentTime + 0.1); // E5
            osc.frequency.setValueAtTime(783.99, audioCtx.currentTime + 0.2); // G5
            osc.frequency.setValueAtTime(1046.50, audioCtx.currentTime + 0.3); // C6

            osc.connect(gain);
            gain.connect(audioCtx.destination);

            gain.gain.setValueAtTime(0, audioCtx.currentTime);
            gain.gain.linearRampToValueAtTime(0.2, audioCtx.currentTime + 0.1);
            gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.6);

            osc.start(audioCtx.currentTime);
            osc.stop(audioCtx.currentTime + 0.6);
        });
    }

    function playStreakSound() {
        init();
        if (isMuted || !audioCtx) return;

        safe(() => {
            // Cheerful ascending sparkle for combo streaks
            const notes = [783.99, 987.77, 1174.66]; // G5, B5, D6
            notes.forEach((freq, i) => {
                const osc = audioCtx.createOscillator();
                const gain = audioCtx.createGain();
                const t = audioCtx.currentTime + i * 0.09;

                osc.type = 'triangle';
                osc.frequency.setValueAtTime(freq, t);

                osc.connect(gain);
                gain.connect(audioCtx.destination);

                gain.gain.setValueAtTime(0, t);
                gain.gain.linearRampToValueAtTime(0.18, t + 0.02);
                gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);

                osc.start(t);
                osc.stop(t + 0.35);
            });
        });
    }

    function playTickSound() {
        init();
        if (isMuted || !audioCtx) return;

        safe(() => {
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();

            osc.type = 'square';
            osc.frequency.setValueAtTime(880, audioCtx.currentTime);

            osc.connect(gain);
            gain.connect(audioCtx.destination);

            gain.gain.setValueAtTime(0, audioCtx.currentTime);
            gain.gain.linearRampToValueAtTime(0.08, audioCtx.currentTime + 0.01);
            gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.1);

            osc.start(audioCtx.currentTime);
            osc.stop(audioCtx.currentTime + 0.1);
        });
    }

    function playIncorrectSound() {
        init();
        if (isMuted || !audioCtx) return;

        safe(() => {
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();

            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(150, audioCtx.currentTime);
            osc.frequency.linearRampToValueAtTime(100, audioCtx.currentTime + 0.3);

            osc.connect(gain);
            gain.connect(audioCtx.destination);

            gain.gain.setValueAtTime(0, audioCtx.currentTime);
            gain.gain.linearRampToValueAtTime(0.2, audioCtx.currentTime + 0.05);
            gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.4);

            osc.start(audioCtx.currentTime);
            osc.stop(audioCtx.currentTime + 0.4);
        });
    }

    return {
        init,
        startBGM,
        stopBGM,
        toggleMute,
        setVolume,
        playCorrectSound,
        playIncorrectSound,
        playStreakSound,
        playTickSound
    };
})();
