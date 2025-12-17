# Using Groq Cloud AI (Free Tier)

LampStand now supports **Groq** as a free cloud AI alternative to local Ollama. This enables you to run the app from anywhere without needing a local AI model.

## Setup Instructions

### 1. Get a Free Groq API Key
1. Visit [https://console.groq.com](https://console.groq.com)
2. Sign up for a free account (no credit card required)
3. Navigate to API Keys and create a new key
4. Copy your API key

### 2. Configure Environment Variables

Create or update your `.env.local` file:

```bash
# Bible API (required)
BIBLE_API_KEY=your_api_bible_key_here

# Switch to Groq
AI_PROVIDER=groq

# Groq Configuration
GROQ_API_KEY=your_groq_api_key_here
GROQ_MODEL=llama-3.1-70b-versatile
```

### 3. Install Dependencies

```bash
npm install
```

### 4. Run the App

```bash
npm run dev
```

## Available Groq Models

- **llama-3.1-70b-versatile** (recommended) - Best quality, slower
- **llama-3.1-8b-instant** - Fastest, good quality
- **mixtral-8x7b-32768** - Alternative with 32k context
- **gemma2-9b-it** - Lightweight option

Change the model by updating `GROQ_MODEL` in your `.env.local`.

## Switching Back to Ollama

To use local Ollama again:

```bash
AI_PROVIDER=ollama
OLLAMA_API_URL=http://localhost:11434
OLLAMA_MODEL=qwen2.5:32b
```

## Groq Free Tier Limits

- **14,400 requests per day**
- **30 requests per minute**
- More than enough for personal use!

## Deploy to Vercel

With Groq, you can now deploy LampStand to Vercel:

1. Push your code to GitHub
2. Connect repository to Vercel
3. Add environment variables in Vercel dashboard:
   - `BIBLE_API_KEY`
   - `AI_PROVIDER=groq`
   - `GROQ_API_KEY`
   - `GROQ_MODEL=llama-3.1-70b-versatile`
4. Deploy!

Your app will be accessible from anywhere, including your phone.
