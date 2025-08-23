from fastapi import FastAPI, File, UploadFile, HTTPException, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
import uvicorn
import tempfile
import os
import json
import re
from typing import Optional, Dict, Any
import asyncio
from pathlib import Path
import uuid
import time

# For image processing
from PIL import Image
import base64
import io

# For LLM integration (using OpenAI as example)
import openai
from openai import OpenAI

# For TTS (using Azure Speech Services as example)
import azure.cognitiveservices.speech as speechsdk

# Environment variables
from dotenv import load_dotenv
load_dotenv()

app = FastAPI(
    title="GlimmerRead - Child Reading Assistant",
    description="AI-powered reading assistant for children's picture books",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],  # Allow frontend origins
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

# Create necessary directories
TEMP_DIR = Path("temp_files")
STATIC_DIR = Path("static")
TEMP_DIR.mkdir(exist_ok=True)
STATIC_DIR.mkdir(exist_ok=True)

# Mount static files
app.mount("/static", StaticFiles(directory="static"), name="static")
app.mount("/pictures", StaticFiles(directory="../pictures"), name="pictures")

# Initialize OpenAI client
openai_client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

# Azure Speech configuration
speech_config = speechsdk.SpeechConfig(
    subscription=os.getenv("AZURE_SPEECH_KEY"),
    region=os.getenv("AZURE_SPEECH_REGION")
)


class NarrationService:
    """Service for generating narrations from images using multimodal LLM"""
    
    @staticmethod
    async def analyze_image(image_data: bytes, age: int = 5, language: str = "en") -> Dict[str, Any]:
        """Analyze image and generate child-friendly narration"""
        
        # Convert image to base64
        image_base64 = base64.b64encode(image_data).decode('utf-8')
        
        # Age-appropriate prompts
        age_prompts = {
            3: "very simple words, 1-2 sentences",
            4: "simple words, 2-3 sentences", 
            5: "easy words, 3-4 sentences",
            6: "basic vocabulary, 4-5 sentences",
            7: "elementary vocabulary, 5-6 sentences"
        }
        
        complexity = age_prompts.get(age, "simple words, 3-4 sentences")
        
        prompt = f"""
        You are a friendly children's reading assistant. Look at this picture book page and create a warm, engaging narration for a {age}-year-old child.

        Guidelines:
        - Use {complexity}
        - Be encouraging and positive
        - Focus on what's happening in the picture
        - Use child-friendly language
        - Make it sound like a caring adult reading to a child
        - Include emotions and descriptive words that help imagination
        - Keep it safe and appropriate

        Return your response as JSON with this exact structure:
        {{
            "narration_text": "Your warm, engaging narration here"
        }}

        Language: {language}
        """
        
        try:
            response = openai_client.chat.completions.create(
                model="gpt-4o",
                messages=[
                    {
                        "role": "user",
                        "content": [
                            {"type": "text", "text": prompt},
                            {
                                "type": "image_url",
                                "image_url": {
                                    "url": f"data:image/jpeg;base64,{image_base64}"
                                }
                            }
                        ]
                    }
                ],
                max_tokens=300,
                temperature=0.7
            )
            
            # Parse the JSON response
            content = response.choices[0].message.content
            # Extract JSON from the response (in case there's extra text)
            json_match = re.search(r'\{.*\}', content, re.DOTALL)
            if json_match:
                result = json.loads(json_match.group())
                return result
            else:
                raise ValueError("No JSON found in response")
                
        except Exception as e:
            print(f"Error in image analysis: {e}")
            # Fallback response
            return {
                "narration_text": "What a wonderful picture! I can see so many interesting things happening here. Let's look closely together and imagine the story!"
            }
    
    @staticmethod
    async def analyze_multiple_images(image_data_list: list, filenames: list, age: int = 5, language: str = "en") -> Dict[str, Any]:
        """Analyze multiple images and generate a connected story"""
        
        # Convert all images to base64
        image_content = []
        for i, image_data in enumerate(image_data_list):
            image_base64 = base64.b64encode(image_data).decode('utf-8')
            image_content.append({
                "type": "image_url",
                "image_url": {
                    "url": f"data:image/jpeg;base64,{image_base64}"
                }
            })
        
        # Age-appropriate prompts for longer stories
        age_prompts = {
            3: "very simple words, 3-4 sentences total",
            4: "simple words, 4-6 sentences total", 
            5: "easy words, 6-8 sentences total",
            6: "basic vocabulary, 8-10 sentences total",
            7: "elementary vocabulary, 10-12 sentences total"
        }
        
        complexity = age_prompts.get(age, "easy words, 6-8 sentences total")
        image_count = len(image_data_list)
        
        prompt = f"""
        You are a friendly children's reading assistant. Look at these {image_count} picture book pages and create a warm, engaging story that connects all the images for a {age}-year-old child.

        Guidelines:
        - Use {complexity}
        - Create a flowing story that connects all {image_count} images
        - Be encouraging and positive
        - Focus on what's happening across all the pictures
        - Use child-friendly language
        - Make it sound like a caring adult telling a complete story
        - Include emotions and descriptive words that help imagination
        - Keep it safe and appropriate
        - Make the story longer and more detailed since there are multiple images
        - Connect the scenes logically to create one cohesive narrative

        Return your response as JSON with this exact structure:
        {{
            "narration_text": "Your warm, engaging connected story here (longer due to multiple images)"
        }}

        Language: {language}
        """
        
        try:
            # Create message content with text prompt and all images
            message_content = [{"type": "text", "text": prompt}] + image_content
            
            response = openai_client.chat.completions.create(
                model="gpt-4o",
                messages=[
                    {
                        "role": "user",
                        "content": message_content
                    }
                ],
                max_tokens=500 + (image_count * 100),  # More tokens for multiple images
                temperature=0.7
            )
            
            # Parse the JSON response
            content = response.choices[0].message.content
            # Extract JSON from the response (in case there's extra text)
            json_match = re.search(r'\{.*\}', content, re.DOTALL)
            if json_match:
                result = json.loads(json_match.group())
                return result
            else:
                raise ValueError("No JSON found in response")
                
        except Exception as e:
            print(f"Error in multiple image analysis: {e}")
            # Fallback response for multiple images
            return {
                "narration_text": f"What an amazing collection of {image_count} pictures! Each one tells part of a wonderful story. I can see so many exciting things happening across all these images. Together, they create a magical adventure that we can explore and imagine together!"
            }


