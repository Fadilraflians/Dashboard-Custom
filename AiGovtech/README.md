# AIGovtech

AIGovtech is a Module Federation chatbot remote used by `shell`. The shell
loads `remoteEntry.js` at port `3024`; the chat API runs at port `3125` and is
reached through the shell's `/api/gateway/aigovtech/chat` route.

## Development

Install the dependencies, then run `pnpm dev`. This starts the remote UI and
the chatbot API. Configure these values in the shell environment:

```env
MFE_AIGOVTECH_CHAT_SCOPE=aiGovtech
MFE_AIGOVTECH_CHAT_URL=http://localhost:3024/remoteEntry.js
MFE_AIGOVTECH_BACKEND_URL=http://localhost:3125
```

To enable AI responses, configure the API process with an OpenAI-compatible
chat completions endpoint. Keep credentials on the server:

```env
AI_CHAT_COMPLETIONS_URL=https://your-provider.example/v1/chat/completions
AI_API_KEY=your-server-side-key
AI_MODEL=your-chat-model
```

The API accepts `POST /chat` with `{ "messages": [{ "role": "user",
"content": "..." }] }` and forwards the conversation to the configured
provider. Without an endpoint, the API returns a clear configuration error.
