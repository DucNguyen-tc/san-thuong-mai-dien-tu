import { apiClient } from "@/lib/api-client";
import type { Ticket, CreateTicketDto } from "../types/support";

export const supportService = {
  createTicket: async (data: CreateTicketDto): Promise<Ticket> => {
    const res = await apiClient.post("/support/tickets", data);
    return res.data.data;
  },

  getMyTickets: async (params?: { page?: number; limit?: number; status?: string }): Promise<{ items: Ticket[]; pagination: any }> => {
    const res = await apiClient.get("/support/tickets", { params });
    return res.data.data;
  },

  getTicketDetail: async (id: string): Promise<Ticket> => {
    const res = await apiClient.get(`/support/tickets/${id}`);
    return res.data.data;
  },

  addMessage: async (id: string, content: string, attachments: any[] = []): Promise<any> => {
    const res = await apiClient.post(`/support/tickets/${id}/messages`, { content, attachments });
    return res.data.data;
  }
};

export default supportService;
