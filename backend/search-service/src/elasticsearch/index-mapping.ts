import { IndicesCreateRequest } from "@elastic/elasticsearch/lib/api/types";
import { env } from "../config/env";

export const productIndexConfig: IndicesCreateRequest = {
  index: env.ELASTICSEARCH_INDEX,
  settings: {
    number_of_shards: 1,
    number_of_replicas: 0,
    analysis: {
      analyzer: {
        vietnamese_analyzer: {
          type: "custom",
          tokenizer: "icu_tokenizer",
          filter: ["icu_folding", "lowercase"],
        },
        autocomplete_analyzer: {
          type: "custom",
          tokenizer: "standard",
          filter: ["lowercase", "icu_folding", "edge_ngram_filter"],
        },
        autocomplete_search_analyzer: {
          type: "custom",
          tokenizer: "standard",
          filter: ["lowercase", "icu_folding"],
        },
      },
      // Autocomplete
      filter: {
        edge_ngram_filter: {
          type: "edge_ngram",
          min_gram: 1,
          max_gram: 20,
        },
      },
    },
  },
  mappings: {
    properties: {
      id: { type: "keyword" },
      name: {
        type: "text",
        analyzer: "vietnamese_analyzer",
        fields: {
          raw: { type: "keyword" },
          autocomplete: {
            type: "text",
            analyzer: "autocomplete_analyzer",
            search_analyzer: "autocomplete_search_analyzer",
          },
          folded: {
            type: "text",
            analyzer: "vietnamese_analyzer",
          },
        },
      },
      slug: { type: "keyword" },
      description: {
        type: "text",
        analyzer: "vietnamese_analyzer",
      },

      category_id: { type: "keyword" },
      category_name: {
        type: "text",
        analyzer: "vietnamese_analyzer",
        fields: {
          raw: { type: "keyword" },
        },
      },
      category_slug: { type: "keyword" },
      parent_category_id: { type: "keyword" },

      price: { type: "double" },
      original_price: { type: "double" },
      has_discount: { type: "boolean" },
      discount_percent: { type: "integer" },

      attributes: {
        type: "object",
        properties: {
          color: { type: "keyword" },
          size: { type: "keyword" },
          brand: { type: "keyword" },
        },
      },

      stock_quantity: { type: "integer" },
      is_active: { type: "boolean" },

      image_url: { type: "keyword", index: false },
      images: { type: "keyword", index: false },

      created_at: { type: "date" },
      updated_at: { type: "date" },

      // Vector 1536 chiều cho Hybrid Search (OpenAI text-embedding-3-small)
      text_vector: {
        type: "dense_vector",
        dims: 1536,
        index: true,
        similarity: "cosine",
      },

      // Vector 512 chiều cho Visual Search (CLIP ViT-B/32)
      image_vector: {
        type: "dense_vector",
        dims: 512,
        index: true,
        similarity: "cosine",
      },

      // Dành cho Autocomplete nhanh
      suggest: {
        type: "completion",
        analyzer: "vietnamese_analyzer",
      },
    },
  },
};
