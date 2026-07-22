# TeachBack

TeachBack is an AI-powered study tool with a teach-back twist: instead of the AI explaining topics to you, **you explain topics to the AI**, and it grades your understanding, surfaces gaps, and asks a targeted follow-up. When you score 80+ on a topic, you can mint a **Proof of Mastery** on Solana devnet — a permanent, portable, tamper-proof credential anchored on-chain and tied to your wallet, not stored in our database.

## Quick start

```bash
cp src/environments/environment.example.ts src/environments/environment.ts
# Add your Groq API key to environment.ts

npm install
npm start
```

Open `http://localhost:4200/`. You need the [Phantom](https://phantom.app/) wallet with devnet SOL to mint credentials.

## Features

- **TeachBack** — explain a topic, get graded, answer a follow-up, mint on-chain at 80+
- **Now Learning** — topics and scores saved in `localStorage`; continue where you left off
- **Long Test** — 10–15 AI-generated multiple-choice questions, graded F through A+

## Routes

| Path | Page |
|------|------|
| `/` | TeachBack flow |
| `/learning` | Now Learning (local storage) |
| `/test` | Long Test |

## Demo flow

1. Pick a topic (or click an example chip)
2. Explain it like you're teaching a beginner
3. Review AI grading: what you got right, wrong, and missed
4. Answer the follow-up question
5. See your final score and complete explanation
6. Score 80+ → connect Phantom → mint Proof of Mastery on Solana devnet

## Tech stack

- Angular 20 (standalone components, signals)
- Groq API (`openai/gpt-oss-120b`)
- Solana devnet (SPL Memo transactions via Phantom)

## Note on API keys

The Groq API key is loaded client-side for this hackathon demo. It is visible in the browser bundle — use a dedicated key and rotate after the event.

## Phantom wallet note

If you see `[PHANTOM] error getting provider injection options` in the browser console, that comes from the Phantom extension itself — it is harmless and does not block Connect Wallet or minting.
