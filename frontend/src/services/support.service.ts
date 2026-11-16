import { apiClient } from "@/lib/api-client";
import type {
  Ticket,
  CreateTicketDto,
  TicketMessage,
  TicketResponse,
  AdminTicketQueryParams,
  AdminTicketsResponse,
  AdminTicketStats,
  UpdateDraftDto,
  RejectDraftDto,
  ApproveAndSendDto,
} from "../types/support";

export const supportService = {
  // ==========================================
  // CUSTOMER APIS
  // ==========================================
  createTicket: async (data: CreateTicketDto): Promise<Ticket> => {
    const res = await apiClient.post("/support/tickets", data);
    return res.data.data;
  },

  getMyTickets: async (params?: {
    page?: number;
    limit?: number;
    status?: string;
  }): Promise<{ items: Ticket[]; pagination: any }> => {
    const res = await apiClient.get("/support/tickets", { params });
    return res.data.data;
  },

  getTicketDetail: async (id: string): Promise<Ticket> => {
    const res = await apiClient.get(`/support/tickets/${id}`);
    return res.data.data;
  },

  addMessage: async (
    id: string,
    content: string,
    attachments: any[] = []
  ): Promise<TicketMessage> => {
    const res = await apiClient.post(`/support/tickets/${id}/messages`, {
      content,
      attachments,
    });
    return res.data.data;
  },

  // ==========================================
  // STAFF & ADMIN APIS
  // ==========================================
  getAdminStats: async (): Promise<AdminTicketStats> => {
    const res = await apiClient.get("/support/tickets/admin/stats");
    return res.data.data;
  },

  getAdminTickets: async (
    params?: AdminTicketQueryParams
  ): Promise<AdminTicketsResponse> => {
    const res = await apiClient.get("/support/tickets/admin/tickets", {
      params,
    });
    return res.data.data;
  },

  getAdminTicketDetail: async (id: string): Promise<Ticket> => {
    const res = await apiClient.get(`/support/tickets/admin/tickets/${id}`);
    return res.data.data;
  },

  updateDraft: async (
    id: string,
    data: UpdateDraftDto
  ): Promise<TicketResponse> => {
    const res = await apiClient.put(
      `/support/tickets/admin/tickets/${id}/draft`,
      data
    );
    return res.data.data;
  },

  rejectDraft: async (
    id: string,
    data: RejectDraftDto
  ): Promise<TicketResponse> => {
    const res = await apiClient.post(
      `/support/tickets/admin/tickets/${id}/reject-draft`,
      data
    );
    return res.data.data;
  },

  approveAndSend: async (
    id: string,
    data?: ApproveAndSendDto
  ): Promise<any> => {
    const res = await apiClient.post(
      `/support/tickets/admin/tickets/${id}/approve-and-send`,
      data || {}
    );
    return res.data.data;
  },

  regenerateDraft: async (id: string): Promise<TicketResponse> => {
    const res = await apiClient.post(`/support/tickets/${id}/draft/regenerate`);
    return res.data.data;
  },
};

export default supportService;
