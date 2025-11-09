import { useRef, useCallback } from 'react';

/**
 * Custom hook for text-to-speech using Web Speech API
 */
export function useTextToSpeech() {
    const synthRef = useRef(null);
    const utteranceRef = useRef(null);

    // Initialize speech synthesis
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        synthRef.current = window.speechSynthesis;
    }

    const speak = useCallback((text, options = {}) => {
        if (!synthRef.current || !text || !text.trim()) {
            console.warn('Text-to-speech not available or empty text');
            return;
        }

        // Cancel any ongoing speech
        if (synthRef.current.speaking) {
            synthRef.current.cancel();
        }

        // Create new utterance
        const utterance = new SpeechSynthesisUtterance(text.trim());
        
        // Set options
        utterance.rate = options.rate || 1.0; // Speech rate (0.1 to 10)
        utterance.pitch = options.pitch || 1.0; // Pitch (0 to 2)
        utterance.volume = options.volume || 1.0; // Volume (0 to 1)
        utterance.lang = options.lang || 'en-US';
        utterance.voice = options.voice || null; // Use default voice

        // Event handlers
        utterance.onstart = () => {
            console.log('🔊 TTS started speaking');
            if (options.onStart) options.onStart();
        };

        utterance.onend = () => {
            console.log('🔊 TTS finished speaking');
            if (options.onEnd) options.onEnd();
        };

        utterance.onerror = (event) => {
            console.error('🔊 TTS error:', event.error);
            if (options.onError) options.onError(event);
        };

        utteranceRef.current = utterance;
        
        // Speak
        try {
            synthRef.current.speak(utterance);
            console.log('🔊 TTS queued:', text.substring(0, 50) + '...');
        } catch (error) {
            console.error('🔊 TTS speak error:', error);
        }
    }, []);

    const stop = useCallback(() => {
        if (synthRef.current && synthRef.current.speaking) {
            synthRef.current.cancel();
            console.log('🔊 TTS stopped');
        }
    }, []);

    const pause = useCallback(() => {
        if (synthRef.current && synthRef.current.speaking) {
            synthRef.current.pause();
            console.log('🔊 TTS paused');
        }
    }, []);

    const resume = useCallback(() => {
        if (synthRef.current && synthRef.current.paused) {
            synthRef.current.resume();
            console.log('🔊 TTS resumed');
        }
    }, []);

    const isSpeaking = useCallback(() => {
        return synthRef.current ? synthRef.current.speaking : false;
    }, []);

    return {
        speak,
        stop,
        pause,
        resume,
        isSpeaking,
        isAvailable: !!synthRef.current,
    };
}