class SafetyFilter:
    """Content safety and length filtering"""
    
    @staticmethod
    def filter_content(text: str, max_words: int = 100) -> str:
        """Apply safety and length filters"""
        
        # Remove potentially unsafe content
        unsafe_patterns = [
            r'\b(scary|frightening|dangerous|violent|hurt|pain|death|die|kill)\b',
            # Add more patterns as needed
        ]
        
        filtered_text = text
        for pattern in unsafe_patterns:
            filtered_text = re.sub(pattern, '', filtered_text, flags=re.IGNORECASE)
        
        # Length limiting
        words = filtered_text.split()
        if len(words) > max_words:
            filtered_text = ' '.join(words[:max_words]) + "..."
        
        return filtered_text.strip()


class TTSService:
    """Text-to-Speech service using Azure Speech Services"""
    
    @staticmethod
    async def synthesize_speech(text: str, language: str = "en-US") -> str:
        """Convert text to speech and return file path"""
        
        try:
            # Configure voice based on language
            voice_map = {
                "en-US": "en-US-JennyNeural",  # Child-friendly voice
                "es-ES": "es-ES-ElviraNeural",
                "fr-FR": "fr-FR-DeniseNeural",
                # Add more languages as needed
            }
            
            voice_name = voice_map.get(language, "en-US-JennyNeural")
            
            # Create SSML for more natural speech
            ssml = f"""
            <speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="{language}">
                <voice name="{voice_name}">
                    <prosody rate="0.9" pitch="+10%">
                        {text}
                    </prosody>
                </voice>
            </speak>
            """
            
            # Generate unique filename
            audio_filename = f"narration_{uuid.uuid4().hex}.wav"
            audio_path = STATIC_DIR / audio_filename
            
            # Configure audio output
            audio_config = speechsdk.audio.AudioOutputConfig(filename=str(audio_path))
            speech_config.speech_synthesis_voice_name = voice_name
            
            # Create synthesizer and synthesize
            synthesizer = speechsdk.SpeechSynthesizer(
                speech_config=speech_config, 
                audio_config=audio_config
            )
            
            result = synthesizer.speak_ssml_async(ssml).get()
            
            if result.reason == speechsdk.ResultReason.SynthesizingAudioCompleted:
                return f"/static/{audio_filename}"
            else:
                raise Exception(f"Speech synthesis failed: {result.reason}")
                
        except Exception as e:
            print(f"TTS Error: {e}")
            # Return None if TTS fails - client will use text fallback
            return None


@app.get("/")
async def root():
    """Health check endpoint"""
    return {"message": "GlimmerRead API is running!", "version": "1.0.0"}


