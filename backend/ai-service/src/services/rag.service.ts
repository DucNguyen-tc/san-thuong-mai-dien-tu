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

export const STATIC_POLICIES: RagChunkResult[] = [
  {
    chunk_id: 1,
    document_id: 'doc-policy-refund',
    document_title: 'Chính sách đổi trả & hoàn tiền',
    source_type: 'POLICY',
    content: `Điều 1: Thời hạn đổi trả: Khách hàng được quyền yêu cầu đổi trả sản phẩm trong vòng 07 ngày kể từ ngày nhận hàng thành công theo ghi nhận của đơn vị vận chuyển.
Điều 2: Điều kiện đổi trả: Sản phẩm phải còn nguyên vẹn tem mác, hộp đóng gói ban đầu, chưa qua sử dụng, có đầy đủ phụ kiện và hóa đơn mua hàng trên sàn.
Điều 3: Trường hợp lỗi từ sàn hoặc người bán: Đối với sản phẩm bị lỗi do nhà sản xuất, bể vỡ trong quá trình vận chuyển hoặc giao sai mẫu mã, chủng loại, số lượng, khách hàng được miễn phí 100% cước phí đổi trả hai chiều. Nếu đơn hàng giao trễ quá 3 ngày so với cam kết ban đầu, khách hàng có toàn quyền yêu cầu hủy đơn và được hoàn tiền 100% giá trị đơn hàng.
Điều 4: Quy trình và thời gian hoàn tiền: Sau khi kho nhận lại và kiểm tra hàng hoàn thành công (trong vòng 24 đến 48 giờ), tiền sẽ được hoàn qua ví điện tử VNPay/MoMo trong 1-3 ngày làm việc hoặc qua thẻ ngân hàng trong 3-5 ngày làm việc.`,
    score: 0.95,
  },
  {
    chunk_id: 2,
    document_id: 'doc-policy-warranty',
    document_title: 'Chính sách bảo hành sản phẩm',
    source_type: 'WARRANTY',
    content: `Điều 1: Thời hạn bảo hành: Mọi sản phẩm điện thoại, máy tính, thiết bị điện tử gia dụng được bảo hành chính hãng từ 12 đến 24 tháng theo đúng tiêu chuẩn công bố của từng thương hiệu.
Điều 2: Điều kiện bảo hành hợp lệ: Sản phẩm phải còn nguyên tem bảo hành của nhà phân phối, số Serial hoặc IMEI trùng khớp với hóa đơn điện tử được lưu trong hệ thống đơn hàng của sàn. Sản phẩm không bị rơi vỡ, cấn móp, ngấm nước hoặc có dấu hiệu can thiệp, tự ý tháo lắp sửa chữa bởi bên thứ ba không được ủy quyền.
Điều 3: Địa điểm và quy trình tiếp nhận: Khách hàng có thể mang sản phẩm trực tiếp đến các Trung tâm Bảo hành ủy quyền tại Hà Nội và TP.HCM hoặc gửi bảo hành qua đường bưu điện. Sàn hỗ trợ miễn phí vận chuyển 2 chiều nếu phát sinh lỗi kỹ thuật của nhà sản xuất trong vòng 30 ngày đầu tiên kể từ ngày nhận hàng.`,
    score: 0.92,
  },
  {
    chunk_id: 3,
    document_id: 'doc-policy-shipping',
    document_title: 'Chi phí và thời gian vận chuyển',
    source_type: 'SHIPPING',
    content: `Điều 1: Khu vực nội thành (Hà Nội, TP.HCM): Thời gian giao hàng dự kiến từ 1 đến 2 ngày làm việc. Cước phí vận chuyển tiêu chuẩn là 20.000 VNĐ.
Điều 2: Khu vực ngoại thành và các tỉnh thành khác: Thời gian giao hàng dự kiến từ 2 đến 4 ngày làm việc. Cước phí vận chuyển tiêu chuẩn là 35.000 VNĐ.
Điều 3: Chính sách Miễn phí vận chuyển (Freeship): Đơn hàng có tổng giá trị thanh toán thực tế từ 500.000 VNĐ trở lên được miễn phí vận chuyển 100% trên phạm vi toàn quốc.`,
    score: 0.90,
  },
  {
    chunk_id: 4,
    document_id: 'doc-policy-cancel',
    document_title: 'Hướng dẫn hủy đơn hàng & hoàn tiền',
    source_type: 'FAQ',
    content: `Điều 1: Khách hàng có thể tự hủy đơn hàng trực tiếp trên hệ thống khi đơn đang ở trạng thái Chờ xác nhận (PENDING), Chờ thanh toán hoặc Đang chuẩn bị hàng tại trang Quản lý đơn hàng (đường dẫn /profile?tab=orders).
Điều 2: Để đảm bảo an toàn tài khoản và quyền lợi khách hàng, Chatbot không thực hiện thao tác hủy đơn trực tiếp.
Điều 3: Khi đơn đã chuyển sang trạng thái Đang giao hàng (SHIPPING), khách hàng vui lòng từ chối nhận hàng khi shipper giao hoặc liên hệ CSKH. Tiền sẽ được hoàn tự động trong 3-5 ngày làm việc sau khi đơn hủy được xác nhận.`,
    score: 0.88,
  },
  {
    chunk_id: 5,
    document_id: 'doc-policy-payment',
    document_title: 'Hướng dẫn thanh toán & bảo mật',
    source_type: 'FAQ',
    content: `Điều 1: Phương thức thanh toán hỗ trợ: Ví điện tử (VNPay, MoMo), Thẻ quốc tế Visa/Mastercard/JCB, Thẻ ATM nội địa (Internet Banking) và Thanh toán khi nhận hàng (COD).
Điều 2: An toàn bảo mật: Toàn bộ thông tin thanh toán trực tuyến được mã hóa theo tiêu chuẩn quốc tế PCI-DSS.
Điều 3: Xử lý sự cố: Nếu tài khoản của quý khách đã bị trừ tiền nhưng đơn hàng chưa cập nhật thành công, hệ thống sẽ tự động đối soát và hoàn tiền trong vòng 24 giờ.`,
    score: 0.85,
  },
  {
    chunk_id: 6,
    document_id: 'doc-policy-rules',
    document_title: 'Quy chế hoạt động sàn TMĐT & giải quyết khiếu nại',
    source_type: 'POLICY',
    content: `Điều 1: Nguyên tắc hoạt động chung: Sàn Thương Mại Điện Tử V-Shop cam kết 100% sản phẩm chính hãng, xuất xứ rõ ràng. Sàn nghiêm cấm tuyệt đối các hành vi buôn bán vũ khí, hàng lậu, chất cấm, tiền giả theo quy định của pháp luật.
Điều 2: Quyền lợi người mua: Người mua được đảm bảo nhận hàng đúng mô tả, được kiểm tra hàng trước khi nhận, bảo vệ thanh toán an toàn và hỗ trợ đổi trả hàng theo quy định.
Điều 3: Cơ chế giải quyết khiếu nại: Khi có tranh chấp phát sinh giữa người mua và người bán, ban quản trị sàn sẽ đóng vai trò trọng tài trung gian tiếp nhận phản ánh qua hệ thống Ticket Hỗ trợ hoặc Hotline CSKH 1900-6868 trong vòng 48 giờ để giải quyết thấu đáo và bảo vệ quyền lợi chính đáng cho người tiêu dùng.`,
    score: 0.85,
  },
];

