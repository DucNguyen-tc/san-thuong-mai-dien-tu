import { Request, Response } from 'express';
import { prisma } from '../config/prisma';
import { v4 as uuidv4 } from 'uuid';
import { ragService } from '../services/rag.service';
import { llmOrchestrator, ChatMessageParam } from '../services/llm-orchestrator';
import { ToolMetadataPayload } from '../tools/catalog.tool';

/**
 * POST /api/ai/chat
 * Server-Sent Events (SSE) Streaming response
 * Supports streaming text chunks and metadata (Product Cards & Comparison Table)
 * Contract agreed with Khoa (Frontend - Bạn 2):
 * - event: session   -> {"session_id": "...", "session_token": "..."}
 * - event: message   -> {"type": "text_chunk", "content": "..."}
 * - event: message   -> {"type": "metadata", "payload": { "type": "product_cards" | "comparison_table", ... }}
 * - event: done      -> {"type": "done"}
 * - event: error     -> {"message": "..."}
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

    // 6. Stream LLM response & Execute Tools (search_products, get_product_details, compare_products)
    let capturedMetadata: ToolMetadataPayload | null = null;

    const orchestratorResult = await llmOrchestrator.streamResponse({
      messages: conversationHistory,
      contextChunks: ragChunks,
      onChunk: (textChunk: string) => {
        sendEvent('message', {
          type: 'text_chunk',
          content: textChunk,
        });
      },
      onMetadata: (metadata: ToolMetadataPayload) => {
        capturedMetadata = metadata;
        sendEvent('message', {
          type: 'metadata',
          payload: metadata,
        });
      },
    });

    const fullResponse = orchestratorResult.fullText;
    const finalMetadata = capturedMetadata || orchestratorResult.metadata || null;

    // 7. If metadata was generated but not sent yet, send it now
    if (finalMetadata && !capturedMetadata) {
      sendEvent('message', {
        type: 'metadata',
        payload: finalMetadata,
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
            metadata: finalMetadata ? (finalMetadata as any) : undefined,
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
 * Retrieve chat history for session restoration
 */
export const getSessionHistory = async (req: Request, res: Response) => {
  try {
    const { sessionToken } = req.params;

    if (!sessionToken) {
      res.status(400).json({ success: false, message: 'sessionToken is required' });
      return;
    }

    let session: any = null;
    let messages: any[] = [];

    try {
      session = await prisma.chatSession.findUnique({
        where: { sessionToken },
      });

      if (!session) {
        res.status(404).json({ success: false, message: 'Chat session not found' });
        return;
      }

      messages = await prisma.chatMessage.findMany({
        where: { sessionId: session.id },
        orderBy: { createdAt: 'asc' },
      });
    } catch (dbErr: any) {
      // In-memory fallback
      session = { id: uuidv4(), sessionToken, title: 'Phiên hội thoại mới' };
      messages = [];
    }

    res.status(200).json({
      success: true,
      data: {
        session,
        messages,
      },
    });
  } catch (error: any) {
    console.error('[Chat Controller] Get history error:', error);
    res.status(500).json({ success: false, message: error.message || 'Internal server error' });
  }
};

export const getChatHistory = getSessionHistory;
