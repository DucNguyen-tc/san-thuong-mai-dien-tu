/**
 * Service sinh vector ngữ nghĩa cho Hình ảnh sử dụng mô hình CLIP (ViT-B/32).
 * Chạy cục bộ bằng @xenova/transformers (ONNX Runtime).
 */

let extractorPromise: Promise<any> | null = null;

/**
 * Singleton Loader: Chỉ khởi tạo và nạp trọng số mô hình CLIP vào RAM 1 lần duy nhất.
 */
async function getExtractor(): Promise<any> {
  if (!extractorPromise) {
    extractorPromise = (async () => {
      const { pipeline } = await (Function('return import("@xenova/transformers")')());
      console.log("[EmbeddingService] 🔄 Đang nạp mô hình CLIP (Xenova/clip-vit-base-patch32)...");
      const extractor = await pipeline("image-feature-extraction", "Xenova/clip-vit-base-patch32", {
        quantized: true, // Tiết kiệm RAM và tăng tốc độ xử lý CPU
      });
      console.log("[EmbeddingService] ✅ Mô hình CLIP đã sẵn sàng!");
      return extractor;
    })();
  }
  return extractorPromise;
}

/**
 * Chuẩn hóa vector theo chuẩn L2 (Euclidean Norm) để tối ưu cho Cosine Similarity trong Elasticsearch.
 */
export function normalizeVector(vector: number[]): number[] {
  const norm = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));
  if (norm === 0) return vector;
  return vector.map((val) => val / norm);
}

/**
 * Sinh vector 512 chiều từ URL ảnh hoặc Buffer (khi user upload file).
 * 
 * @param imageInput URL ảnh (string) hoặc Buffer nhị phân
 * @returns Mảng số thực 512 chiều đã L2-normalized, hoặc null nếu ảnh không đọc được
 */
export async function generateImageVector(
  imageInput: string | Buffer | Uint8Array,
): Promise<number[] | null> {
  if (!imageInput) return null;

  try {
    const { RawImage } = await (Function('return import("@xenova/transformers")')());
    const extractor = await getExtractor();

    let image: any;
    if (typeof imageInput === "string") {
      const trimmedUrl = imageInput.trim();
      if (!trimmedUrl) return null;
      image = await RawImage.read(trimmedUrl);
    } else {
      const blob = new Blob([imageInput as any]);
      image = await RawImage.fromBlob(blob);
    }

    const output = await extractor(image);
    const rawVector = Array.from(output.data as Float32Array);

    return normalizeVector(rawVector);
  } catch (error: any) {
    const target = typeof imageInput === "string" ? imageInput : "Binary Buffer";
    console.warn(`[EmbeddingService] ⚠️ Không thể sinh vector cho ảnh [${target}]: ${error?.message || error}`);
    return null;
  }
}
