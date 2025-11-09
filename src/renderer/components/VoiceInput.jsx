import React, { useState, useCallback } from 'react';

const VoiceInput = () => {
    const [isRecording, setIsRecording] = useState(false);
    const [transcription, setTranscription] = useState('');
    const [error, setError] = useState(null);
    let audioFile = null;

    const startRecording = useCallback(async () => {
        try {
            setError(null);
            audioFile = await window.asr.startRecording();
            setIsRecording(true);
        } catch (err) {
            setError(err.message);
        }
    }, []);

    const stopRecording = useCallback(async () => {
        try {
            await window.asr.stopRecording();
            setIsRecording(false);

            if (audioFile) {
                const result = await window.asr.transcribe(audioFile);
                setTranscription(result.text);
            }
        } catch (err) {
            setError(err.message);
        }
    }, []);

    return (
        <div className="flex flex-col items-center space-y-4 p-4">
            <button
                onClick={isRecording ? stopRecording : startRecording}
                className={`px-6 py-3 rounded-full font-semibold transition-colors ${isRecording
                        ? 'bg-red-500 hover:bg-red-600 text-white'
                        : 'bg-blue-500 hover:bg-blue-600 text-white'
                    }`}
            >
                {isRecording ? 'Stop Recording' : 'Start Recording'}
            </button>

            {transcription && (
                <div className="w-full max-w-lg p-4 bg-white/10 backdrop-blur rounded-lg shadow">
                    <p className="text-white">{transcription}</p>
                </div>
            )}

            {error && (
                <div className="w-full max-w-lg p-4 bg-red-500/10 backdrop-blur rounded-lg shadow">
                    <p className="text-red-500">{error}</p>
                </div>
            )}
        </div>
    );
};

export default VoiceInput;