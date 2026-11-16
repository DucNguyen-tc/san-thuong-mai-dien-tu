import { Request, Response } from 'express';
import { ragService } from '../services/rag.service';

/**
 * POST /api/ai/rag/query
 * Query knowledge base for relevant policy chunks using semantic search (pgvector)
 * Contract with Support Service (Bạn 3 - ticket.md Section 10.2)
 */
export const queryRag = async (req: Request, res: Response) => {
  try {
    const { query, top_k = 3, threshold = 0.65 } = req.body;

    if (!query || typeof query !== 'string' || !query.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Query is required and must be a non-empty string',
      });
    }

    const chunks = await ragService.queryKnowledgeBase(
      query.trim(),
      Number(top_k) || 3,
      Number(threshold) || 0.65
    );

    return res.status(200).json({
      success: true,
      query: query.trim(),
      total_chunks: chunks.length,
      chunks: chunks.map((c) => ({
        chunk_id: c.chunk_id,
        document_title: c.document_title,
        source_type: c.source_type,
        content: c.content,
        score: c.score,
      })),
    });
  } catch (error: any) {
    console.error('[RAG Controller] Query error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error while querying RAG',
      error: error.message,
    });
  }
};
