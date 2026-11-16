import { esClient } from "../config/elasticsearch";
import { env } from "../config/env";
import { SuggestResponse, SuggestKeyword } from "../types/search.types";

export class SuggestService {
  /**
   * Gợi ý từ khóa và top sản phẩm theo thời gian thực (Autocomplete)
   * Sử dụng kết hợp Completion Suggester và Edge N-gram match trên name.autocomplete
   */
  static async getSuggestions(query: string, limit: number = 5): Promise<SuggestResponse> {
    const trimmed = query.trim();
    if (!trimmed) {
      return { keywords: [], products: [] };
    }

    const maxItems = Math.min(10, Math.max(1, limit));

    // Truy vấn song song hoặc trong 1 search request
    const response = await esClient.search({
      index: env.ELASTICSEARCH_INDEX,
      size: maxItems,
      query: {
        bool: {
          must: [
            {
              multi_match: {
                query: trimmed,
                fields: [
                  "name.autocomplete^3", // Edge N-gram (gõ từ bất kỳ)
                  "name.folded^2",
                  "category_name^1.5",
                ],
                type: "best_fields",
                operator: "or",
              },
            },
          ],
          filter: [
            { term: { is_active: true } },
          ],
        },
      },
      highlight: {
        pre_tags: ["<em>"],
        post_tags: ["</em>"],
        fields: {
          name: {},
        },
      },
      // Lấy thêm suggest từ completion suggester nếu có
      suggest: {
        keyword_suggest: {
          prefix: trimmed,
          completion: {
            field: "suggest",
            size: maxItems,
            skip_duplicates: true,
            fuzzy: {
              fuzziness: "AUTO",
            },
          },
        },
      },
    });

    // 1. Trích xuất keywords gợi ý
    const keywordSet = new Set<string>();
    const keywords: SuggestKeyword[] = [];

    // Từ completion suggester
    const suggestResults = (response.suggest as any)?.keyword_suggest?.[0]?.options || [];
    for (const opt of suggestResults) {
      const text = opt.text;
      if (text && !keywordSet.has(text.toLowerCase())) {
        keywordSet.add(text.toLowerCase());
        keywords.push({
          text,
          score: opt._score ?? undefined,
        });
      }
    }

    // Nếu suggestResults ít, bổ sung thêm từ tên sản phẩm khớp qua edge_ngram
    for (const hit of response.hits.hits) {
      const source: any = hit._source;
      if (keywords.length >= maxItems) break;

      const name = source?.name;
      if (name && !keywordSet.has(name.toLowerCase())) {
        keywordSet.add(name.toLowerCase());
        const highlightText = hit.highlight?.name?.[0];
        keywords.push({
          text: name,
          highlight: highlightText,
          score: hit._score ?? undefined,
        });
      }
    }

    // 2. Trích xuất top sản phẩm (để hiển thị thẻ xem nhanh kèm ảnh & giá)
    const products = response.hits.hits.map((hit: any) => {
      const source = hit._source;
      return {
        id: source.id,
        name: source.name,
        slug: source.slug,
        image_url: source.image_url,
        price: source.price,
        discount_percent: source.discount_percent,
      };
    });

    return {
      keywords: keywords.slice(0, maxItems),
      products: products.slice(0, maxItems),
    };
  }
}
