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

  async handleModelAction(action) {
    const actionType = action.toolName;

    try {
      switch (actionType) {
        case "click": {
          const { x, y, button = "left" } = action.args;
          console.log(`Action: click at (${x}, ${y}) with button '${button}'`);
          await this.page.mouse.click(x, y, { button });
          break;
        }

        case "scroll": {
          const { x, y, scrollX, scrollY } = action.args;
          console.log(
            `Action: scroll at (${x}, ${y}) with offsets (scrollX=${scrollX}, scrollY=${scrollY})`
          );
          await this.page.mouse.move(x, y);
          await this.page.evaluate(`window.scrollBy(${scrollX}, ${scrollY})`);
          break;
        }

        case "keypress": {
          const { keys } = action.args;
          for (const k of keys) {
            console.log(`Action: keypress '${k}'`);
            if (k.includes("ENTER")) {
              await this.page.keyboard.press("Enter");
            } else if (k.includes("SPACE")) {
              await this.page.keyboard.press(" ");
            } else {
              await this.page.keyboard.press(k);
            }
          }
          break;
        }

        case "type": {
          const { text } = action.args;
          console.log(`Action: type text '${text}'`);
          await this.page.keyboard.type(text);
          break;
        }

        case "wait": {
          console.log(`Action: wait`);
          await this.page.waitForTimeout(2000);
          break;
        }

        case "screenshot": {
          console.log(`Action: screenshot`);
          break;
        }

        default:
          console.log("Unrecognized action:", action);
      }
    } catch (e) {
      console.error("Error handling action", action, ":", e);
    }
  }

  async runTask(prompt) {
    await this.page.goto("https://google.com");

    const maxIterations = 10;
    let iterations = 0;
    while (iterations < maxIterations) {
      const screenshot = await this.takeScreenshot();

      const result = await streamText({
        model: this.googleAI('models/gemini-3-pro-preview'),
        tools: {
          click: {
            description: 'Click on an element',
            parameters: z.object({
              x: z.number(),
              y: z.number(),
              button: z.enum(['left', 'middle', 'right']).optional(),
            }),
          },
          scroll: {
            description: 'Scroll the page',
            parameters: z.object({
              x: z.number(),
              y: z.number(),
              scrollX: z.number(),
              scrollY: z.number(),
            }),
          },
          keypress: {
            description: 'Press a key',
            parameters: z.object({
              keys: z.array(z.string()),
            }),
          },
          type: {
            description: 'Type text',
            parameters: z.object({
              text: z.string(),
            }),
          },
          wait: {
            description: 'Wait for a period of time',
            parameters: z.object({}),
          },
          screenshot: {
            description: 'Take a screenshot',
            parameters: z.object({}),
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
        await this.handleModelAction(toolCall);
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
