# Alternative TTS implementations for different providers

import os
import uuid
import requests
from pathlib import Path
from typing import Optional

# Optional imports for different TTS providers
try:
    import elevenlabs
    ELEVENLABS_AVAILABLE = True
except ImportError:
    ELEVENLABS_AVAILABLE = False

try:
    from google.cloud import texttospeech
    GOOGLE_TTS_AVAILABLE = True
except ImportError:
    GOOGLE_TTS_AVAILABLE = False

try:
    import boto3
    AWS_POLLY_AVAILABLE = True
except ImportError:
    AWS_POLLY_AVAILABLE = False


class ElevenLabsTTS:
    """ElevenLabs TTS implementation"""
    
    def __init__(self):
        if not ELEVENLABS_AVAILABLE:
            raise ImportError("ElevenLabs package not installed")
        
        self.api_key = os.getenv("ELEVENLABS_API_KEY")
        if not self.api_key:
            raise ValueError("ELEVENLABS_API_KEY not found")
        
        elevenlabs.set_api_key(self.api_key)
    
    async def synthesize_speech(self, text: str, language: str = "en-US") -> Optional[str]:
        """Convert text to speech using ElevenLabs"""
        
        try:
            # Child-friendly voice IDs (you'll need to get these from ElevenLabs)
            voice_map = {
                "en-US": "pNInz6obpgDQGcFmaJgB",  # Adam - child-friendly
                "es-ES": "onwK4e9ZLuTAKqWW03F9",  # Spanish voice
                # Add more voices as needed
            }
            
            voice_id = voice_map.get(language, voice_map["en-US"])
            
            # Generate audio
            audio = elevenlabs.generate(
                text=text,
                voice=voice_id,
                model="eleven_monolingual_v1"
            )
            
            # Save to file
            audio_filename = f"narration_{uuid.uuid4().hex}.mp3"
            audio_path = Path("static") / audio_filename
            
            with open(audio_path, "wb") as f:
                f.write(audio)
            
            return f"/static/{audio_filename}"
            
        except Exception as e:
            print(f"ElevenLabs TTS Error: {e}")
            return None


class GoogleTTS:
    """Google Cloud TTS implementation"""
    
    def __init__(self):
        if not GOOGLE_TTS_AVAILABLE:
            raise ImportError("Google Cloud TTS package not installed")
        
        self.client = texttospeech.TextToSpeechClient()
    
    async def synthesize_speech(self, text: str, language: str = "en-US") -> Optional[str]:
        """Convert text to speech using Google Cloud TTS"""
        
        try:
            # Voice configuration
            voice_map = {
                "en-US": {"name": "en-US-Wavenet-F", "ssml_gender": texttospeech.SsmlVoiceGender.FEMALE},
                "es-ES": {"name": "es-ES-Wavenet-C", "ssml_gender": texttospeech.SsmlVoiceGender.FEMALE},
                "fr-FR": {"name": "fr-FR-Wavenet-C", "ssml_gender": texttospeech.SsmlVoiceGender.FEMALE},
            }
            
            voice_config = voice_map.get(language, voice_map["en-US"])
            
            synthesis_input = texttospeech.SynthesisInput(text=text)
            voice = texttospeech.VoiceSelectionParams(
                language_code=language,
                name=voice_config["name"],
                ssml_gender=voice_config["ssml_gender"]
            )
            audio_config = texttospeech.AudioConfig(
                audio_encoding=texttospeech.AudioEncoding.MP3,
                speaking_rate=0.9,
                pitch=2.0  # Slightly higher pitch for children
            )
            
            response = self.client.synthesize_speech(
                input=synthesis_input,
                voice=voice,
                audio_config=audio_config
            )
            
            # Save to file
            audio_filename = f"narration_{uuid.uuid4().hex}.mp3"
            audio_path = Path("static") / audio_filename
            
            with open(audio_path, "wb") as f:
                f.write(response.audio_content)
            
            return f"/static/{audio_filename}"
            
        except Exception as e:
            print(f"Google TTS Error: {e}")
            return None


class AWSPollyTTS:
    """AWS Polly TTS implementation"""
    
    def __init__(self):
        if not AWS_POLLY_AVAILABLE:
            raise ImportError("AWS SDK (boto3) not installed")
        
        self.polly = boto3.client('polly',
            aws_access_key_id=os.getenv('AWS_ACCESS_KEY_ID'),
            aws_secret_access_key=os.getenv('AWS_SECRET_ACCESS_KEY'),
            region_name=os.getenv('AWS_REGION', 'us-east-1')
        )
    
    async def synthesize_speech(self, text: str, language: str = "en-US") -> Optional[str]:
        """Convert text to speech using AWS Polly"""
        
        try:
            # Child-friendly voices
            voice_map = {
                "en-US": "Joanna",
                "es-ES": "Conchita",
                "fr-FR": "Celine",
                "de-DE": "Marlene",
                "it-IT": "Carla",
                "pt-BR": "Camila"
            }
            
            voice_id = voice_map.get(language, "Joanna")
            
            # SSML for child-friendly speech
            ssml_text = f"""
            <speak>
                <prosody rate="90%" pitch="+10%">
                    {text}
                </prosody>
            </speak>
            """
            
            response = self.polly.synthesize_speech(
                Text=ssml_text,
                TextType='ssml',
                OutputFormat='mp3',
                VoiceId=voice_id
            )
            
            # Save to file
            audio_filename = f"narration_{uuid.uuid4().hex}.mp3"
            audio_path = Path("static") / audio_filename
            
            with open(audio_path, "wb") as f:
                f.write(response['AudioStream'].read())
            
            return f"/static/{audio_filename}"
            
        except Exception as e:
            print(f"AWS Polly TTS Error: {e}")
            return None


class FallbackTTS:
    """Simple fallback TTS using system voice (for development)"""
    
    async def synthesize_speech(self, text: str, language: str = "en-US") -> Optional[str]:
        """Simple fallback - return None to force text display"""
        print(f"Fallback TTS: Would speak: {text}")
        return None


# TTS Provider factory
def get_tts_provider(provider: str = "azure"):
    """Get TTS provider based on configuration"""
    
    if provider == "azure":
        # Use the main Azure implementation from main.py
        from main import TTSService
        return TTSService()
    
    elif provider == "elevenlabs" and ELEVENLABS_AVAILABLE:
        return ElevenLabsTTS()
    
    elif provider == "google" and GOOGLE_TTS_AVAILABLE:
        return GoogleTTS()
    
    elif provider == "aws" and AWS_POLLY_AVAILABLE:
        return AWSPollyTTS()
    
    else:
        print(f"Provider {provider} not available, using fallback")
        return FallbackTTS()
