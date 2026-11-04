import { prisma } from '../config/prisma';
import { embeddingService } from './embedding.service';

export interface RagChunkResult {
  chunk_id: number;
  document_id: string;
  document_title: string;
  source_type: string;
  content: string;
  score: number;
}

const STATIC_POLICIES: RagChunkResult[] = [
  {
    chunk_id: 1,
    document_id: 'doc-policy-refund',
    document_title: 'Chính sách đổi trả hàng',
    source_type: 'POLICY',
    content: 'Điều 3: Trường hợp lỗi từ sàn hoặc người bán: Đối với sản phẩm bị lỗi do nhà sản xuất, bể vỡ trong quá trình vận chuyển hoặc giao sai mẫu mã, khách hàng được miễn phí 100% cước phí đổi trả hai chiều. Đơn hàng giao trễ quá 3 ngày so với cam kết, khách hàng được quyền yêu cầu hủy đơn và hoàn tiền 100%. Thời gian hoàn tiền: 3-5 ngày làm việc qua phương thức thanh toán ban đầu (VNPay, MoMo, ngân hàng).',
    score: 0.92,
  },
  {
    chunk_id: 2,
    document_id: 'doc-policy-warranty',
    document_title: 'Chính sách bảo hành sản phẩm',
    source_type: 'WARRANTY',
    content: 'Điều 1: Thời hạn bảo hành: Mọi sản phẩm điện tử, phụ kiện công nghệ được bảo hành chính hãng từ 12 đến 24 tháng theo đúng tiêu chuẩn của nhà sản xuất. Điều kiện: tem bảo hành còn nguyên, có hóa đơn điện tử mua hàng tại sàn.',
    score: 0.88,
  },
  {
    chunk_id: 3,
    document_id: 'doc-policy-shipping',
    document_title: 'Chi phí và thời gian vận chuyển',
    source_type: 'SHIPPING',
    content: 'Điều 1: Nội thành Hà Nội và TP.HCM: 1-2 ngày, phí tiêu chuẩn 20.000đ. Ngoại thành và các tỉnh khác: 2-4 ngày, phí 35.000đ. Đơn hàng từ 500.000đ trở lên được miễn phí vận chuyển toàn quốc (Freeship).',
    score: 0.85,
  },
  {
    chunk_id: 4,
    document_id: 'doc-policy-cancel',
    document_title: 'Hướng dẫn hủy đơn & Hoàn tiền',
    source_type: 'FAQ',
    content: 'Điều 1: Khách hàng có thể tự hủy đơn hàng trực tiếp trên hệ thống khi đơn đang ở trạng thái CHỜ XÁC NHẬN (PENDING) hoặc ĐANG XỬ LÝ (PROCESSING). Khi đơn đã chuyển sang ĐANG GIAO HÀNG (SHIPPING), khách hàng vui lòng từ chối nhận hàng hoặc liên hệ CSKH.',
    score: 0.87,
  },
  {
    chunk_id: 5,
    document_id: 'doc-policy-payment',
    document_title: 'Hướng dẫn thanh toán & Xử lý sự cố',
    source_type: 'FAQ',
    content: 'Điều 1: Hỗ trợ thanh toán qua VNPay, MoMo, Visa/Mastercard và COD. Nếu tài khoản đã trừ tiền mà đơn chưa cập nhật, hệ thống tự động đối soát hoàn tiền trong 24 giờ.',
    score: 0.82,
  },
];

export class RagService {
  /**
   * Phân tách văn bản thành các đoạn (chunks) 200-500 từ, chồng lấn 50 từ (overlap).
   * Ưu tiên ngắt tại dấu chấm câu kết thúc.
   */
  splitIntoChunks(text: string, maxWords = 350, overlapWords = 50): string[] {
    const sentences = text
      .split(/(?<=[.?!;:\n])\s+/)
      .map((s) => s.trim())
      .filter(Boolean);

    const chunks: string[] = [];
    let currentChunkWords: string[] = [];

    for (const sentence of sentences) {
      const sentenceWords = sentence.split(/\s+/).filter(Boolean);

      if (currentChunkWords.length + sentenceWords.length > maxWords && currentChunkWords.length > 0) {
        chunks.push(currentChunkWords.join(' '));
        const overlap = currentChunkWords.slice(-overlapWords);
        currentChunkWords = [...overlap, ...sentenceWords];
      } else {
        currentChunkWords.push(...sentenceWords);
      }
    }

    if (currentChunkWords.length > 0) {
      chunks.push(currentChunkWords.join(' '));
    }

    return chunks;
  }

