import { Request, Response } from 'express';
import { z } from 'zod';
import { ragService } from '../services/rag.service';

const ALLOWED_SOURCE_TYPES = ['POLICY', 'FAQ', 'SHIPPING', 'WARRANTY'] as const;

const createDocSchema = z.object({
  title: z.string().trim().min(3, 'Tiêu đề phải có ít nhất 3 ký tự').max(500),
  sourceType: z.enum(ALLOWED_SOURCE_TYPES, {
    message: 'Loại tài liệu phải là POLICY, FAQ, SHIPPING hoặc WARRANTY',
  }),
  originalContent: z.string().trim().min(10, 'Nội dung chính sách phải có ít nhất 10 ký tự'),
});

const updateDocSchema = z.object({
  title: z.string().trim().min(3, 'Tiêu đề phải có ít nhất 3 ký tự').max(500).optional(),
  sourceType: z.enum(ALLOWED_SOURCE_TYPES).optional(),
  originalContent: z.string().trim().min(10, 'Nội dung chính sách phải có ít nhất 10 ký tự').optional(),
  isActive: z.boolean().optional(),
});

/**
 * POST /api/ai/rag/query
 * Query knowledge base for relevant policy chunks using semantic search (pgvector)
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

/**
 * GET /api/ai/rag/documents
 */
export const listDocuments = async (_req: Request, res: Response) => {
  try {
    const docs = await ragService.listDocuments();
    return res.status(200).json({
      success: true,
      message: 'Lấy danh sách tài liệu tri thức AI thành công',
      data: docs,
    });
  } catch (error: any) {
    console.error('[RAG Controller] List documents error:', error);
    return res.status(500).json({
      success: false,
      message: 'Không thể tải danh sách tài liệu RAG',
      error: error.message,
    });
  }
};

/**
 * POST /api/ai/rag/documents
 */
export const createDocument = async (req: Request, res: Response) => {
  try {
    const parsed = createDocSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        message: parsed.error.issues[0]?.message || 'Dữ liệu không hợp lệ',
      });
    }

    const { title, sourceType, originalContent } = parsed.data;
    const doc = await ragService.ingestDocument(title, sourceType, originalContent);

    return res.status(201).json({
      success: true,
      message: 'Đã thêm chính sách và huấn luyện vector RAG thành công',
      data: doc,
    });
  } catch (error: any) {
    console.error('[RAG Controller] Create document error:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi tạo tài liệu tri thức AI',
      error: error.message,
    });
  }
};

/**
 * PUT /api/ai/rag/documents/:id
 */
export const updateDocument = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const parsed = updateDocSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        message: parsed.error.issues[0]?.message || 'Dữ liệu cập nhật không hợp lệ',
      });
    }

    const doc = await ragService.updateDocument(id, parsed.data);
    return res.status(200).json({
      success: true,
      message: 'Đã cập nhật chính sách và đồng bộ lại vector RAG',
      data: doc,
    });
  } catch (error: any) {
    console.error('[RAG Controller] Update document error:', error);
    return res.status(error.status || 500).json({
      success: false,
      message: error.message || 'Lỗi khi cập nhật tài liệu RAG',
    });
  }
};

/**
 * PATCH /api/ai/rag/documents/:id/toggle
 */
export const toggleDocument = async (req: Request, res: Response) => {
  try {
    const doc = await ragService.toggleDocumentStatus(req.params.id);
    return res.status(200).json({
      success: true,
      message: doc.isActive ? 'Đã kích hoạt chính sách' : 'Đã tạm tắt chính sách',
      data: doc,
    });
  } catch (error: any) {
    console.error('[RAG Controller] Toggle document error:', error);
    return res.status(error.status || 500).json({
      success: false,
      message: error.message || 'Lỗi khi thay đổi trạng thái tài liệu RAG',
    });
  }
};

/**
 * DELETE /api/ai/rag/documents/:id
 */
export const deleteDocument = async (req: Request, res: Response) => {
  try {
    await ragService.deleteDocument(req.params.id);
    return res.status(200).json({
      success: true,
      message: 'Đã xóa tài liệu khỏi kho tri thức AI',
    });
  } catch (error: any) {
    console.error('[RAG Controller] Delete document error:', error);
    return res.status(error.status || 500).json({
      success: false,
      message: error.message || 'Lỗi khi xóa tài liệu RAG',
    });
  }
};
