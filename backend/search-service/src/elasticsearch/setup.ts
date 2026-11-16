import { esClient } from "../config/elasticsearch";
import { env } from "../config/env";
import { productIndexConfig } from "./index-mapping";

export async function initElasticsearch(): Promise<void> {
  try {
    const indexName = env.ELASTICSEARCH_INDEX;
    console.log(`Đang kiểm tra index '${indexName}'...`);

    const exists = await esClient.indices.exists({ index: indexName });

    if (exists) {
      console.log(`Index '${indexName}' đã tồn tại.`);
      return;
    }

    console.log(
      `Đang tạo index '${indexName}' với mapping tiếng Việt & Vector...`,
    );
    await esClient.indices.create(productIndexConfig);
    console.log(`Đã tạo index '${indexName}' thành công!`);
  } catch (error) {
    console.error("Lỗi khi khởi tạo index Elasticsearch:", error);
    throw error;
  }
}
