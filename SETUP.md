# Lampstand - Setup Guide

## Prerequisites
- Node.js 18+ installed
- Ollama installed and running
- ~~NewsAPI account~~ (NO LONGER NEEDED - using RSS feeds)
- API.Bible account (temporary fallback, will be replaced by local Sword modules)

## Setup Steps

### 1. Install Ollama Model

For best quality analysis with 32GB RAM, pull the qwen2.5:32b model:

```bash
ollama pull qwen2.5:32b
```

**Alternative models if you want faster responses:**
- `ollama pull qwen2.5:14b` (faster, still good quality)
- `ollama pull llama3.1:8b` (fastest, good for testing)

### 2. Get API Keys

#### NewsAPI (Free Tier - 100 requests/day)
1. Go to https://newsapi.org/register
2. Sign up for a free account
3. Copy your API key

#### API.Bible (Free)
1. Go to https://scripture.api.bible/signup
2. Sign up for a free account
3. Copy your API key

### 3. Configure Environment Variables

Edit the `.env.local` file in the project root and add your API keys:

```env
NEWSAPI_KEY=your_actual_newsapi_key_here
BIBLE_API_KEY=your_actual_bible_api_key_here
OLLAMA_API_URL=http://localhost:11434
OLLAMA_MODEL=qwen2.5:32b
```

**Note:** If using a different model, change the `OLLAMA_MODEL` value to match what you pulled (e.g., `qwen2.5:14b` or `llama3.1:8b`)

### 4. Install Dependencies

Dependencies are already installed, but if you need to reinstall:

```bash
npm install
```

### 5. Start Ollama

Make sure Ollama is running in the background:

```bash
# On Windows, Ollama should start automatically
# Or check if it's running:
ollama list
```

### 6. Run the Development Server

```bash
npm run dev
```

### 7. Open in Browser

Navigate to: http://localhost:3000

## How to Use

1. **Browse News Categories**: Click on any of the 7 category tabs (Israel, International, World Politics, Human Interest, US President, USA, Minnesota)

2. **Load Articles**: When you click a category, it will fetch 10 recent articles from NewsAPI

3. **Select Article**: Click on any article to read it

4. **Analyze with Bible**: Click the "Analyze with Bible" button to start the AI analysis

5. **View Results**: 
   - Watch as Ollama streams its analysis in real-time
   - See 3-5 themes identified in the article
   - View 2-3 relevant Bible passages for each theme
   - Read the full scripture text automatically fetched from API.Bible
   - Look for "Prophetic Parallel" badges on relevant connections

6. **Custom Articles**: Click "+ Paste Custom Article" at the top to analyze any text or article from other sources

## Performance Notes

- **qwen2.5:32b**: 30-60 seconds per analysis (best quality)
- **qwen2.5:14b**: 15-30 seconds per analysis (good balance)
- **llama3.1:8b**: 5-15 seconds per analysis (faster, slightly lower quality)

## Caching

Analyses are automatically cached in a SQLite database (`lampstand.db`). If you analyze the same article twice, it will load instantly from the cache.

## Troubleshooting

### Ollama Connection Error
- Make sure Ollama is running: `ollama list`
- Check that the API is accessible: `curl http://localhost:11434/api/version`

### NewsAPI Errors
- Verify your API key is correct in `.env.local`
- Check you haven't exceeded 100 requests/day
- Free tier has 24-hour delayed articles (this is fine for personal use)

### API.Bible Errors
- Verify your API key is correct in `.env.local`
- Some passage references may not be found if the format is unusual

### Model Performance
- If analysis is too slow, switch to a smaller model in `.env.local`
- If quality is insufficient, upgrade to qwen2.5:32b or llama3.1:70b (requires more RAM)

## Database Location

The SQLite database is created at: `lampstand.db` in the project root

To reset all cached data, simply delete this file.