  /**
   * Nạp tài liệu vào Knowledge Base (Lưu document + chunks + embedding vector)
   */
  async ingestDocument(title: string, sourceType: string, originalContent: string) {
    const doc = await prisma.knowledgeDocument.create({
      data: {
        title,
        sourceType,
        originalContent,
        isActive: true,
      },
    });

    const textChunks = this.splitIntoChunks(originalContent);
    console.log(`[RAG Ingestion] Document "${title}" chia thành ${textChunks.length} chunks.`);

    for (let i = 0; i < textChunks.length; i++) {
      const chunkText = textChunks[i];
      const vector = await embeddingService.generateEmbedding(chunkText);
      const vectorString = `[${vector.join(',')}]`;

      await prisma.$executeRawUnsafe(
        `INSERT INTO document_chunks (document_id, chunk_index, content, embedding, created_at)
         VALUES ($1::uuid, $2, $3, $4::vector, NOW())`,
        doc.id,
        i + 1,
        chunkText,
        vectorString
      );
    }

    return doc;
  }

  /**
   * Truy vấn tìm kiếm ngữ nghĩa các chunk chính sách liên quan nhất
   * Phục vụ endpoint POST /api/ai/rag/query
   */
  async queryKnowledgeBase(query: string, topK = 3, threshold = 0.65): Promise<RagChunkResult[]> {
    try {
      // 1. Sinh vector embedding cho câu hỏi
      const queryVector = await embeddingService.generateEmbedding(query);
      const vectorString = `[${queryVector.join(',')}]`;

      // 2. Truy vấn Cosine Similarity trên pgvector
      const rawResults: any[] = await prisma.$queryRawUnsafe(
        `SELECT 
            c.id AS chunk_id,
            c.document_id,
            d.title AS document_title,
            d.source_type,
            c.content,
            1 - (c.embedding <=> $1::vector) AS score
         FROM document_chunks c
         JOIN knowledge_documents d ON c.document_id = d.id
         WHERE d.is_active = true
         ORDER BY c.embedding <=> $1::vector ASC
         LIMIT $2`,
        vectorString,
        topK
      );

      // 3. Lọc theo ngưỡng tin cậy (threshold)
      const filtered = rawResults
        .filter((r) => Number(r.score) >= threshold)
        .map((r) => ({
          chunk_id: Number(r.chunk_id),
          document_id: r.document_id,
          document_title: r.document_title,
          source_type: r.source_type,
          content: r.content,
          score: Math.round(Number(r.score) * 100) / 100,
        }));

      return filtered;
    } catch (err: any) {
      // Fallback tìm kiếm theo từ khóa nếu DB chưa cài pgvector hoặc offline
      return this.fallbackKeywordSearch(query, topK);
    }
  }

  /**
   * Fallback tìm kiếm từ khóa khi pgvector chưa kích hoạt hoặc DB offline
   */
  private async fallbackKeywordSearch(query: string, topK = 3): Promise<RagChunkResult[]> {
    const keywords = query
      .toLowerCase()
      .split(/\s+/)
      .filter((w) => w.length > 2);

    try {
      const allChunks = await prisma.documentChunk.findMany({
        where: {
          document: { isActive: true },
        },
        include: {
          document: true,
        },
        take: 20,
      });

      const scored = allChunks.map((c) => {
        let hits = 0;
        const lower = c.content.toLowerCase();
        keywords.forEach((k) => {
          if (lower.includes(k)) hits++;
        });
        const score = keywords.length > 0 ? Math.min(0.95, hits / keywords.length) : 0.5;
        return {
          chunk_id: Number(c.id),
          document_id: c.documentId,
          document_title: c.document.title,
          source_type: c.document.sourceType,
          content: c.content,
          score: Math.round(score * 100) / 100,
        };
      });

      scored.sort((a, b) => b.score - a.score);
      return scored.slice(0, topK);
    } catch {
      // In-memory fallback policies when database is not running
      const scored = STATIC_POLICIES.map((c) => {
        let hits = 0;
        const lower = (c.document_title + ' ' + c.content).toLowerCase();
        keywords.forEach((k) => {
          if (lower.includes(k)) hits++;
        });
        const calculatedScore = keywords.length > 0 ? Math.min(0.95, 0.4 + (hits / keywords.length) * 0.55) : 0.6;
        return {
          ...c,
          score: Math.round(calculatedScore * 100) / 100,
        };
      });

      scored.sort((a, b) => b.score - a.score);
      return scored.slice(0, topK);
    }
  }
}

export const ragService = new RagService();
