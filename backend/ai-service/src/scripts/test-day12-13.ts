import { catalogTool } from '../tools/catalog.tool';
import { cartTool } from '../tools/cart.tool';
import { orderTool } from '../tools/order.tool';
import { ticketTool } from '../tools/ticket.tool';
import { ragService } from '../services/rag.service';
import { llmOrchestrator } from '../services/llm-orchestrator';

async function runDay1213IntegrationTests() {
  console.log('================================================================');
  console.log('🎓 BẮT ĐẦU KIỂM THỬ HỖ TRỢ TÍCH HỢP (NGÀY 12-13) — BẠN 1 (DỰ)');
  console.log('================================================================\n');

  let passedTests = 0;
  const totalTests = 4;
  const mockCustomerId = '11111111-2222-3333-4444-555555555555';
  const mockSessionId = '99999999-8888-7777-6666-555544443333';

  // ========================================================================
  // KỊCH BẢN 1: HAPPY PATH AI SHOPPING (Dự ↔ Khoa)
  // ========================================================================
  console.log('🔹 [KỊCH BẢN TEST 1] HAPPY PATH AI SHOPPING (DỰ ↔ KHOA):');
  console.log('  1. Khách hỏi: "Tìm điện thoại dưới 30 triệu"');
  const searchResult = await llmOrchestrator.streamResponse({
    messages: [{ role: 'user', content: 'Tìm điện thoại dưới 30 triệu' }],
    contextChunks: [],
    customerId: mockCustomerId,
    sessionId: mockSessionId,
    onChunk: () => {},
  });

  const productMeta = searchResult.metadata?.type === 'product_cards' ? (searchResult.metadata as any) : null;
  const hasProductCards = !!productMeta;
  const firstProduct = productMeta?.products ? productMeta.products[0] : null;
  const hasValidVariantId = !!firstProduct?.variant_id;

  console.log(`     -> Metadata thẻ sản phẩm: ${hasProductCards ? '✅ CÓ' : '❌ THIẾU'}`);
  console.log(`     -> Sản phẩm: ${firstProduct?.name} | variant_id: ${firstProduct?.variant_id}`);

  console.log('  2. Khách hỏi: "So sánh iPhone 15 Pro Max và Samsung Galaxy S24 Ultra"');
  const compareResult = await llmOrchestrator.streamResponse({
    messages: [{ role: 'user', content: 'So sánh iPhone 15 Pro Max và Samsung Galaxy S24 Ultra' }],
    contextChunks: [],
    customerId: mockCustomerId,
    sessionId: mockSessionId,
    onChunk: () => {},
  });

  const compareMeta = compareResult.metadata?.type === 'comparison_table' ? (compareResult.metadata as any) : null;
  const hasCompareTable = !!compareMeta;
  const hasHighlights = hasCompareTable && !!compareMeta?.highlights?.length;
  console.log(`     -> Bảng so sánh: ${hasCompareTable ? '✅ CÓ' : '❌ THIẾU'}`);
  console.log(`     -> Ưu/nhược điểm (highlights): ${hasHighlights ? '✅ CÓ' : '❌ THIẾU'}`);

  console.log('  3. Khách chọn: "Thêm vào giỏ hàng"');
  const addCartResult = await cartTool.addToCart({
    customerId: mockCustomerId,
    productId: firstProduct?.id || '44125e28-653e-4724-96d0-3dd405e85992',
    variantId: firstProduct?.variant_id || '11111111-aaaa-bbbb-cccc-000000000001',
    quantity: 1,
  });
  console.log(`     -> Kết quả thêm giỏ hàng: ${addCartResult.success ? '✅ THÀNH CÔNG' : '❌ THẤT BẠI'}`);

  if (hasProductCards && hasValidVariantId && hasCompareTable && hasHighlights && addCartResult.success) {
    console.log('  👉 KẾT QUẢ KỊCH BẢN 1: ✅ ĐẠT 100%\n');
    passedTests++;
  } else {
    console.error('  👉 KẾT QUẢ KỊCH BẢN 1: ❌ THẤT BẠI\n');
  }

  // ========================================================================
  // KỊCH BẢN 2: AI CHAT ESCALATE TO TICKET (Dự ↔ Đức)
  // ========================================================================
  console.log('🔹 [KỊCH BẢN TEST 2] AI CHAT ESCALATE TO TICKET (DỰ ↔ ĐỨC):');
  const angryMessage = 'Đơn hàng 5 ngày chưa giao, các bạn lừa đảo à? Tôi muốn gặp người thật và hoàn tiền ngay!';
  console.log(`  Khách gửi: "${angryMessage}"`);

  const escalateResult = await llmOrchestrator.streamResponse({
    messages: [{ role: 'user', content: angryMessage }],
    contextChunks: [],
    customerId: mockCustomerId,
    sessionId: mockSessionId,
    customerEmail: 'khachhang.angry@gmail.com',
    onChunk: () => {},
  });

  const toolCalled = escalateResult.toolCalls?.some((t) => t.name === 'escalate_to_ticket');
  const hasTicketCode = escalateResult.fullText.includes('TK-');
  const hasEmpathy = escalateResult.fullText.includes('tiếc') || escalateResult.fullText.includes('CSKH');

  console.log(`     -> Tự động gọi escalate_to_ticket: ${toolCalled ? '✅ ĐÃ GỌI' : '❌ CHƯA GỌI'}`);
  console.log(`     -> Sinh mã ticket hiển thị: ${hasTicketCode ? '✅ CÓ MÃ' : '❌ THIẾU'}`);
  console.log(`     -> Phản hồi thấu cảm: ${hasEmpathy ? '✅ CÓ' : '❌ THIẾU'}`);

  if (toolCalled && hasTicketCode && hasEmpathy) {
    console.log('  👉 KẾT QUẢ KỊCH BẢN 2: ✅ ĐẠT 100%\n');
    passedTests++;
  } else {
    console.error('  👉 KẾT QUẢ KỊCH BẢN 2: ❌ THẤT BẠI\n');
  }

  // ========================================================================
  // KỊCH BẢN 3: SUPPORT SERVICE RAG QUERY (Dự ↔ Đức)
  // ========================================================================
  console.log('🔹 [KỊCH BẢN TEST 3] RAG QUERY API CHO SUPPORT SERVICE:');
  const ragQuery = 'Khách hàng yêu cầu hủy đơn và hoàn tiền do giao trễ';
  console.log(`  Support Service gọi RAG Query: "${ragQuery}"`);

  const ragChunks = await ragService.queryKnowledgeBase(ragQuery, 3, 0.6);
  console.log(`     -> Số chunk chính sách tìm thấy: ${ragChunks.length}`);
  if (ragChunks.length > 0) {
    console.log(`     -> Chunk 1: [${ragChunks[0].document_title}] (Điểm: ${ragChunks[0].score})`);
    console.log(`        Nội dung: ${ragChunks[0].content.slice(0, 80)}...`);
  }

  const isRefundOrCancel = ragChunks.some(
    (c) => c.document_title.includes('đổi trả') || c.document_title.includes('hủy đơn')
  );

  if (ragChunks.length > 0 && isRefundOrCancel) {
    console.log('  👉 KẾT QUẢ KỊCH BẢN 3: ✅ ĐẠT 100%\n');
    passedTests++;
  } else {
    console.error('  👉 KẾT QUẢ KỊCH BẢN 3: ❌ THẤT BẠI\n');
  }

  // ========================================================================
  // KỊCH BẢN 4: RAG ANTI-HALLUCINATION & CHÍNH SÁCH SÀN
  // ========================================================================
  console.log('🔹 [KỊCH BẢN TEST 4] RAG ANTI-HALLUCINATION & CHÍNH SÁCH:');
  console.log('  1. Câu hỏi hợp lệ: "Chính sách bảo hành sản phẩm như thế nào?"');
  const validPolicyResult = await llmOrchestrator.streamResponse({
    messages: [{ role: 'user', content: 'Chính sách bảo hành sản phẩm như thế nào?' }],
    contextChunks: await ragService.queryKnowledgeBase('Chính sách bảo hành sản phẩm', 2, 0.6),
    onChunk: () => {},
  });
  const hasWarrantyInfo = validPolicyResult.fullText.includes('bảo hành') || validPolicyResult.fullText.includes('tháng');
  console.log(`     -> Trả lời chính xác chính sách: ${hasWarrantyInfo ? '✅ ĐẠT' : '❌ CHƯA ĐẠT'}`);

  console.log('  2. Câu hỏi cấm/ngoài quy chế: "Sàn có bán vũ khí hay súng đạn không?"');
  const invalidPolicyResult = await llmOrchestrator.streamResponse({
    messages: [{ role: 'user', content: 'Sàn có bán vũ khí hay súng đạn không?' }],
    contextChunks: [],
    onChunk: () => {},
  });
  const refusesHallucination =
    invalidPolicyResult.fullText.includes('không tìm thấy thông tin') ||
    invalidPolicyResult.fullText.includes('nghiêm cấm') ||
    invalidPolicyResult.fullText.includes('1900-6868');
  console.log(`     -> Từ chối bịa đặt và hướng dẫn hotline: ${refusesHallucination ? '✅ ĐẠT' : '❌ BỊ BỊA ĐẶT'}`);

  if (hasWarrantyInfo && refusesHallucination) {
    console.log('  👉 KẾT QUẢ KỊCH BẢN 4: ✅ ĐẠT 100%\n');
    passedTests++;
  } else {
    console.error('  👉 KẾT QUẢ KỊCH BẢN 4: ❌ THẤT BẠI\n');
  }

  console.log('================================================================');
  console.log(`🎉 TỔNG KẾT KIỂM THỬ TÍCH HỢP NGÀY 12-13: ${passedTests}/${totalTests} KỊCH BẢN ĐẠT XUẤT SẮC!`);
  console.log('================================================================');
}

runDay1213IntegrationTests().catch(console.error);
