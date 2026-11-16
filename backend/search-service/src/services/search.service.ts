import { esClient } from "../config/elasticsearch";
import { env } from "../config/env";
import {
  SearchParams,
  SearchResponse,
  SearchProductItem,
  SearchFacets,
} from "../types/search.types";

export class SearchService {
  /**
   * Tìm kiếm sản phẩm kết hợp Faceted Search (Aggregations + Post-filter)
   */
  static async searchProducts(params: SearchParams): Promise<SearchResponse> {
    const page = Math.max(1, Number(params.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(params.limit) || 12));
    const from = (page - 1) * limit;

    const mustClauses: any[] = [];
    const filterClauses: any[] = [
      { term: { is_active: true } }, // Luôn chỉ tìm sản phẩm active
    ];

    // 1. Full-text search & Fuzzy query (Query Core)
    const keyword = params.q?.trim();
    if (keyword) {
      mustClauses.push({
        multi_match: {
          query: keyword,
          fields: [
            "name^4",
            "name.folded^2.5",
            "category_name^1.5",
            "description^1",
          ],
          type: "best_fields",
          fuzziness: "AUTO",
          operator: "or",
          prefix_length: 2,
        },
      });
    } else {
      mustClauses.push({ match_all: {} });
    }

    // 2. Post-Filter Clauses (Áp dụng cho hits hiển thị mà không triệt tiêu các facet buckets khác)
    const postFilterClauses: any[] = [];

    // Lọc theo Danh mục
    if (params.category_id) {
      postFilterClauses.push({
        term: { category_id: params.category_id },
      });
    }

    // Lọc theo khoảng giá tùy chỉnh
    if (params.price_min !== undefined || params.price_max !== undefined) {
      const priceRange: any = {};
      if (params.price_min !== undefined) {
        priceRange.gte = Number(params.price_min);
      }
      if (params.price_max !== undefined) {
        priceRange.lte = Number(params.price_max);
      }
      postFilterClauses.push({ range: { price: priceRange } });
    }

    // Lọc theo màu sắc (hỗ trợ nhiều màu: mảng hoặc chuỗi phân cách dấu phẩy)
    if (params.color) {
      const colorList = Array.isArray(params.color)
        ? params.color
        : params.color.split(",").map((c) => c.trim()).filter(Boolean);
      if (colorList.length > 0) {
        postFilterClauses.push({
          terms: { "attributes.color": colorList },
        });
      }
    }

    // Lọc theo thương hiệu (hỗ trợ nhiều hãng)
    if (params.brand) {
      const brandList = Array.isArray(params.brand)
        ? params.brand
        : params.brand.split(",").map((b) => b.trim()).filter(Boolean);
      if (brandList.length > 0) {
        postFilterClauses.push({
          terms: { "attributes.brand": brandList },
        });
      }
    }

    // Lọc sản phẩm đang giảm giá
    if (params.has_discount !== undefined) {
      postFilterClauses.push({
        term: { has_discount: Boolean(params.has_discount) },
      });
    }

    // 3. Cấu hình Sắp xếp (Sort)
    const sortConfig: any[] = [];
    switch (params.sort) {
      case "price_asc":
        sortConfig.push({ price: { order: "asc" } });
        break;
      case "price_desc":
        sortConfig.push({ price: { order: "desc" } });
        break;
      case "newest":
        sortConfig.push({ created_at: { order: "desc" } });
        break;
      case "relevance":
      default:
        if (keyword) {
          sortConfig.push({ _score: { order: "desc" } });
        }
        sortConfig.push({ created_at: { order: "desc" } });
        break;
    }

    // 4. Định nghĩa Aggregations (Faceted Search)
    const aggsConfig: any = {
      categories: {
        terms: {
          field: "category_id",
          size: 50,
        },
        aggs: {
          category_name: {
            terms: {
              field: "category_name.raw",
              size: 1,
            },
          },
        },
      },
      price_ranges: {
        range: {
          field: "price",
          ranges: [
            { key: "Dưới 2 triệu", to: 2000000 },
            { key: "2 - 5 triệu", from: 2000000, to: 5000000 },
            { key: "5 - 15 triệu", from: 5000000, to: 15000000 },
            { key: "15 - 30 triệu", from: 15000000, to: 30000000 },
            { key: "Trên 30 triệu", from: 30000000 },
          ],
        },
      },
      price_stats: {
        stats: {
          field: "price",
        },
      },
      colors: {
        terms: {
          field: "attributes.color",
          size: 50,
        },
      },
      brands: {
        terms: {
          field: "attributes.brand",
          size: 50,
        },
      },
      discount_count: {
        filter: {
          term: { has_discount: true },
        },
      },
    };

    // 5. Gửi truy vấn đến Elasticsearch
    const searchBody: any = {
      index: env.ELASTICSEARCH_INDEX,
      from,
      size: limit,
      query: {
        bool: {
          must: mustClauses,
          filter: filterClauses,
        },
      },
      aggs: aggsConfig,
      sort: sortConfig,
    };

    // Áp dụng post_filter nếu có điều kiện lọc người dùng chọn
    if (postFilterClauses.length > 0) {
      searchBody.post_filter = {
        bool: {
          filter: postFilterClauses,
        },
      };
    }

    // Bật highlight khi tìm kiếm có keyword
    if (keyword) {
      searchBody.highlight = {
        pre_tags: ["<mark>"],
        post_tags: ["</mark>"],
        fields: {
          name: {},
          description: { fragment_size: 150, number_of_fragments: 1 },
        },
      };
    }

    const response = await esClient.search(searchBody);

    const total =
      typeof response.hits.total === "number"
        ? response.hits.total
        : response.hits.total?.value || 0;

    // 6. Chuẩn hóa kết quả sản phẩm (Items)
    const items: SearchProductItem[] = response.hits.hits.map((hit: any) => {
      const source = hit._source;
      return {
        id: source.id,
        name: source.name,
        slug: source.slug,
        description: source.description,
        category_name: source.category_name,
        category_slug: source.category_slug,
        price: source.price,
        original_price: source.original_price,
        has_discount: source.has_discount,
        discount_percent: source.discount_percent,
        image_url: source.image_url,
        stock_quantity: source.stock_quantity,
        score: hit._score,
        highlight: hit.highlight,
      };
    });

    // 7. Chuẩn hóa kết quả Facets
    const rawAggs: any = response.aggregations || {};

    const categories = (rawAggs.categories?.buckets || []).map((b: any) => ({
      id: String(b.key),
      name: b.category_name?.buckets?.[0]?.key || String(b.key),
      count: b.doc_count,
    }));

    const price_ranges = (rawAggs.price_ranges?.buckets || []).map((b: any) => ({
      key: b.key,
      from: b.from,
      to: b.to,
      count: b.doc_count,
    }));

    const price_stats = {
      min: rawAggs.price_stats?.min ?? 0,
      max: rawAggs.price_stats?.max ?? 0,
    };

    const colors = (rawAggs.colors?.buckets || []).map((b: any) => ({
      key: String(b.key),
      count: b.doc_count,
    }));

    const brands = (rawAggs.brands?.buckets || []).map((b: any) => ({
      key: String(b.key),
      count: b.doc_count,
    }));

    const discount_count = rawAggs.discount_count?.doc_count || 0;

    const facets: SearchFacets = {
      categories,
      price_ranges,
      price_stats,
      colors,
      brands,
      discount_count,
    };

    return {
      items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      facets,
    };
  }
}
