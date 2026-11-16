import { pipeline, env } from '@xenova/transformers';

// Tắt local model path check nếu không có sẵn, cho phép tải từ HuggingFace Hub
env.allowLocalModels = false;
env.useBrowserCache = false; 

// Biến lưu trữ pipeline để tái sử dụng (Singleton)
let extractorPipeline: any = null;

/**
 * Tính toán vector đặc trưng sử dụng mô hình Trí tuệ nhân tạo (Học sâu).
 * Mô hình: Xenova/paraphrase-multilingual-MiniLM-L12-v2 (hỗ trợ Tiếng Việt).
 * Đầu ra là một mảng 384 chiều (dimensions = 384).
 */
export async function generateFeatureVector(name: string, description: string, categoryName: string = ''): Promise<number[]> {
  // Lần đầu gọi sẽ mất thời gian tải model (~470MB)
  if (!extractorPipeline) {
    console.log('[AI] Đang khởi tạo mô hình Xenova/paraphrase-multilingual-MiniLM-L12-v2...');
    extractorPipeline = await pipeline('feature-extraction', 'Xenova/paraphrase-multilingual-MiniLM-L12-v2');
    console.log('[AI] Đã tải mô hình xong!');
  }

  // Kết hợp nội dung để sinh vector ngữ nghĩa
  const text = `${name}. ${categoryName}. ${description}`;
  
  // Chạy model lấy vector
  // pooling: 'mean' để lấy trung bình các token, normalize: true để chuẩn hóa L2 (tốt cho Cosine Similarity)
  const output = await extractorPipeline(text, { pooling: 'mean', normalize: true });
  
  // output.data là Float32Array chứa 384 phần tử
  return Array.from(output.data);
}
