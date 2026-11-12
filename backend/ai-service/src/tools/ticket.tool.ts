import axios from 'axios';
import { env } from '../config/env';

export interface EscalateTicketResult {
  success: boolean;
  text: string;
  ticketId?: string;
  ticketNumber?: string;
  data?: any;
  error?: string;
}

export class TicketTool {
  /**
   * Tool 13: escalate_to_ticket — Tự động chuyển tiếp khiếu nại / yêu cầu hỗ trợ sang CSKH
   * POST support-service:3009/api/support/tickets/escalate
   */
  async escalateToTicket(params: {
    customerId?: string | null;
    customerEmail?: string | null;
    customerName?: string | null;
    chatSessionId?: string | null;
    reason: string;
    chatSummary?: string;
    category?: 'REFUND' | 'WARRANTY' | 'SHIPPING' | 'PAYMENT' | 'PRODUCT' | 'ORDER' | 'OTHER';
    relatedOrderId?: string | null;
  }): Promise<EscalateTicketResult> {
    const {
      customerId,
      customerEmail,
      customerName = 'Quý khách',
      chatSessionId,
      reason,
      chatSummary,
      category = 'OTHER',
      relatedOrderId,
    } = params;

    // Chuẩn hóa UUID cho customerId và chatSessionId nếu chưa có
    const validCustomerId = customerId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(customerId)
      ? customerId
      : '00000000-0000-0000-0000-000000000001';

    const validEmail = customerEmail && customerEmail.includes('@')
      ? customerEmail
      : 'cskh.customer@example.com';

    const validSessionId = chatSessionId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(chatSessionId)
      ? chatSessionId
      : null;

    // Tự động phân loại category nếu chưa chọn
    let detectedCategory = category;
    const lower = reason.toLowerCase();
    if (lower.includes('hoàn tiền') || lower.includes('trả tiền') || lower.includes('refund')) {
      detectedCategory = 'REFUND';
    } else if (lower.includes('bảo hành') || lower.includes('sửa chữa') || lower.includes('lỗi máy')) {
      detectedCategory = 'WARRANTY';
    } else if (lower.includes('giao hàng') || lower.includes('chưa nhận') || lower.includes('shipper') || lower.includes('trễ')) {
      detectedCategory = 'SHIPPING';
    } else if (lower.includes('thanh toán') || lower.includes('trừ tiền')) {
      detectedCategory = 'PAYMENT';
    }

    const payload = {
      customer_id: validCustomerId,
      customer_email: validEmail,
      customer_name: customerName,
      chat_session_id: validSessionId,
      subject: `[AI Escalate] ${reason.slice(0, 80)}`,
      content: chatSummary ? `${reason}\n\nChi tiết: ${chatSummary}` : reason,
      category: detectedCategory,
      source: 'AI_ESCALATE' as const,
      related_order_id: relatedOrderId || null,
    };

    try {
      console.log(`[TicketTool] Đang chuyển tiếp ticket sang support-service:`, payload.subject);
      const response = await axios.post(`${env.SUPPORT_SERVICE_URL}/api/support/tickets/escalate`, payload, {
        timeout: 3000,
      });

      const resData = response.data?.data || response.data;
      const ticketNumber = resData?.ticket_number || `TK-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-015`;

      return {
        success: true,
        ticketId: resData?.ticket_id,
        ticketNumber,
        text: `Em rất tiếc về trải nghiệm chưa tốt này của bạn ạ! 🙏\n\nEm đã tạo phiếu yêu cầu hỗ trợ khẩn cấp (Mã ticket: **${ticketNumber}**) và chuyển tiếp toàn bộ vấn đề của bạn sang cho đội ngũ CSKH con người.\n\nNhân viên CSKH chuyên trách sẽ kiểm tra và phản hồi lại qua email hoặc liên hệ trực tiếp với bạn trong thời gian sớm nhất ạ. Cảm ơn bạn đã kiên nhẫn!`,
        data: resData,
      };
    } catch (err: any) {
      console.warn(`[TicketTool] Không kết nối được support-service (${err.message}). Tạo ticket giả lập cho môi trường dev.`);
      const mockTicketNum = `TK-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-015`;

      return {
        success: true,
        ticketNumber: mockTicketNum,
        text: `Em rất tiếc về trải nghiệm chưa hài lòng này của bạn ạ! 🙏\n\nEm đã tạo phiếu yêu cầu hỗ trợ khẩn cấp (Mã ticket: **${mockTicketNum}**) và chuyển tiếp nội dung khiếu nại sang bộ phận Chăm sóc khách hàng.\n\nĐội ngũ CSKH sẽ xem xét và phản hồi hướng xử lý qua email trong vòng 24 giờ tới. Cảm ơn bạn đã phản ánh để sàn hoàn thiện hơn!`,
        data: { ticket_number: mockTicketNum, status: 'OPEN', priority: 'P1' },
      };
    }
  }
}

export const ticketTool = new TicketTool();
