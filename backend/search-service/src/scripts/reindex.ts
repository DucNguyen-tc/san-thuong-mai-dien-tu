import "dotenv/config";
import { Client as PgClient } from "pg";
import { esClient } from "../config/elasticsearch";
import { env } from "../config/env";
import { indexProduct } from "../services/indexer.service";

const BATCH_SIZE = 50; // Xử lý 50 sản phẩm mỗi lần để tối ưu bộ nhớ

async function reindex(): Promise<void> {
  const pgClient = new PgClient({
    connectionString:
      process.env.CATALOG_DB_URL ||
      "postgresql://admin:1234567@localhost:5432/catalog_db",
  });

  const startTime = Date.now();

  try {
    console.log("🔗 Đang kết nối PostgreSQL (catalog_db)...");
    await pgClient.connect();
    console.log("✅ Kết nối PostgreSQL thành công!");

    // Đếm tổng số sản phẩm
    const countResult = await pgClient.query(
      "SELECT COUNT(*) FROM products WHERE is_active = true",
    );
    const total = parseInt(countResult.rows[0].count, 10);
    console.log(`📦 Tổng số sản phẩm cần reindex: ${total}`);

    // Xóa index cũ và tạo lại (full reindex)
    const indexExists = await esClient.indices.exists({
      index: env.ELASTICSEARCH_INDEX,
    });
    if (indexExists) {
      console.log(`🗑️  Đang xóa index cũ '${env.ELASTICSEARCH_INDEX}'...`);
      await esClient.indices.delete({ index: env.ELASTICSEARCH_INDEX });
    }

    // Import và tạo lại index với mapping
    const { initElasticsearch } = await import("../elasticsearch/setup");
    await initElasticsearch();

    console.log(`\n🚀 BẮT ĐẦU REINDEX VÀ SINH IMAGE VECTOR (CLIP 512d)...`);

    // Lấy sản phẩm theo từng batch
    let offset = 0;
    let indexed = 0;

    while (offset < total) {
      const result = await pgClient.query(
        `
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
              'discount_percent', pr.discount_value
            )
          )) FILTER (WHERE pr.id IS NOT NULL AND pr.is_active = true), '[]') AS promotions
        FROM products p
        LEFT JOIN categories c ON c.id = p.category_id
        LEFT JOIN product_variants v ON v.product_id = p.id
        LEFT JOIN product_images pi ON pi.product_id = p.id AND pi.variant_id IS NULL
        LEFT JOIN promotion_items pitem ON pitem.product_id = p.id
        LEFT JOIN promotions pr ON pr.id = pitem.promotion_id
        WHERE p.is_active = true
        GROUP BY p.id, c.id
        ORDER BY p.created_at DESC
        LIMIT $1 OFFSET $2
      `,
        [BATCH_SIZE, offset],
      );

      for (const row of result.rows) {
        indexed++;
        process.stdout.write(
          `[${indexed}/${total}] 🔄 Đang xử lý: ${row.name.substring(0, 30)}... `,
        );
        await indexProduct(row);
      }

      console.log(`📊 Tiến độ: [${indexed}/${total}] (${Math.round((indexed / total) * 100)}%)`);
      offset += BATCH_SIZE;
    }

    // Xác minh kết quả trong Elasticsearch
    await esClient.indices.refresh({ index: env.ELASTICSEARCH_INDEX });
    const esCount = await esClient.count({ index: env.ELASTICSEARCH_INDEX });

    // Đếm số document có image_vector
    const vectorCount = await esClient.count({
      index: env.ELASTICSEARCH_INDEX,
      query: {
        exists: { field: "image_vector" },
      },
    });

    const elapsed = Math.round((Date.now() - startTime) / 1000);
    console.log(`\n========================================`);
    console.log(`✅ REINDEX HOÀN THÀNH TỐT ĐẸP (${elapsed} giây)!`);
    console.log(`   📦 PostgreSQL:       ${total} sản phẩm`);
    console.log(`   🔎 Elasticsearch:    ${esCount.count} documents`);
    console.log(`   🖼️  Có image_vector:  ${vectorCount.count}/${total} sản phẩm`);
    console.log(`========================================\n`);

    if (esCount.count !== total) {
      console.warn(`⚠️  Số lượng KHÔNG KHỚP! Kiểm tra lại log lỗi phía trên.`);
    } else {
      console.log(`🎉 Toàn bộ dữ liệu & vector hình ảnh đã được cập nhật hoàn hảo!`);
    }
  } finally {
    await pgClient.end();
    await esClient.close();
  }
}

reindex().catch((err) => {
  console.error("❌ Reindex thất bại:", err);
  process.exit(1);
});
