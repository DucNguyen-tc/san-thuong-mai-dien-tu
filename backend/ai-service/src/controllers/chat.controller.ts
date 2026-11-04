import { Request, Response } from 'express';
import { prisma } from '../config/prisma';
import { v4 as uuidv4 } from 'uuid';
import { ragService } from '../services/rag.service';
import { llmOrchestrator, ChatMessageParam } from '../services/llm-orchestrator';

/**
 * Helper to detect product search intent from user message
 */
function detectProductIntent(message: string): { isProductQuery: boolean; isComparison: boolean } {
  const lower = message.toLowerCase();
  const productKeywords = ['tìm', 'sản phẩm', 'mua', 'giá', 'bán', 'điện thoại', 'laptop', 'iphone', 'samsung', 'tai nghe', 'chuột', 'bàn phím', 'áo', 'quần'];
  const comparisonKeywords = ['so sánh', 'khác nhau', 'nên mua cái nào', 'hơn', 'giữa'];

  const isProductQuery = productKeywords.some((kw) => lower.includes(kw));
  const isComparison = comparisonKeywords.some((kw) => lower.includes(kw)) && isProductQuery;

  return { isProductQuery, isComparison };
}

/**
 * Generate sample metadata payload for Product Cards or Comparison Table
 * following Section 5.2 - 5.3 in docs/AI_SHOPPING_ASSISTANT_AND_RAG.md
 */
function getProductMetadata(message: string): any | null {
  const { isProductQuery, isComparison } = detectProductIntent(message);

  if (isComparison) {
    return {
      type: 'comparison_table',
      products: ['iPhone 15 Pro Max', 'Samsung Galaxy S24 Ultra'],
      attributes: [
        { name: 'Giá', values: ['28.990.000đ', '31.990.000đ'] },
        { name: 'Màn hình', values: ['6.7" OLED Super Retina', '6.8" Dynamic AMOLED 2X'] },
        { name: 'RAM', values: ['8GB', '12GB'] },
        { name: 'Bộ nhớ trong', values: ['256GB', '256GB'] },
        { name: 'Pin', values: ['4422mAh', '5000mAh'] },
      ],
      recommendation: 'Samsung Galaxy S24 Ultra phù hợp nếu bạn thích pin trâu và bút S-Pen, còn iPhone 15 Pro Max tối ưu cho quay phim và hệ sinh thái Apple.',
    };
  }

  if (isProductQuery) {
    return {
      type: 'product_cards',
      products: [
        {
          id: 'prod-iphone15-promax',
          name: 'iPhone 15 Pro Max 256GB Chính Hãng VNA',
          slug: 'iphone-15-pro-max-256gb',
          image_url: 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=500',
          price: 28990000,
          original_price: 32990000,
          discount_percent: 12,
          category: 'Điện thoại',
          in_stock: true,
          variant_id: 'var-ip15pm-titan-natural',
        },
        {
          id: 'prod-s24-ultra',
          name: 'Samsung Galaxy S24 Ultra 5G 12GB/256GB',
          slug: 'samsung-galaxy-s24-ultra',
          image_url: 'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=500',
          price: 31990000,
          original_price: 33990000,
          discount_percent: 6,
          category: 'Điện thoại',
          in_stock: true,
          variant_id: 'var-s24u-titan-gray',
        },
      ],
    };
  }

  return null;
}

/**
 * POST /api/ai/chat
 * Server-Sent Events (SSE) Streaming response
 * Supports streaming text chunks and metadata (Product Cards & Comparison Table)
 */
export const streamChat = async (req: Request, res: Response) => {
  // Set SSE Headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders?.();

  let isClientConnected = true;
  req.on('close', () => {
    isClientConnected = false;
  });

  const sendEvent = (event: string, data: any) => {
    if (!isClientConnected) return;
    res.write(`event: ${event}\n`);
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  };

  try {
    const { message, session_token } = req.body;
    const customerId = (req.headers['x-user-id'] as string) || null;

    if (!message || typeof message !== 'string' || !message.trim()) {
      sendEvent('error', { message: 'Message is required and must be a non-empty string' });
      res.end();
      return;
    }

    const trimmedMessage = message.trim();
    const token = session_token || uuidv4();

    // 1. Get or create chat session (with DB offline fallback)
    let session: any = null;
    try {
      session = await prisma.chatSession.findUnique({
        where: { sessionToken: token },
      });

      if (!session) {
        session = await prisma.chatSession.create({
          data: {
            sessionToken: token,
            customerId: customerId,
            title: trimmedMessage.slice(0, 50),
          },
        });
      }

      // 2. Save user message to database
      await prisma.chatMessage.create({
        data: {
          sessionId: session.id,
          role: 'user',
          content: trimmedMessage,
        },
      });
    } catch (dbErr: any) {
      // In-memory session when DB is not running
      session = { id: uuidv4(), sessionToken: token };
    }

    // 3. Send session metadata
    sendEvent('session', {
      session_id: session.id,
      session_token: session.sessionToken,
    });

    // 4. Retrieve RAG context chunks from knowledge base
    const ragChunks = await ragService.queryKnowledgeBase(trimmedMessage, 3, 0.6);

    // 5. Fetch recent message history (last 6 messages) for conversational memory
    let conversationHistory: ChatMessageParam[] = [];
    try {
      const previousMessages = await prisma.chatMessage.findMany({
        where: { sessionId: session.id },
        orderBy: { createdAt: 'desc' },
        take: 6,
      });

      conversationHistory = previousMessages
        .reverse()
        .map((m) => ({
          role: (m.role === 'assistant' || m.role === 'user' ? m.role : 'user') as 'user' | 'assistant',
          content: m.content || '',
        }));
    } catch {
      conversationHistory = [{ role: 'user', content: trimmedMessage }];
    }

    if (conversationHistory.length === 0) {
      conversationHistory = [{ role: 'user', content: trimmedMessage }];
    }

    // 6. Stream LLM response
    const fullResponse = await llmOrchestrator.streamResponse(
      conversationHistory,
      ragChunks,
      (textChunk: string) => {
        sendEvent('message', {
          type: 'text_chunk',
          content: textChunk,
        });
      }
    );

    // 7. Check if Product Cards / Comparison metadata should be sent
    const metadataPayload = getProductMetadata(trimmedMessage);
    if (metadataPayload) {
      sendEvent('message', {
        type: 'metadata',
        payload: metadataPayload,
      });
    }

    // 8. Save assistant message with metadata if DB is connected
    try {
      if (session?.id) {
        await prisma.chatMessage.create({
          data: {
            sessionId: session.id,
            role: 'assistant',
            content: fullResponse,
            metadata: metadataPayload ? metadataPayload : undefined,
          },
        });
      }
    } catch {}

    // 9. Send stream completion
    sendEvent('done', { type: 'done' });
    res.end();
  } catch (error: any) {
    console.error('[Chat Controller] Stream error:', error);
    sendEvent('error', { message: error.message || 'Error occurred while streaming' });
    res.end();
  }
};

/**
 * GET /api/ai/sessions/:sessionToken/messages
 */
export const getChatHistory = async (req: Request, res: Response) => {
  try {
    const { sessionToken } = req.params;

    const session = await prisma.chatSession.findUnique({
      where: { sessionToken },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!session) {
      return res.status(404).json({ success: false, message: 'Chat session not found' });
    }

    const messages = session.messages.map((m) => ({
      ...m,
      id: m.id.toString(),
    }));

    return res.status(200).json({
      success: true,
      data: {
        session,
        messages,
      },
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve chat history',
      error: error.message,
    });
  }
};
