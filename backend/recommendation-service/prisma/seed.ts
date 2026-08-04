import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Seed dữ liệu hành vi giả lập cho Collaborative Filtering.
 * 
 * Chiến lược:
 * - Lấy danh sách product_id từ bảng product_vectors (đã được catalog seed tạo ra)
 * - Nhóm sản phẩm theo nhóm logic (phones, gaming, office, mice, keyboards, audio)
 * - Tạo các bản ghi CLICK giả lập trong cùng nhóm để CF nhận biết nhóm sản phẩm liên quan
 * 
 * QUAN TRỌNG: Chạy script này SAU KHI đã chạy catalog seed VÀ recommendation service
 * đã xử lý xong các event product.created (vectors đã được tính toán).
 */
async function main() {
  console.log('Fetching product vectors from database...');
  
  const vectors: { product_id: string }[] = await prisma.$queryRawUnsafe(`
    SELECT product_id FROM product_vectors ORDER BY computed_at ASC;
  `);

  if (vectors.length === 0) {
    console.error('ERROR: Chua co product vectors nao. Hay chay catalog seed truoc va doi recommendation service xu ly xong.');
    process.exit(1);
  }

  console.log(`Found ${vectors.length} product vectors.`);

  const allIds = vectors.map(v => v.product_id);
  
  // Phân chia sản phẩm theo thứ tự seed (catalog seed lần lượt: phones, gaming, office, mice, keyboards, audio)
  // 15 phones + 10 gaming + 8 office + 8 mice + 8 keyboards + 8 audio = 57
  const phones = allIds.slice(0, Math.min(15, allIds.length));
  const gaming = allIds.slice(15, Math.min(25, allIds.length));
  const office = allIds.slice(25, Math.min(33, allIds.length));
  const mice = allIds.slice(33, Math.min(41, allIds.length));
  const keyboards = allIds.slice(41, Math.min(49, allIds.length));
  const audio = allIds.slice(49, Math.min(57, allIds.length));

  console.log(`Groups: phones=${phones.length}, gaming=${gaming.length}, office=${office.length}, mice=${mice.length}, keyboards=${keyboards.length}, audio=${audio.length}`);

  // Helper: tạo CLICK log giả lập
  const logs: Array<{
    source_product_id: string;
    recommended_product_id: string;
    event_type: 'CLICK' | 'IMPRESSION' | 'PURCHASE';
    similarity_score: number;
  }> = [];

  function addGroupInteractions(group: string[], clicksPerPair: number = 3) {
    for (let i = 0; i < group.length; i++) {
      for (let j = 0; j < group.length; j++) {
        if (i === j) continue;
        // Tạo nhiều click hơn cho các sản phẩm gần nhau trong list (càng gần = càng liên quan)
        const proximity = Math.max(1, clicksPerPair - Math.abs(i - j));
        for (let k = 0; k < proximity; k++) {
          logs.push({
            source_product_id: group[i],
            recommended_product_id: group[j],
            event_type: 'CLICK',
            similarity_score: 0.8 - Math.abs(i - j) * 0.05
          });
        }
      }
    }
  }

  function addCrossGroupInteractions(groupA: string[], groupB: string[], count: number = 1) {
    // Gaming laptop users cũng thường xem chuột gaming và bàn phím cơ
    for (let i = 0; i < Math.min(count, groupA.length); i++) {
      for (let j = 0; j < Math.min(count, groupB.length); j++) {
        logs.push({
          source_product_id: groupA[i],
          recommended_product_id: groupB[j],
          event_type: 'CLICK',
          similarity_score: 0.5
        });
      }
    }
  }

  // Tạo interaction trong từng nhóm
  if (phones.length >= 2) addGroupInteractions(phones, 4);
  if (gaming.length >= 2) addGroupInteractions(gaming, 4);
  if (office.length >= 2) addGroupInteractions(office, 3);
  if (mice.length >= 2) addGroupInteractions(mice, 4);
  if (keyboards.length >= 2) addGroupInteractions(keyboards, 4);
  if (audio.length >= 2) addGroupInteractions(audio, 3);

  // Cross-group interactions: Gaming laptop <-> Chuột gaming <-> Bàn phím cơ
  if (gaming.length > 0 && mice.length > 0) addCrossGroupInteractions(gaming, mice, 3);
  if (gaming.length > 0 && keyboards.length > 0) addCrossGroupInteractions(gaming, keyboards, 3);
  if (mice.length > 0 && keyboards.length > 0) addCrossGroupInteractions(mice, keyboards, 3);

  // Thêm IMPRESSION và PURCHASE cho một số cặp để phong phú data
  for (let i = 0; i < Math.min(5, phones.length - 1); i++) {
    logs.push({ source_product_id: phones[i], recommended_product_id: phones[i + 1], event_type: 'IMPRESSION', similarity_score: 0.9 });
    logs.push({ source_product_id: phones[i], recommended_product_id: phones[i + 1], event_type: 'PURCHASE', similarity_score: 0.9 });
  }
  for (let i = 0; i < Math.min(3, gaming.length - 1); i++) {
    logs.push({ source_product_id: gaming[i], recommended_product_id: gaming[i + 1], event_type: 'PURCHASE', similarity_score: 0.85 });
  }

  console.log(`Preparing to insert ${logs.length} behavior log records...`);

  // Xóa log cũ (nếu có) và insert mới
  await prisma.recommendationLog.deleteMany();
  
  // Batch insert
  const BATCH_SIZE = 100;
  for (let i = 0; i < logs.length; i += BATCH_SIZE) {
    const batch = logs.slice(i, i + BATCH_SIZE);
    await prisma.recommendationLog.createMany({ data: batch });
    console.log(`  Inserted batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(logs.length / BATCH_SIZE)}`);
  }

  const total = await prisma.recommendationLog.count();
  console.log(`\nRecommendation seed completed! Total behavior logs: ${total}`);
  console.log('Collaborative Filtering se hoat dong tot voi du lieu nay.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
