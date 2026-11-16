export type TicketStatus =
  | "OPEN"
  | "ANALYZING"
  | "PENDING_REVIEW"
  | "RESPONDED"
  | "REOPENED"
  | "RESOLVED"
  | "CLOSED";

export type TicketPriority = "P1" | "P2" | "P3" | "P4";

export type TicketSentiment =
  | "ANGRY"
  | "FRUSTRATED"
  | "DISAPPOINTED"
  | "NEUTRAL";

export type TicketSource = "FORM" | "AI_ESCALATE";

export type SenderType = "CUSTOMER" | "STAFF" | "SYSTEM";

export type ReviewStatus = "PENDING" | "APPROVED" | "REJECTED";

export interface RagChunk {
  chunk_id?: number | string;
  document_title?: string;
  source_type?: string;
  content: string;
  score?: number;
}

export interface TicketMessage {
  id: string | number;
  ticket_id: string;
  sender_type: SenderType;
  sender_id?: string;
  content: string;
  attachments?: any;
  created_at: string;
}

export interface TicketResponse {
  id: string | number;
  ticket_id: string;
  ai_draft: string;
  rag_chunks_used?: RagChunk[] | any;
  ai_tone?: string;
  ai_confidence?: number;
  staff_id?: string;
  final_response?: string;
  staff_notes?: string;
  review_status: ReviewStatus;
  reviewed_at?: string;
  sent_at?: string;
  created_at: string;
}

export interface Ticket {
  id: string;
  ticket_number: string;
  customer_id: string;
  customer_email: string;
  customer_name?: string;
  subject: string;
  category?: string;
  related_order_id?: string;
  source: TicketSource;
  chat_session_id?: string;

  sentiment?: TicketSentiment | null;
  sentiment_score?: number | null;
  priority: TicketPriority;
  ai_category?: string | null;
  ai_summary?: string | null;

  status: TicketStatus;
  assigned_to?: string | null;
  resolved_at?: string | null;

  created_at: string;
  updated_at: string;

  messages?: TicketMessage[];
  responses?: TicketResponse[];
  _count?: {
    messages: number;
  };
}

export interface CreateTicketDto {
  subject: string;
  category: string;
  content: string;
  related_order_id?: string;
  attachments?: any[];
}

export interface AdminTicketQueryParams {
  page?: number;
  limit?: number;
  status?: TicketStatus;
  priority?: TicketPriority;
  sentiment?: TicketSentiment;
  category?: string;
  search?: string;
}

export interface AdminTicketsResponse {
  items: Ticket[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface AdminTicketStats {
  totalTickets: number;
  byStatus: Record<string, number>;
  byPriority: Record<string, number>;
  bySentiment: Record<string, number>;
  byReviewStatus: Record<string, number>;
}

export interface UpdateDraftDto {
  final_response: string;
  staff_notes?: string;
}

export interface RejectDraftDto {
  revision_instruction: string;
}

export interface ApproveAndSendDto {
  final_response?: string;
  staff_notes?: string;
}
