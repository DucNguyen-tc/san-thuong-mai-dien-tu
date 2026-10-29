import { esClient } from "../config/elasticsearch";
import { env } from "../config/env";
import { generateImageVector } from "./embedding.service";

export interface VisualSearchResultItem {
  id: string;
  name: string;
  slug: string;
  price: number;
  original_price: number;
  has_discount: boolean;
  discount_percent: number;
  image_url: string;
  images: string[];
  category_name: string;
  category_slug: string;
  attributes: Record<string, string[]>;
  similarity_score: number;
  similarity_percent: number;
}

export interface VisualSearchResponse {
  items: VisualSearchResultItem[];
  total: number;
  processing_time_ms: number;
}

export class VisualService {
  /**
   * Tìm kiếm sản phẩm tương tự bằng hình ảnh (kNN Vector Search).
   * 
   * @param imageInput Buffer nhị phân (từ upload file) hoặc URL ảnh (chuỗi)
   * @param limit Số lượng kết quả tối đa cần lấy (mặc định 12)
   */
  static async searchByImage(
    imageInput: Buffer | string,
    limit: number = 12,
  ): Promise<VisualSearchResponse> {
    const startTime = Date.now();
    const safeLimit = Math.min(Math.max(1, limit), 50);

    // 1. Sinh vector 512 chiều từ hình ảnh qua CLIP ViT-B/32
    const imageVector = await generateImageVector(imageInput);
    if (!imageVector || imageVector.length !== 512) {
      throw new Error(
        "Không thể trích xuất vector từ hình ảnh. Vui lòng kiểm tra lại file ảnh hoặc URL.",
      );
    }

    // 2. Thực hiện kNN Query trên Elasticsearch
    const esResponse = await esClient.search({
      index: env.ELASTICSEARCH_INDEX,
      size: safeLimit,
      knn: {
        field: "image_vector",
        query_vector: imageVector,
        k: safeLimit,
        num_candidates: Math.max(100, safeLimit * 5),
        filter: {
          term: { is_active: true },
        },
      },
      _source: [
        "id",
        "name",
        "slug",
        "price",
        "original_price",
        "has_discount",
        "discount_percent",
        "image_url",
        "images",
        "category_name",
        "category_slug",
        "attributes",
      ],
    });

    // 3. Chuẩn hóa kết quả và tính % độ tương đồng
    const items: VisualSearchResultItem[] = (esResponse.hits.hits || []).map(
      (hit: any) => {
        const source = hit._source || {};
        const score = typeof hit._score === "number" ? hit._score : 0;

        // Điểm cosine trong ES 8 dense_vector nằm trong khoảng [0, 1]
        const similarityScore = Number(score.toFixed(4));
        const similarityPercent = Math.min(
          100,
          Math.max(0, Math.round(score * 100)),
        );

        return {
          id: source.id,
          name: source.name,
          slug: source.slug,
          price: source.price || 0,
          original_price: source.original_price || source.price || 0,
          has_discount: Boolean(source.has_discount),
          discount_percent: source.discount_percent || 0,
          image_url: source.image_url || "",
          images: source.images || [],
          category_name: source.category_name || "",
          category_slug: source.category_slug || "",
          attributes: source.attributes || {},
          similarity_score: similarityScore,
          similarity_percent: similarityPercent,
        };
      },
    );

    const processingTimeMs = Date.now() - startTime;

    return {
      items,
      total: items.length,
      processing_time_ms: processingTimeMs,
    };
  }
}
