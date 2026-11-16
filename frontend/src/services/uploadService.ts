import { apiClient } from '@/lib/api-client';

interface ApiEnvelope<T> {
  success: boolean;
  message: string;
  data: T;
}

export async function uploadImage(file: File): Promise<string> {
  const formData = new FormData();
  formData.append('image', file);

  const { data } = await apiClient.post<ApiEnvelope<{ url: string }>>('/catalog/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  return data.data.url;
}

export async function uploadImages(files: File[]): Promise<string[]> {
  const formData = new FormData();
  files.forEach(file => formData.append('images', file));

  const { data } = await apiClient.post<ApiEnvelope<{ urls: string[] }>>('/catalog/upload/multiple', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  return data.data.urls;
}
