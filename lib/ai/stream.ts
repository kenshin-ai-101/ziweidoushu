interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
  hidden?: boolean;
}

interface DeepSeekStreamOptions {
  systemPrompt: string;
  messages: Message[];
}

export async function DeepSeekStream({ systemPrompt, messages }: DeepSeekStreamOptions): Promise<ReadableStream> {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  const baseUrl = process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com';

  if (!apiKey) {
    throw new Error('DEEPSEEK_API_KEY is not configured');
  }

  const formattedMessages: Message[] = [
    { role: 'system', content: systemPrompt },
    ...messages.filter(m => !m.hidden).map(m => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    })),
  ];

  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'deepseek-chat',
      messages: formattedMessages,
      stream: true,
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`DeepSeek API error: ${response.status} ${error}`);
  }

  if (!response.body) {
    throw new Error('No response body from DeepSeek API');
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();

  return new ReadableStream({
    async start(controller) {
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (!line.startsWith('data: ')) continue;
            const data = line.slice(6);
            if (data === '[DONE]') {
              controller.enqueue(new TextEncoder().encode('data: [DONE]\n'));
              break;
            }
            try {
              const parsed = JSON.parse(data);
              const content = parsed.choices?.[0]?.delta?.content || '';
              if (content) {
                const sseData = JSON.stringify({ delta: { text: content } });
                controller.enqueue(new TextEncoder().encode(`data: ${sseData}\n`));
              }
            } catch {
              // Skip malformed JSON
            }
          }
        }
      } finally {
        controller.close();
      }
    },
  });
}
