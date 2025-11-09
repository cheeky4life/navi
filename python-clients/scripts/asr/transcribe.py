import argparse
import sys
import os
import assemblyai as aai

def process_file(args):
    try:
        api_key = os.environ.get('ASSEMBLYAI_API_KEY', args.api_key)
        if not api_key:
            raise ValueError("AssemblyAI API key is required. Get one from https://www.assemblyai.com/")
        
        # Initialize the client
        aai.settings.api_key = api_key
        
        # Get absolute path to the input file
        input_file = os.path.abspath(args.input_file)
        print(f"Audio file path: {input_file}")
        
        # Check if file exists
        if not os.path.exists(input_file):
            raise FileNotFoundError(f"Audio file not found at: {input_file}")
        
        print("Uploading audio file...")
        transcriber = aai.Transcriber()
        
        # Configure transcription options
        config = aai.TranscriptionConfig(
            language_detection=True,  # Automatically detect language
            punctuate=True,  # Add punctuation
            format_text=True,  # Capitalize sentences and format numbers
            dual_channel=False,  # Set to True if you have speaker-separated channels
            audio_start_from=None,  # Start transcribing from the beginning
            audio_end_at=None,  # Transcribe until the end
        )
        
        print("Transcribing audio...")
        transcript = transcriber.transcribe(
            input_file,
            config=config
        )
        
        # Print the transcription
        print("\nTranscription:")
        print(transcript.text)
        
        # Print additional info
        if hasattr(transcript, 'language_code'):
            print(f"\nDetected language: {transcript.language_code}")
        if hasattr(transcript, 'confidence'):
            print(f"Confidence score: {transcript.confidence:.2%}")
            
    except Exception as e:
        print(f"Error: {str(e)}", file=sys.stderr)
        sys.exit(1)

    except Exception as e:
        print(f"Error: {str(e)}", file=sys.stderr)
        sys.exit(1)

def main():
    parser = argparse.ArgumentParser(description='Transcribe audio file using AssemblyAI')
    parser.add_argument('--input-file', required=True, help='Path to input audio file')
    parser.add_argument('--api-key', help='AssemblyAI API key (or set ASSEMBLYAI_API_KEY environment variable)')
    
    args = parser.parse_args()
    process_file(args)

if __name__ == '__main__':
    main()