import argparse
import pyaudio
import wave
import keyboard
import sys
from array import array
from struct import pack

CHUNK = 1024
FORMAT = pyaudio.paInt16
CHANNELS = 1
RATE = 44100
SILENCE_THRESHOLD = 800  # Adjusted for normal speaking volume
MIN_SILENCE_TIME = 1.5  # seconds of silence before stopping
NOISE_ADJUST_TIME = 1.0  # seconds to calibrate background noise
ENERGY_MULTIPLIER = 1.5  # how much louder than background noise to trigger speech

def get_audio_energy(data):
    """Calculate the energy level of the audio chunk"""
    return sum(abs(int.from_bytes(data[i:i+2], 'little', signed=True)) for i in range(0, len(data), 2)) / (CHUNK/2)

def record_audio(output_file, stop_key='esc'):
    p = pyaudio.PyAudio()
    stream = p.open(format=FORMAT,
                   channels=CHANNELS,
                   rate=RATE,
                   input=True,
                   frames_per_buffer=CHUNK)

    # Calibrate background noise
    print("Calibrating background noise... Please stay quiet.")
    noise_levels = []
    for _ in range(int(NOISE_ADJUST_TIME * RATE / CHUNK)):
        data = stream.read(CHUNK)
        noise_levels.append(get_audio_energy(data))
    background_energy = sum(noise_levels) / len(noise_levels)
    speech_threshold = background_energy * ENERGY_MULTIPLIER
    
    print(f"\nRecording... (Will stop automatically after {MIN_SILENCE_TIME}s of silence)")
    print("Or press 'esc' to stop manually")
    
    frames = []
    silence_frames = 0
    recording_started = False
    
    try:
        while True:
            data = stream.read(CHUNK)
            energy = get_audio_energy(data)
            
            # Visual feedback with both volume and threshold
            volume_level = int(energy / 100)
            threshold_marker = int(speech_threshold / 100)
            meter = '█' * volume_level + '▒' * (threshold_marker - volume_level) + ' ' * (50 - threshold_marker)
            print('\r' + meter, end='')
            
            # Check for stop key
            if keyboard.is_pressed(stop_key):
                break
                
            # If energy is above threshold, consider it speech
            if energy > speech_threshold:
                recording_started = True
                silence_frames = 0
                frames.append(data)
            else:
                if recording_started:
                    silence_frames += 1
                    frames.append(data)
                    # Stop if silence duration exceeds threshold
                    if silence_frames > (RATE / CHUNK * MIN_SILENCE_TIME):
                        print("\nSilence detected, stopping recording...")
                        break
                
    except KeyboardInterrupt:
        pass
    except Exception as e:
        print(f"Error: {str(e)}", file=sys.stderr)
        return False
    finally:
        stream.stop_stream()
        stream.close()
        p.terminate()

    try:
        with wave.open(output_file, 'wb') as wf:
            wf.setnchannels(CHANNELS)
            wf.setsampwidth(p.get_sample_size(FORMAT))
            wf.setframerate(RATE)
            for frame in frames:
                wf.writeframes(frame)
        return True
    except Exception as e:
        print(f"Error saving file: {str(e)}", file=sys.stderr)
        return False

def main():
    parser = argparse.ArgumentParser(description='Record audio to WAV file')
    parser.add_argument('--output', required=True, help='Output WAV file path')
    parser.add_argument('--stop-key', default='esc', help='Key to stop recording')
    
    args = parser.parse_args()
    
    if record_audio(args.output, args.stop_key):
        print(f"Audio saved to {args.output}")
    else:
        sys.exit(1)

if __name__ == '__main__':
    main()