import { GoogleAIProvider } from '@ai-sdk/google';
import { streamText } from 'ai';
import { z } from 'zod';
import { chromium } from 'playwright';

class ComputerUsingAgent {
  constructor() {
    this.googleAI = new GoogleAIProvider({
      apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
    });
    this.jobs = {};
  }

  async initialize() {
    this.browser = await chromium.launch({
      headless: false,
      chromiumSandbox: true,
      env: {},
      args: ["--disable-extensions", "--disable-file-system"],
    });
    this.page = await this.browser.newPage();
    await this.page.setViewportSize({ width: 1024, height: 768 });
  }

  async takeScreenshot() {
    const screenshot = await this.page.screenshot();
    return screenshot.toString('base64');
  }

  async executeAction(action) {
    if (action.toolName === 'click') {
      const { x, y } = action.args;
      await this.page.mouse.click(x, y);
    } else if (action.toolName === 'type') {
      const { x, y, text } = action.args;
      await this.page.mouse.click(x, y);
      await this.page.keyboard.type(text);
    }
  }

  async runTask(prompt) {
    await this.page.goto("https://google.com");

    while (true) {
      const screenshot = await this.takeScreenshot();

      const result = await experimental_streamText({
        model: this.googleAI('models/gemini-1.5-pro-latest'),
        tools: {
          click: {
            description: 'Click on an element',
            parameters: z.object({
              x: z.number(),
              y: z.number(),
            }),
          },
          type: {
            description: 'Type text into an element',
            parameters: z.object({
              x: z.number(),
              y: z.number(),
              text: z.string(),
            }),
          },
        },
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: prompt },
              { type: 'image', image: screenshot },
            ],
          },
        ],
      });

      let actionTaken = false;
      for await (const toolCall of result.toolInvocations) {
        await this.executeAction(toolCall);
        actionTaken = true;
      }

      if (!actionTaken) {
        break;
      }
    }
  }

  start(prompt) {
    const jobId = Math.random().toString(36).substring(7);
    this.jobs[jobId] = { status: 'running' };
    this.runTask(prompt)
      .then(() => {
        this.jobs[jobId].status = 'completed';
      })
      .catch((error) => {
        this.jobs[jobId].status = 'failed';
        this.jobs[jobId].error = error;
      });
    return jobId;
  }

  getStatus(jobId) {
    return this.jobs[jobId];
  }

  async startAndWait(prompt) {
    const jobId = this.start(prompt);
    while (this.getStatus(jobId).status === 'running') {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    return this.getStatus(jobId);
  }
}

async function main() {
  const agent = new ComputerUsingAgent();
  await agent.initialize();

  // Example of startAndWait
  const result = await agent.startAndWait("Search for 'Vercel AI SDK' and click on the first result.");
  console.log(result);

  // Example of async pattern
  const jobId = agent.start("Search for 'Next.js' and click on the first result.");
  while (agent.getStatus(jobId).status === 'running') {
    console.log('Job is running...');
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  console.log(agent.getStatus(jobId));
}

main();
