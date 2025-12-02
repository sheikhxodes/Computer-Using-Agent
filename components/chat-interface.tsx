'use client';

import { useChat } from '@ai-sdk/react';
import {
  Conversation,
  ConversationContent,
} from '@/components/ai-elements/conversation';
import {
  Message,
  MessageContent,
  MessageResponse,
} from '@/components/ai-elements/message';
import {
  PromptForm,
  PromptInput,
} from '@/components/ai-elements/prompt-input';
import { Reasoning } from '@/components/ai-elements/reasoning';
import { Tool } from '@/components/ai-elements/tool';

export default function ChatInterface() {
  const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat({
    api: '/api/chat',
    maxSteps: 15,
  });

  return (
    <div className="flex h-screen flex-col">
      <header className="border-b p-4">
        <h1 className="text-2xl font-bold">Gemini Computer-Using Agent</h1>
        <p className="text-sm text-muted-foreground">
          Powered by Gemini 3 + Playwright
        </p>
      </header>

      <Conversation className="flex-1 overflow-auto">
        <ConversationContent>
          {messages.map((message, index) => (
            <Message key={index} from={message.role}>
              <MessageContent>
                {/* Display reasoning if available */}
                {message.reasoning && (
                  <Reasoning>{message.reasoning}</Reasoning>
                )}

                {/* Display tool calls */}
                {message.toolInvocations?.map((tool, toolIndex) => (
                  <Tool
                    key={toolIndex}
                    name={tool.toolName}
                    args={tool.args}
                    result={tool.result}
                  />
                ))}

                {/* Display message content */}
                <MessageResponse>{message.content}</MessageResponse>

                {/* Display screenshot if available */}
                {message.experimental_attachments?.map((attachment, i) => (
                  <img
                    key={i}
                    src={attachment.url}
                    alt="Screenshot"
                    className="mt-2 rounded border"
                  />
                ))}
              </MessageContent>
            </Message>
          ))}
        </ConversationContent>
      </Conversation>

      <footer className="border-t p-4">
        <PromptForm onSubmit={handleSubmit}>
          <PromptInput
            value={input}
            onChange={handleInputChange}
            placeholder="Ask me to browse the web..."
            disabled={isLoading}
          />
        </PromptForm>
      </footer>
    </div>
  );
}