@app.post("/generate")
async def generate_narration(
    image: UploadFile = File(...),
    age: int = Form(5),
    language: str = Form("en-US")
):
    """
    Generate voice narration from a picture book image
    
    - **image**: Picture book page image (jpg, png)
    - **age**: Child's age (3-10)
    - **language**: Language code (en-US, es-ES, fr-FR)
    """
    
    try:
        # Validate file type
        if not image.content_type.startswith('image/'):
            raise HTTPException(status_code=400, detail="File must be an image")
        
        # Validate age range
        if not 3 <= age <= 10:
            raise HTTPException(status_code=400, detail="Age must be between 3 and 10")
        
        # Read and validate image
        image_data = await image.read()
        if len(image_data) > 10 * 1024 * 1024:  # 10MB limit
            raise HTTPException(status_code=400, detail="Image too large (max 10MB)")
        
        # Validate image format
        try:
            img = Image.open(io.BytesIO(image_data))
            img.verify()
        except Exception:
            raise HTTPException(status_code=400, detail="Invalid image format")
        
        # Step 1: Analyze image with VLM
        narration_data = await NarrationService.analyze_image(
            image_data, age, language
        )
        
        # Step 2: Apply safety filters
        safe_narration = SafetyFilter.filter_content(
            narration_data["narration_text"], 
            max_words=50 + (age * 10)  # Scale with age
        )
        
        # Step 3: Generate speech
        audio_url = await TTSService.synthesize_speech(safe_narration, language)
        
        # Step 4: Return response
        response = {
            "narration_text": safe_narration,
            "audio_url": audio_url,
            "age": age,
            "language": language,
            "timestamp": int(time.time())
        }
        
        return response
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Unexpected error: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@app.post("/generate-from-filename")
async def generate_narration_from_filename(
    image_filenames: str = Form(...),  # Now accepts comma-separated filenames
    age: int = Form(5),
    language: str = Form("en-US")
):
    """
    Generate voice narration from picture book images using filenames
    
    - **image_filenames**: Picture book image filenames, comma-separated (e.g., "1.png,2.png,3.png")
    - **age**: Child's age (3-10)
    - **language**: Language code (en-US, es-ES, fr-FR)
    """
    
    try:
        # Validate age range
        if not 3 <= age <= 10:
            raise HTTPException(status_code=400, detail="Age must be between 3 and 10")
        
        # Parse image filenames
        filenames = [f.strip() for f in image_filenames.split(',') if f.strip()]
        if not filenames:
            raise HTTPException(status_code=400, detail="No image filenames provided")
        
        # Limit to maximum 4 images per request
        if len(filenames) > 4:
            filenames = filenames[:4]
        
        image_data_list = []
        valid_filenames = []
        
        # Read and validate all images
        for filename in filenames:
            image_path = Path("../pictures") / filename
            
            if not image_path.exists():
                print(f"Warning: Image file '{filename}' not found, skipping")
                continue
            
            try:
                with open(image_path, 'rb') as f:
                    image_data = f.read()
                
                # Validate image format
                img = Image.open(io.BytesIO(image_data))
                img.verify()
                
                image_data_list.append(image_data)
                valid_filenames.append(filename)
            except Exception as e:
                print(f"Warning: Invalid image format for '{filename}': {e}, skipping")
                continue
        
        if not image_data_list:
            raise HTTPException(status_code=400, detail="No valid images found")
        
        # Step 1: Analyze images with VLM
        if len(image_data_list) == 1:
            # Single image analysis
            narration_data = await NarrationService.analyze_image(
                image_data_list[0], age, language
            )
        else:
            # Multiple images analysis
            narration_data = await NarrationService.analyze_multiple_images(
                image_data_list, valid_filenames, age, language
            )
        
        # Step 2: Apply safety filters with longer content for multiple images
        word_limit = 50 + (age * 10) + (len(image_data_list) * 30)  # More words for more images
        safe_narration = SafetyFilter.filter_content(
            narration_data["narration_text"], 
            max_words=word_limit
        )
        
        # Step 3: Generate speech
        audio_url = await TTSService.synthesize_speech(safe_narration, language)
        
        # Step 4: Return response
        response = {
            "narration_text": safe_narration,
            "audio_url": audio_url,
            "age": age,
            "language": language,
            "image_filenames": valid_filenames,
            "image_count": len(valid_filenames),
            "timestamp": int(time.time())
        }
        
        return response
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Unexpected error: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@app.get("/audio/{filename}")
async def get_audio(filename: str):
    """Serve audio files"""
    file_path = STATIC_DIR / filename
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="Audio file not found")
    
    return FileResponse(
        file_path,
        media_type="audio/wav",
        headers={"Cache-Control": "public, max-age=3600"}
    )


@app.delete("/cleanup")
async def cleanup_temp_files():
    """Clean up old temporary files (call periodically)"""
    try:
        current_time = time.time()
        deleted_count = 0
        
        # Delete files older than 1 hour
        for file_path in STATIC_DIR.glob("*.wav"):
            if current_time - file_path.stat().st_mtime > 3600:
                file_path.unlink()
                deleted_count += 1
        
        return {"message": f"Cleaned up {deleted_count} files"}
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Cleanup failed: {e}")


if __name__ == "__main__":
    uvicorn.run(
        "main:app", 
        host="0.0.0.0", 
        port=8000, 
        reload=True
    )
