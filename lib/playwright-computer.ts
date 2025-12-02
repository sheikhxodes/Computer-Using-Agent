import { chromium, Browser, BrowserContext, Page } from 'playwright';

export interface EnvState {
  screenshot: string; // base64
  url: string;
}

export class PlaywrightComputer {
  private browser?: Browser;
  private context?: BrowserContext;
  private page?: Page;
  private screenSize: [number, number];

  constructor(options: {
    screenSize?: [number, number];
    initialUrl?: string;
    highlightMouse?: boolean;
  }) {
    this.screenSize = options.screenSize || [1280, 720];
  }

  async start(): Promise<void> {
    this.browser = await chromium.launch({
      headless: process.env.PLAYWRIGHT_HEADLESS === 'true',
    });

    this.context = await this.browser.newContext({
      viewport: {
        width: this.screenSize[0],
        height: this.screenSize[1],
      },
    });

    this.page = await this.context.newPage();
    await this.page.goto('https://www.google.com');
  }

  async currentState(): Promise<EnvState> {
    if (!this.page) throw new Error('Browser not initialized');

    await this.page.waitForLoadState();
    await new Promise(resolve => setTimeout(resolve, 500));

    const screenshot = await this.page.screenshot({
      type: 'png',
      fullPage: false
    });

    return {
      screenshot: screenshot.toString('base64'),
      url: this.page.url(),
    };
  }

  async clickAt(x: number, y: number): Promise<EnvState> {
    if (!this.page) throw new Error('Browser not initialized');
    await this.page.mouse.click(x, y);
    return this.currentState();
  }

  async typeTextAt(
    x: number,
    y: number,
    text: string,
    options?: { pressEnter?: boolean }
  ): Promise<EnvState> {
    if (!this.page) throw new Error('Browser not initialized');
    await this.page.mouse.click(x, y);
    await this.page.keyboard.type(text);
    if (options?.pressEnter) {
      await this.page.keyboard.press('Enter');
    }
    return this.currentState();
  }

  async navigate(url: string): Promise<EnvState> {
    if (!this.page) throw new Error('Browser not initialized');
    const normalizedUrl = url.startsWith('http') ? url : `https://${url}`;
    await this.page.goto(normalizedUrl);
    return this.currentState();
  }

  async close(): Promise<void> {
    await this.context?.close();
    await this.browser?.close();
  }
}
