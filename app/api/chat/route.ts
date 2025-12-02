import { google } from '@ai-sdk/google';
import { streamText } from 'ai';
import { PlaywrightComputer } from '@/lib/playwright-computer';
import { createComputerTools } from '@/lib/tools';
import { readFileSync } from 'fs';
import { join } from 'path';

// Global computer instance (consider using a session manager in production)
let computer: PlaywrightComputer | null = null;

export const maxDuration = 300; // 5 minutes

export async function POST(req: Request) {
  const { messages } = await req.json();

  // Initialize browser if needed
  if (!computer) {
    computer = new PlaywrightComputer({
      screenSize: [1280, 720],
      highlightMouse: true,
    });
    await computer.start();
  }

  // Load structured system instructions
  const systemInstructions = readFileSync(
    join(process.cwd(), 'prompts/system-instructions.xml'),
    'utf-8'
  );

  // Get initial screenshot for context
  const initialState = await computer.currentState();

  const tools = createComputerTools(computer);

  const result = streamText({
    model: google('gemini-2.0-flash-exp'),
    system: systemInstructions,
    messages: [
      ...messages,
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: `Current URL: ${initialState.url}`,
          },
          {
            type: 'image',
            image: Buffer.from(initialState.screenshot, 'base64'),
          },
        ],
      },
    ],
    tools,
    maxSteps: 15,
    onFinish: async ({ finishReason }) => {
      console.log('Finish reason:', finishReason);
    },
  });

  return result.toDataStreamResponse();
}

// Cleanup on shutdown
process.on('SIGINT', async () => {
  if (computer) {
    await computer.close();
  }
  process.exit(0);
});
