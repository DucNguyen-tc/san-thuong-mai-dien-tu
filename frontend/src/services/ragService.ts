import { apiClient } from '@/lib/api-client';

export type KnowledgeSourceType = 'POLICY' | 'FAQ' | 'SHIPPING' | 'WARRANTY';

export interface KnowledgeDocument {
  id: string;
  title: string;
  sourceType: KnowledgeSourceType;
  originalContent: string;
  isActive: boolean;
  chunkCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface UpsertKnowledgeInput {
  title: string;
  sourceType: KnowledgeSourceType;
  originalContent: string;
}

export interface RagQueryChunk {
  chunk_id: number;
  document_title: string;
  source_type: KnowledgeSourceType | string;
  content: string;
  score: number;
}

interface ApiEnvelope<T> {
  success: boolean;
  message: string;
  data: T;
}

export async function getKnowledgeDocuments(): Promise<KnowledgeDocument[]> {
  const { data } = await apiClient.get<ApiEnvelope<KnowledgeDocument[]>>('/ai/rag/documents');
  return data.data;
}

export async function createKnowledgeDocument(input: UpsertKnowledgeInput): Promise<KnowledgeDocument> {
  const { data } = await apiClient.post<ApiEnvelope<KnowledgeDocument>>('/ai/rag/documents', input);
  return data.data;
}

export async function updateKnowledgeDocument(
  id: string,
  input: Partial<UpsertKnowledgeInput> & { isActive?: boolean }
): Promise<KnowledgeDocument> {
  const { data } = await apiClient.put<ApiEnvelope<KnowledgeDocument>>(`/ai/rag/documents/${id}`, input);
  return data.data;
}

export async function toggleKnowledgeDocument(id: string): Promise<KnowledgeDocument> {
  const { data } = await apiClient.patch<ApiEnvelope<KnowledgeDocument>>(`/ai/rag/documents/${id}/toggle`);
  return data.data;
}

export async function deleteKnowledgeDocument(id: string): Promise<void> {
  await apiClient.delete(`/ai/rag/documents/${id}`);
}

export async function testRagQuery(
  query: string,
  top_k = 3,
  threshold = 0.55
): Promise<RagQueryChunk[]> {
  const { data } = await apiClient.post<{ success: boolean; chunks: RagQueryChunk[] }>('/ai/rag/query', {
    query,
    top_k,
    threshold,
  });
  return data.chunks || [];
}

