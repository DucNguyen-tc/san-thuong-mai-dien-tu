import { PrismaClient } from '@prisma/client';
import { embeddingService } from '../src/services/embedding.service';

const prisma = new PrismaClient();

const POLICIES = [
  {
    title: 'Chính sách đổi trả hàng',
    sourceType: 'POLICY',
    originalContent: `Điều 1: Thời hạn đổi trả: Khách hàng được quyền yêu cầu đổi trả sản phẩm trong vòng 07 ngày kể từ ngày nhận hàng thành công theo ghi nhận của đơn vị vận chuyển.
Điều 2: Điều kiện đổi trả: Sản phẩm phải còn nguyên vẹn tem mác, hộp đóng gói ban đầu, chưa qua sử dụng, giặt ủi và có đầy đủ phụ kiện, quà tặng kèm theo nếu có.
Điều 3: Trường hợp lỗi từ sàn hoặc người bán: Đối với sản phẩm bị lỗi do nhà sản xuất, bể vỡ trong quá trình vận chuyển hoặc giao sai mẫu mã, chủng loại, số lượng, khách hàng được miễn phí 100% cước phí đổi trả hai chiều. Đặc biệt, nếu đơn hàng giao trễ quá 3 ngày so với thời gian cam kết ban đầu, khách hàng có toàn quyền yêu cầu hủy đơn và được hoàn tiền 100% giá trị đơn hàng.
Điều 4: Quy trình và thời gian hoàn tiền: Sau khi nhận lại và kiểm tra hàng hoàn thành công trong vòng 24 đến 48 giờ, sàn sẽ tiến hành hoàn tiền cho khách qua phương thức thanh toán ban đầu (Ví VNPay, MoMo trong 1-3 ngày làm việc; Thẻ ngân hàng trong 3-5 ngày làm việc; với đơn COD hoàn tiền qua số tài khoản ngân hàng do khách hàng cung cấp).`,
  },
  {
    title: 'Chính sách bảo hành sản phẩm',
    sourceType: 'WARRANTY',
    originalContent: `Điều 1: Thời hạn bảo hành: Mọi sản phẩm điện thoại, máy tính, thiết bị điện tử gia dụng được bảo hành chính hãng từ 12 đến 24 tháng theo đúng tiêu chuẩn công bố của từng thương hiệu.
Điều 2: Điều kiện bảo hành hợp lệ: Sản phẩm phải còn nguyên tem bảo hành của nhà phân phối, số Serial hoặc IMEI trùng khớp với hóa đơn điện tử được lưu trong hệ thống đơn hàng của sàn. Sản phẩm không bị rơi vỡ, cấn móp, vào nước hoặc có dấu hiệu can thiệp, tự ý tháo lắp sửa chữa bởi bên thứ ba không được ủy quyền.
Điều 3: Địa điểm và quy trình tiếp nhận: Khách hàng có thể mang sản phẩm trực tiếp đến các Trung tâm Bảo hành Ủy quyền tại Hà Nội và TP.HCM, hoặc gửi bảo hành qua đường bưu điện. Sàn hỗ trợ miễn phí vận chuyển 2 chiều nếu phát sinh lỗi kỹ thuật của nhà sản xuất trong vòng 30 ngày đầu tiên kể từ ngày nhận hàng.`,
  },
  {
    title: 'Chi phí và thời gian vận chuyển',
    sourceType: 'SHIPPING',
    originalContent: `Điều 1: Khu vực nội thành (Hà Nội, TP.HCM): Thời gian giao hàng dự kiến từ 1 đến 2 ngày làm việc. Cước phí vận chuyển tiêu chuẩn là 20.000 VNĐ.
Điều 2: Khu vực ngoại thành và các tỉnh thành khác: Thời gian giao hàng dự kiến từ 2 đến 4 ngày làm việc. Cước phí vận chuyển tiêu chuẩn là 35.000 VNĐ.
Điều 3: Chính sách Miễn phí vận chuyển (Freeship): Đơn hàng có tổng giá trị thanh toán thực tế từ 500.000 VNĐ trở lên sẽ được tự động áp dụng chính sách miễn phí vận chuyển trên toàn quốc.
Điều 4: Theo dõi đơn hàng: Khách hàng có thể tra cứu trạng thái vận chuyển thời gian thực bất kỳ lúc nào tại mục Đơn mua hoặc hỏi trực tiếp Trợ lý AI để cập nhật mã vận đơn và vị trí bưu phẩm.`,
  },
  {
    title: 'Hướng dẫn thanh toán & Xử lý lỗi giao dịch',
    sourceType: 'FAQ',
    originalContent: `Điều 1: Các phương thức thanh toán được hỗ trợ: Sàn TMĐT hỗ trợ đa dạng phương thức bao gồm: Thanh toán qua Ví điện tử VNPay, Ví MoMo, Thẻ thanh toán quốc tế Visa/Mastercard, Thẻ ATM nội địa (Internet Banking) và Thanh toán khi nhận hàng (COD).
Điều 2: Bảo mật thông tin thanh toán: Toàn bộ thông tin giao dịch thẻ được mã hóa theo tiêu chuẩn quốc tế PCI-DSS cấp độ 1, sàn không lưu trữ thông tin thẻ của người dùng.
Điều 3: Xử lý sự cố thanh toán: Trong trường hợp tài khoản đã bị trừ tiền nhưng hệ thống chưa ghi nhận đơn hàng thành công, hệ thống sẽ tự động đối soát trong vòng 24 giờ. Khách hàng vui lòng chụp lại biên lai trừ tiền và liên hệ Hotline 1900-6868 hoặc chat với Trợ lý AI để được nhân viên hỗ trợ kích hoạt đơn hoặc hoàn tiền ngay lập tức.`,
  },
  {
    title: 'Hướng dẫn hủy đơn & Hoàn tiền',
    sourceType: 'FAQ',
    originalContent: `Điều 1: Hủy đơn hàng tự động: Khách hàng có thể tự thao tác bấm 'Hủy đơn hàng' trực tiếp trên ứng dụng/website nếu đơn hàng đang ở trạng thái CHỜ XÁC NHẬN (PENDING) hoặc ĐANG XỬ LÝ (PROCESSING).
Điều 2: Khi đơn hàng đã chuyển sang ĐANG GIAO HÀNG (SHIPPING): Khách hàng không thể tự hủy đơn trên hệ thống. Khách hàng cần liên hệ CSKH hoặc thông báo từ chối nhận hàng khi nhân viên giao hàng (shipper) gọi điện thoại giao bưu phẩm.
Điều 3: Thời gian và quy định hoàn tiền khi hủy: Đối với đơn đã thanh toán trước (Online payment qua VNPay, MoMo, Visa/Mastercard), tiền sẽ được hoàn trả tự động vào tài khoản hoặc ví gốc của quý khách trong vòng 3 đến 5 ngày làm việc kể từ thời điểm hủy đơn được xác nhận.`,
  },
  {
    title: 'Quy chế hoạt động sàn TMĐT',
    sourceType: 'POLICY',
    originalContent: `Điều 1: Nguyên tắc hoạt động chung: Sàn Thương Mại Điện Tử là nền tảng kết nối trực tiếp giữa người mua và các nhà bán hàng uy tín đã qua kiểm duyệt hồ sơ pháp lý nghiêm ngặt.
Điều 2: Trách nhiệm và quyền lợi của người mua: Người mua được đảm bảo nhận hàng đúng mô tả, được bảo vệ thanh toán an toàn, được yêu cầu hỗ trợ khiếu nại và đổi trả nếu sản phẩm không đúng chất lượng cam kết.
Điều 3: Cơ chế giải quyết tranh chấp khiếu nại: Khi có tranh chấp phát sinh giữa người mua và người bán, ban quản trị sàn sẽ đóng vai trò trọng tài trung gian tiếp nhận phản ánh qua hệ thống Ticket Hỗ trợ hoặc Hotline trong vòng 48 giờ để giải quyết thấu đáo và đảm bảo quyền lợi chính đáng cho người tiêu dùng.`,
  },
];

