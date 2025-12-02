import { tool } from 'ai';
import { z } from 'zod';
import { PlaywrightComputer } from './playwright-computer';

export function createComputerTools(computer: PlaywrightComputer) {
  return {
    click_at: tool({
      description: `
        <tool_description>
          <purpose>Click at specific screen coordinates</purpose>
          <when_to_use>
            - To interact with buttons, links, or clickable elements
            - When the user wants to select or activate something
          </when_to_use>
          <coordinates>Use pixel coordinates from the screenshot</coordinates>
        </tool_description>
      `,
      parameters: z.object({
        x: z.number().describe('X coordinate in pixels'),
        y: z.number().describe('Y coordinate in pixels'),
      }),
      execute: async ({ x, y }) => {
        const state = await computer.clickAt(x, y);
        return {
          success: true,
          url: state.url,
          screenshot: state.screenshot,
        };
      },
    }),

    type_text_at: tool({
      description: `
        <tool_description>
          <purpose>Type text at specific coordinates</purpose>
          <when_to_use>
            - To fill in text fields, search boxes, or forms
            - When text input is required
          </when_to_use>
          <behavior>Clicks the coordinates first, then types</behavior>
        </tool_description>
      `,
      parameters: z.object({
        x: z.number().describe('X coordinate in pixels'),
        y: z.number().describe('Y coordinate in pixels'),
        text: z.string().describe('Text to type'),
        press_enter: z.boolean().optional().describe('Press Enter after typing'),
      }),
      execute: async ({ x, y, text, press_enter }) => {
        const state = await computer.typeTextAt(x, y, text, {
          pressEnter: press_enter,
        });
        return {
          success: true,
          url: state.url,
          screenshot: state.screenshot,
        };
      },
    }),

    navigate: tool({
      description: `
        <tool_description>
          <purpose>Navigate to a URL</purpose>
          <when_to_use>
            - To open a new website
            - To change the current page
          </when_to_use>
          <url_format>Accepts URLs with or without https://</url_format>
        </tool_description>
      `,
      parameters: z.object({
        url: z.string().describe('URL to navigate to'),
      }),
      execute: async ({ url }) => {
        const state = await computer.navigate(url);
        return {
          success: true,
          url: state.url,
          screenshot: state.screenshot,
        };
      },
    }),

    get_current_state: tool({
      description: 'Get the current browser state with screenshot',
      parameters: z.object({}),
      execute: async () => {
        const state = await computer.currentState();
        return {
          success: true,
          url: state.url,
          screenshot: state.screenshot,
        };
      },
    }),
  };
}
