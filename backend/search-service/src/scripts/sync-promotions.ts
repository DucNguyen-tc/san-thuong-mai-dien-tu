import "dotenv/config";
import { Client as PgClient } from "pg";
import { esClient } from "../config/elasticsearch";
import { env } from "../config/env";
import { indexProduct } from "../services/indexer.service";

async function syncPromotions(): Promise<void> {
  const pgClient = new PgClient({
    connectionString:
      process.env.CATALOG_DB_URL ||
      "postgresql://admin:1234567@localhost:5432/catalog_db",
  });

  try {
    console.log("🔗 Đang kết nối PostgreSQL (catalog_db)...");
    await pgClient.connect();
    console.log("✅ Kết nối PostgreSQL thành công!");

    // Lấy tất cả sản phẩm có khuyến mãi hoặc cập nhật lại
    const result = await pgClient.query(`
      SELECT
        p.id, p.name, p.slug, p.description, p.is_active,
        p.category_id, p.created_at, p.updated_at,
        json_build_object('id', c.id, 'name', c.name, 'slug', c.slug, 'parent_id', c.parent_id) AS category,
        COALESCE(json_agg(DISTINCT jsonb_build_object(
          'id', v.id, 'price', v.price, 'stock_quantity', v.stock_quantity,
          'is_active', v.is_active, 'attributes', v.attributes
        )) FILTER (WHERE v.id IS NOT NULL), '[]') AS variants,
        COALESCE(json_agg(DISTINCT jsonb_build_object(
          'id', pi.id, 'url', pi.url, 'is_primary', pi.is_primary
        )) FILTER (WHERE pi.id IS NOT NULL), '[]') AS images,
        COALESCE(json_agg(DISTINCT jsonb_build_object(
          'promotion', json_build_object(
            'is_active', pr.is_active,
            'valid_from', pr.valid_from,
            'valid_to', pr.valid_to,
            'discount_type', pr.discount_type,
            'discount_value', pr.discount_value,
            'discount_percent', pr.discount_value
          )
        )) FILTER (WHERE pr.id IS NOT NULL AND pr.is_active = true), '[]') AS promotions
      FROM products p
      LEFT JOIN categories c ON c.id = p.category_id
      LEFT JOIN product_variants v ON v.product_id = p.id
      LEFT JOIN product_images pi ON pi.product_id = p.id AND pi.variant_id IS NULL
      INNER JOIN promotion_items pitem ON pitem.product_id = p.id
      INNER JOIN promotions pr ON pr.id = pitem.promotion_id
      WHERE p.is_active = true AND pr.is_active = true
      GROUP BY p.id, c.id
      ORDER BY p.created_at DESC
    `);

    console.log(`📦 Tìm thấy ${result.rows.length} sản phẩm có khuyến mãi cần đồng bộ vào Elasticsearch...`);

    for (let i = 0; i < result.rows.length; i++) {
      const row = result.rows[i];
      console.log(`[${i + 1}/${result.rows.length}] 🔄 Đang sync: ${row.name}`);
      await indexProduct(row);
    }

    await esClient.indices.refresh({ index: env.ELASTICSEARCH_INDEX });
    console.log("✅ Đã đồng bộ toàn bộ sản phẩm khuyến mãi sang Elasticsearch thành công!");
  } catch (err) {
    console.error("❌ Lỗi đồng bộ khuyến mãi:", err);
  } finally {
    await pgClient.end();
  }
}

syncPromotions();