function splitIntoChunks(text: string, maxWords = 250, overlapWords = 40): string[] {
  const sentences = text
    .split(/(?<=[.?!;:\n])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);

  const chunks: string[] = [];
  let currentChunkWords: string[] = [];

  for (const sentence of sentences) {
    const sentenceWords = sentence.split(/\s+/).filter(Boolean);

    if (currentChunkWords.length + sentenceWords.length > maxWords && currentChunkWords.length > 0) {
      chunks.push(currentChunkWords.join(' '));
      const overlap = currentChunkWords.slice(-overlapWords);
      currentChunkWords = [...overlap, ...sentenceWords];
    } else {
      currentChunkWords.push(...sentenceWords);
    }
  }

  if (currentChunkWords.length > 0) {
    chunks.push(currentChunkWords.join(' '));
  }

  return chunks;
}

async function main() {
  console.log('--- BẮT ĐẦU NẠP DỮ LIỆU KNOWLEDGE BASE (RAG SEEDING) ---');

  for (const policy of POLICIES) {
    console.log(`\nĐang xử lý: [${policy.sourceType}] ${policy.title}...`);

    // Kiểm tra xem tài liệu đã tồn tại chưa
    const existing = await prisma.knowledgeDocument.findFirst({
      where: { title: policy.title },
    });

    if (existing) {
      console.log(`- Tài liệu đã tồn tại (ID: ${existing.id}), bỏ qua hoặc cập nhật.`);
      continue;
    }

    const doc = await prisma.knowledgeDocument.create({
      data: {
        title: policy.title,
        sourceType: policy.sourceType,
        originalContent: policy.originalContent,
        isActive: true,
      },
    });

    const chunks = splitIntoChunks(policy.originalContent);
    console.log(`- Chia thành ${chunks.length} chunks. Đang tạo embeddings và lưu...`);

    for (let i = 0; i < chunks.length; i++) {
      const chunkText = chunks[i];
      const vector = await embeddingService.generateEmbedding(chunkText);
      const vectorString = `[${vector.join(',')}]`;

      try {
        await prisma.$executeRawUnsafe(
          `INSERT INTO document_chunks (document_id, chunk_index, content, embedding, created_at)
           VALUES ($1::uuid, $2, $3, $4::vector, NOW())`,
          doc.id,
          i + 1,
          chunkText,
          vectorString
        );
      } catch (err: any) {
        console.warn(`! Không thể chèn vector raw (${err.message}). Thử fallback Prisma thông thường...`);
        await prisma.documentChunk.create({
          data: {
            documentId: doc.id,
            chunkIndex: i + 1,
            content: chunkText,
          },
        });
      }
    }

    console.log(`✔ Hoàn thành nạp tài liệu: "${policy.title}"`);
  }

  console.log('\n--- HOÀN TẤT SEEDING TOÀN BỘ KNOWLEDGE BASE ---');
}

main()
  .catch((e) => {
    console.error('Lỗi khi seed policies:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

