# AI Assistant Setup

The AI assistants use Groq from the backend, so the API key is never exposed to React.

## Create A Groq API Key

1. Open [Groq Console API Keys](https://console.groq.com/keys).
2. Sign in or create a Groq account.
3. Click **Create API Key**.
4. Copy the generated key.
5. Open `backend/.env`.
6. Replace this placeholder:

```env
GROQ_API_KEY=your_groq_key_here
```

with your real key:

```env
GROQ_API_KEY=gsk_your_real_key_here
```

Keep these values:

```env
AI_PROVIDER=groq
AI_MODEL=llama-3.1-8b-instant
```

After changing `.env`, restart the backend:

```powershell
cd backend
node server.js
```

Where to test:

- Customer app: login, open Profile, use the Shopping Helper.
- Seller app: login, open Dashboard, use the Seller Growth Helper.
- Admin app: login, open Dashboard, use the Admin Operations Helper.
