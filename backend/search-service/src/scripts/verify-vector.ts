import { esClient } from "../config/elasticsearch";
import { env } from "../config/env";

async function verify() {
  console.log("🔍 Đang truy vấn 1 document bất kỳ trong Elasticsearch...");

  const res = await esClient.search({
    index: env.ELASTICSEARCH_INDEX,
    size: 1,
    query: {
      exists: { field: "image_vector" },
    },
  });

  if (res.hits.hits.length === 0) {
    console.error("❌ Không tìm thấy document nào có image_vector!");
    process.exit(1);
  }

  const hit = res.hits.hits[0];
  const source = hit._source as any;

  console.log("\n================ KẾT QUẢ XÁC MINH ================");
  console.log(`ID:           ${hit._id}`);
  console.log(`Tên sản phẩm: ${source.name}`);
  console.log(`Ảnh chính:    ${source.image_url}`);
  console.log(`Có image_vector: ${Array.isArray(source.image_vector)}`);
  console.log(`Số chiều (dims): ${source.image_vector?.length}`);
  console.log(`5 số đầu tiên:   ${JSON.stringify(source.image_vector?.slice(0, 5))}`);

  // Kiểm tra L2 Norm
  const norm = Math.sqrt(
    source.image_vector.reduce((sum: number, val: number) => sum + val * val, 0),
  );
  console.log(`L2 Norm:         ${norm.toFixed(4)} (chuẩn hóa = 1.0000)`);
  console.log("==================================================\n");

  await esClient.close();
}

verify().catch(console.error);