function removeVietnameseTones(str: string): string {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase();
}

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
   * Chia nhỏ văn bản, tạo vector embedding và lưu vào bảng document_chunks
   */
  private async insertChunksForDocument(documentId: string, title: string, originalContent: string): Promise<number> {
    const textChunks = this.splitIntoChunks(originalContent);
    console.log(`[RAG Ingestion] Document "${title}" chia thành ${textChunks.length} chunks.`);

    for (let i = 0; i < textChunks.length; i++) {
      const chunkText = textChunks[i];
      const vector = await embeddingService.generateEmbedding(chunkText);
      const vectorString = `[${vector.join(',')}]`;

      await prisma.$executeRawUnsafe(
        `INSERT INTO document_chunks (document_id, chunk_index, content, embedding, created_at)
         VALUES ($1::uuid, $2, $3, $4::vector, NOW())`,
        documentId,
        i + 1,
        chunkText,
        vectorString
      );
    }

    return textChunks.length;
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

    const chunkCount = await this.insertChunksForDocument(doc.id, title, originalContent);
    return { ...doc, chunkCount };
  }

  /**
   * Lấy danh sách toàn bộ tài liệu trong Knowledge Base kèm số lượng chunk
   */
  async listDocuments() {
    const docs = await prisma.knowledgeDocument.findMany({
      orderBy: { updatedAt: 'desc' },
      include: {
        _count: {
          select: { chunks: true },
        },
      },
    });

    return docs.map(({ _count, ...doc }) => ({
      ...doc,
      chunkCount: _count.chunks,
    }));
  }

  /**
   * Cập nhật tài liệu; tự động re-chunk & re-embed nếu nội dung thay đổi
   */
  async updateDocument(
    id: string,
    input: { title?: string; sourceType?: string; originalContent?: string; isActive?: boolean }
  ) {
    const existing = await prisma.knowledgeDocument.findUnique({ where: { id } });
    if (!existing) {
      const err: any = new Error('Không tìm thấy tài liệu chính sách');
      err.status = 404;
      throw err;
    }

    const updated = await prisma.knowledgeDocument.update({
      where: { id },
      data: {
        ...(input.title !== undefined ? { title: input.title } : {}),
        ...(input.sourceType !== undefined ? { sourceType: input.sourceType } : {}),
        ...(input.originalContent !== undefined ? { originalContent: input.originalContent } : {}),
        ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
      },
    });

    const contentChanged =
      input.originalContent !== undefined &&
      input.originalContent.trim() !== existing.originalContent.trim();

    if (contentChanged) {
      await prisma.documentChunk.deleteMany({ where: { documentId: id } });
      await this.insertChunksForDocument(id, updated.title, updated.originalContent);
    }

    const chunkCount = await prisma.documentChunk.count({ where: { documentId: id } });
    return { ...updated, chunkCount };
  }

  /**
   * Bật/tắt trạng thái kích hoạt của tài liệu
   */
  async toggleDocumentStatus(id: string) {
    const existing = await prisma.knowledgeDocument.findUnique({ where: { id } });
    if (!existing) {
      const err: any = new Error('Không tìm thấy tài liệu chính sách');
      err.status = 404;
      throw err;
    }

    const updated = await prisma.knowledgeDocument.update({
      where: { id },
      data: { isActive: !existing.isActive },
      include: {
        _count: { select: { chunks: true } },
      },
    });

    const { _count, ...doc } = updated;
    return { ...doc, chunkCount: _count.chunks };
  }

  /**
   * Xóa tài liệu (tự động xóa cascade các document_chunks)
   */
  async deleteDocument(id: string) {
    const existing = await prisma.knowledgeDocument.findUnique({ where: { id } });
    if (!existing) {
      const err: any = new Error('Không tìm thấy tài liệu chính sách');
      err.status = 404;
      throw err;
    }

    await prisma.knowledgeDocument.delete({ where: { id } });
  }

  /**
   * Truy vấn tìm kiếm ngữ nghĩa các chunk chính sách liên quan nhất
   * Phục vụ endpoint POST /api/ai/rag/query
   */
  async queryKnowledgeBase(query: string, topK = 3, threshold = 0.45): Promise<RagChunkResult[]> {
    const unaccentedQ = removeVietnameseTones(query);

    // Xác định các nhóm chính sách cốt lõi của sàn để luôn có thông tin đầy đủ nhất
    const staticMatches = STATIC_POLICIES.filter((p) => {
      if (unaccentedQ.includes('doi tra') || unaccentedQ.includes('tra hang') || unaccentedQ.includes('hoan tien')) {
        return p.document_id === 'doc-policy-refund';
      }
      if (unaccentedQ.includes('bao hanh')) {
        return p.document_id === 'doc-policy-warranty';
      }
      if (
        unaccentedQ.includes('van chuyen') ||
        unaccentedQ.includes('giao hang') ||
        unaccentedQ.includes('phi ship') ||
        unaccentedQ.includes('freeship')
      ) {
        return p.document_id === 'doc-policy-shipping';
      }
      if (unaccentedQ.includes('huy don')) {
        return p.document_id === 'doc-policy-cancel';
      }
      if (unaccentedQ.includes('thanh toan') || unaccentedQ.includes('vnpay') || unaccentedQ.includes('momo') || unaccentedQ.includes('cod')) {
        return p.document_id === 'doc-policy-payment';
      }
      if (unaccentedQ.includes('quy che') || unaccentedQ.includes('khieu nai') || unaccentedQ.includes('chinh sach')) {
        return p.document_id === 'doc-policy-rules' || p.document_id === 'doc-policy-refund';
      }
      return false;
    });

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
      const filtered: RagChunkResult[] = rawResults
        .filter((r) => Number(r.score) >= threshold)
        .map((r) => ({
          chunk_id: Number(r.chunk_id),
          document_id: r.document_id,
          document_title: r.document_title,
          source_type: r.source_type,
          content: r.content,
          score: Math.round(Number(r.score) * 100) / 100,
        }));

      // Nếu có staticMatches chính sách chuẩn, ưu tiên kết hợp để đảm bảo đầy đủ các điều khoản
      if (staticMatches.length > 0) {
        const combined = [...staticMatches, ...filtered];
        const unique = combined.filter((item, index, self) =>
          index === self.findIndex((t) => t.document_title === item.document_title || t.document_id === item.document_id)
        );
        return unique.slice(0, topK);
      }

      if (filtered.length === 0) {
        return this.fallbackKeywordSearch(query, topK);
      }
      return filtered;
    } catch (err: any) {
      if (staticMatches.length > 0) {
        return staticMatches.slice(0, topK);
      }
      // Fallback tìm kiếm theo từ khóa nếu DB chưa cài pgvector hoặc offline
      return this.fallbackKeywordSearch(query, topK);
    }
  }

  /**
   * Fallback tìm kiếm từ khóa khi pgvector chưa kích hoạt hoặc DB offline
   */
  private async fallbackKeywordSearch(query: string, topK = 3): Promise<RagChunkResult[]> {
    const unaccentedQ = removeVietnameseTones(query);
    const keywords = unaccentedQ
      .split(/\s+/)
      .filter((w) => w.length > 2);

    if (keywords.length === 0) {
      return STATIC_POLICIES.slice(0, topK);
    }

    let chunks: any[] = [];
    try {
      const dbChunks = await prisma.documentChunk.findMany({
        where: {
          document: { isActive: true },
        },
        include: {
          document: true,
        },
        take: 20,
      });

      if (dbChunks && dbChunks.length > 0) {
        chunks = dbChunks.map((c) => ({
          chunk_id: Number(c.id),
          document_id: c.documentId,
          document_title: c.document.title,
          source_type: c.document.sourceType,
          content: c.content,
        }));
      }
    } catch {}

    // Luôn bổ sung STATIC_POLICIES để đảm bảo có đầy đủ chính sách của sàn
    chunks = [...STATIC_POLICIES, ...chunks];

    const scored = chunks
      .map((c) => {
        let hits = 0;
        const normalized = removeVietnameseTones((c.document_title || '') + ' ' + (c.content || ''));
        keywords.forEach((k) => {
          if (normalized.includes(k)) hits++;
        });
        const calculatedScore = hits > 0 ? Math.min(0.98, 0.45 + (hits / keywords.length) * 0.53) : 0;
        return {
          ...c,
          score: Math.round(calculatedScore * 100) / 100,
        };
      })
      .filter((c) => c.score >= 0.45);

    // Loại bỏ trùng lặp tiêu đề
    const unique = scored.filter((item, index, self) =>
      index === self.findIndex((t) => t.document_title === item.document_title)
    );

    unique.sort((a, b) => b.score - a.score);
    return unique.slice(0, topK);
  }
}

export const ragService = new RagService();
