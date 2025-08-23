# 👁️📚 EyeReadDemo - Eye-Tracking Reading Assistant Research Demo

EyeReadDemo is a research demonstration combining eye-tracking technology with AI-powered reading assistance for children. This demo explores how eye-tracking can enhance picture book reading experiences through intelligent voice narration and interactive storytelling. Upload a photo of any picture book page, and the system creates engaging narration with optional discussion questions tailored to your child's age.

## ✨ Features

- 🎭 **Voice Narration**: AI-generated audio stories with child-friendly voices
- 🧠 **Vision Analysis**: Advanced image understanding of picture book pages
- 👶 **Age-Appropriate**: Content tailored for children ages 3-10
- 🌍 **Multi-Language**: Support for English, Spanish, French, German, Italian, and Portuguese
- 🔒 **Safe Content**: Built-in safety filters and content moderation
- 📱 **Mobile-Friendly**: Responsive design works on all devices
- 🎨 **Beautiful UI**: Child-friendly interface with smooth animations

## 🏗️ Architecture

### Frontend (React)
- Modern React application with hooks and functional components
- Drag-and-drop image upload with validation
- Custom audio player with progress tracking
- Age and language selection controls
- Responsive design with accessibility features

### Backend (FastAPI)
- **Vision Analysis**: OpenAI GPT-4 Vision for image understanding
- **Text-to-Speech**: Azure Speech Services for natural voice generation
- **Safety Filters**: Content moderation for child-appropriate output
- **File Management**: Temporary file handling with automatic cleanup
- **API**: RESTful endpoints with comprehensive error handling

## 🚀 Quick Start

### Prerequisites

- Docker and Docker Compose
- OpenAI API key (for GPT-4 Vision)
- Azure Speech Services key and region

### Installation

1. **Clone the repository:**
```bash
git clone <your-repo-url>
cd EyeReadDemo
```

2. **Set up environment variables:**
```bash
# Copy the example environment file
cp backend/env.example backend/.env

# Edit the .env file with your API keys
# Required:
OPENAI_API_KEY=your_openai_api_key_here
AZURE_SPEECH_KEY=your_azure_speech_key_here
AZURE_SPEECH_REGION=your_azure_region_here
```

3. **Start the application:**
```bash
docker-compose up --build
```

4. **Open your browser:**
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API Documentation: http://localhost:8000/docs

## 🛠️ Development Setup

### Backend Development

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Set up environment variables
cp env.example .env
# Edit .env with your API keys

# Run development server
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### Frontend Development

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm start
```

## 📋 API Documentation

### POST `/generate`

Generate voice narration from a picture book image.

**Parameters:**
- `image` (file): Picture book page image (JPG, PNG, max 10MB)
- `age` (int): Child's age (3-10)
- `language` (string): Language code (en-US, es-ES, fr-FR, etc.)

**Response:**
```json
{
  "narration_text": "Once upon a time, there was a little bunny...",
  "question": "What do you think the bunny is feeling?",
  "audio_url": "/static/narration_abc123.wav",
  "age": 5,
  "language": "en-US",
  "timestamp": 1699123456
}
```

### GET `/cleanup`

Clean up old temporary audio files (run periodically).

## 🔧 Configuration

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `OPENAI_API_KEY` | OpenAI API key for GPT-4 Vision | Yes |
| `AZURE_SPEECH_KEY` | Azure Speech Services key | Yes |
| `AZURE_SPEECH_REGION` | Azure Speech Services region | Yes |

### Age Groups & Content Adaptation

- **3-4 years**: Very simple words, 1-3 sentences, focus on basic concepts
- **5-6 years**: Simple vocabulary, 3-5 sentences, emotional descriptions
- **7-8 years**: Elementary vocabulary, 5-6 sentences, more complex narratives
- **9-10 years**: Expanded vocabulary, detailed descriptions, deeper questions

### Supported Languages

- 🇺🇸 English (en-US)
- 🇪🇸 Spanish (es-ES)
- 🇫🇷 French (fr-FR)
- 🇩🇪 German (de-DE)
- 🇮🇹 Italian (it-IT)
- 🇧🇷 Portuguese (pt-BR)

## 🛡️ Safety Features

- **Content Filtering**: Removes potentially scary or inappropriate content
- **Length Limits**: Age-appropriate story length (50-150 words)
- **Voice Settings**: Child-friendly speech synthesis settings
- **File Validation**: Image type and size validation
- **Error Handling**: Graceful fallbacks for all failure scenarios

## 🚢 Deployment

### Production Docker Setup

```bash
# Build and run in production mode
docker-compose -f docker-compose.prod.yml up --build -d

# Scale services
docker-compose up --scale backend=3

# View logs
docker-compose logs -f
```

### Environment-Specific Configuration

Create separate environment files:
- `.env.development`
- `.env.staging` 
- `.env.production`

## 🧪 Testing

### Backend Tests
```bash
cd backend
pytest tests/ -v
```

### Frontend Tests
```bash
cd frontend
npm test
```

### End-to-End Tests
```bash
npm run test:e2e
```

## 📊 Performance

- **Image Processing**: ~3-5 seconds for vision analysis
- **TTS Generation**: ~2-3 seconds for audio synthesis
- **Total Response Time**: ~8-12 seconds average
- **File Size**: Audio files ~500KB-2MB
- **Cleanup**: Automatic cleanup after 1 hour

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Troubleshooting

### Common Issues

**1. Audio not playing**
- Check browser audio permissions
- Verify Azure Speech Services configuration
- Try refreshing the page

**2. Image upload fails**
- Ensure image is under 10MB
- Check supported formats (JPG, PNG, GIF, WebP)
- Verify internet connection

**3. Slow response times**
- Check API key limits
- Verify server resources
- Consider image compression

**4. API errors**
- Check environment variables
- Verify API keys are valid
- Review server logs: `docker-compose logs backend`

### Getting Help

- 📖 Check the [API documentation](http://localhost:8000/docs)
- 🐛 [Report bugs](https://github.com/yourorg/EyeReadDemo/issues)
- 💬 [Join discussions](https://github.com/yourorg/EyeReadDemo/discussions)

## 🎯 Roadmap

- [ ] Offline TTS support
- [ ] Voice character selection
- [ ] Story continuation features
- [ ] Reading comprehension games
- [ ] Parent dashboard
- [ ] Multi-page story support
- [ ] Custom voice training
- [ ] Educational content integration

---

Research demo exploring eye-tracking technology for enhanced child reading experiences
