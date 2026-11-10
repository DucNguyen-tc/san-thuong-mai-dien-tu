export interface RagChunk {
  chunk_id?: string | number;
  document_title?: string;
  source_type?: string;
  content: string;
  score?: number;
}

export interface RagQueryResponse {
  success: boolean;
  query: string;
  total_chunks: number;
  chunks: RagChunk[];
}

export class RagClient {
  private static getBaseUrl(): string {
    return process.env.AI_SERVICE_URL || "http://localhost:3010";
  }

  /**
   * Gọi RAG API từ ai-service để tìm kiếm các đoạn chính sách liên quan
   * (Contract: POST /api/ai/rag/query)
   */
  static async queryPolicies(
    queryText: string,
    topK: number = 3,
    threshold: number = 0.65
  ): Promise<RagChunk[]> {
    const url = `${this.getBaseUrl()}/api/ai/rag/query`;

    try {
      console.log(`[RagClient] Gửi truy vấn RAG tới: ${url}`);
      console.log(`[RagClient] Query: "${queryText}" | top_k: ${topK} | threshold: ${threshold}`);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000); // 4s timeout

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          query: queryText,
          top_k: topK,
          threshold
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`ai-service phản hồi status code: ${response.status}`);
      }

      const data = (await response.json()) as RagQueryResponse;

      if (data.success && Array.isArray(data.chunks)) {
        console.log(`[RagClient] Nhận thành công ${data.chunks.length} chunks chính sách từ ai-service.`);
        return data.chunks;
      }

      return [];
    } catch (error: any) {
      console.warn(
        `[RagClient Cảnh báo] Không thể lấy chunk từ ai-service (${error?.name === "AbortError" ? "Timeout 4s" : error?.message || error}). Kích hoạt cơ chế Fallback.`
      );
      // Fallback chính sách mặc định nếu ai-service chưa online
      return this.getFallbackPolicies(queryText);
    }
  }

  /**
   * Fallback chunks chính sách cốt lõi của sàn TMĐT
   * Giúp hệ thống không bị crash nếu ai-service chưa bật container
   */
  private static getFallbackPolicies(query: string): RagChunk[] {
    const lower = query.toLowerCase();

    if (lower.includes("hoàn tiền") || lower.includes("đổi trả") || lower.includes("trả hàng") || lower.includes("hủy đơn")) {
      return [
        {
          chunk_id: "fb-refund-01",
          document_title: "Chính sách Đổi trả & Hoàn tiền Sàn TMĐT",
          source_type: "fallback_policy",
          content:
            "Điều 3 (Hoàn tiền đơn trễ/hỏng): Khách hàng có quyền yêu cầu hủy đơn và hoàn tiền 100% nếu đơn hàng giao trễ quá 3 ngày làm việc so với ngày cam kết hoặc sản phẩm bị hư hỏng khi nhận. Tiền sẽ được hoàn về tài khoản trong vòng 3-5 ngày làm việc.",
          score: 0.8
        }
      ];
    }

    if (lower.includes("bảo hành") || lower.includes("lỗi") || lower.includes("hỏng")) {
      return [
        {
          chunk_id: "fb-warranty-01",
          document_title: "Chính sách Bảo hành Sản phẩm",
          source_type: "fallback_policy",
          content:
            "Điều 5 (Bảo hành lỗi kỹ thuật): Sản phẩm có lỗi từ nhà sản xuất được đổi mới 1-1 trong 15 ngày đầu, hoặc gửi trung tâm bảo hành chính hãng kiểm tra miễn phí trong thời hạn 12 tháng.",
          score: 0.75
        }
      ];
    }

    return [
      {
        chunk_id: "fb-general-01",
        document_title: "Quy chế Chăm sóc & Tiếp nhận Khiếu nại Khách hàng",
        source_type: "fallback_policy",
        content:
          "Bộ phận CSKH cam kết phản hồi và xử lý thỏa đáng mọi khiếu nại của khách hàng trong vòng 24-48 giờ làm việc kể từ thời điểm tiếp nhận thông tin.",
        score: 0.7
      }
    ];
  }
}

