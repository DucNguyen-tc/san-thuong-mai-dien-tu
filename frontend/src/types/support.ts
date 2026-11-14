export interface TicketMessage {
  id: string | number;
  ticket_id: string;
  sender_type: "CUSTOMER" | "STAFF" | "SYSTEM";
  sender_id?: string;
  content: string;
  attachments?: any;
  created_at: string;
}

export interface TicketResponse {
  id: string | number;
  final_response?: string;
  ai_draft?: string;
  review_status: "PENDING" | "APPROVED" | "REJECTED";
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
  status: "OPEN" | "ANALYZING" | "PENDING_REVIEW" | "RESPONDED" | "REOPENED" | "RESOLVED" | "CLOSED";
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

