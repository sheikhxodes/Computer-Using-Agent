# Computer-Using-Agent

 Gemini Computer Use model is a specialized model built on Gemini 2.5 Pro’s capabilities to power agents that can interact with user interfaces. Gemini 3 used with AI SDK Vercel most intelligent model to date. Build a computer-using agent that can perform tasks on your behalf. Computer use is a practical application of our Computer-Using Agent (CUA) model, computer-use-preview, which combines the vision capabilities Gemini 3 with advanced reasoning to simulate controlling computer interfaces and performing tasks.


 You can use the following optional settings to customize the Google Generative AI provider instance:

baseURL string

Use a different URL prefix for API calls, e.g. to use proxy servers. The default prefix is https://generativelanguage.googleapis.com/v1beta.

apiKey string

API key that is being sent using the x-goog-api-key header. It defaults to the GOOGLE_GENERATIVE_AI_API_KEY environment variable.

headers Record<string,string>

Custom headers to include in the requests.

fetch (input: RequestInfo, init?: RequestInit) => Promise<Response>

Custom fetch implementation. Defaults to the global fetch function. You can use it as a middleware to intercept requests, or to provide a custom fetch implementation for e.g. testing.

Language Models
