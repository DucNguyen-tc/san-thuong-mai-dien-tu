import { ticketTool } from '../tools/ticket.tool';
import { orderTool } from '../tools/order.tool';
import { cartTool } from '../tools/cart.tool';
import { catalogTool } from '../tools/catalog.tool';
import { llmOrchestrator } from '../services/llm-orchestrator';

async function runDay89Tests() {
  console.log('====================================================');
  console.log('🚀 BẮT ĐẦU KIỂM THỬ NHIỆM VỤ NGÀY 8-9 CHO BẠN 1 (DỰ)');
  console.log('====================================================\n');

  let passedTests = 0;
  let totalTests = 0;
  const mockCustomerId = '11111111-2222-3333-4444-555555555555';
  const mockSessionId = '99999999-8888-7777-6666-555544443333';

  // TEST 1: Ticket Tool - escalateToTicket trực tiếp
  totalTests++;
  console.log('👉 [Test 1] Kiểm tra ticketTool.escalateToTicket:');
  const escalateRes = await ticketTool.escalateToTicket({
    customerId: mockCustomerId,
    customerEmail: 'khachhang.test@gmail.com',
    customerName: 'Nguyễn Văn Test',
    chatSessionId: mockSessionId,
    reason: 'Khách hàng bức xúc vì đơn hàng giao trễ quá 5 ngày, yêu cầu hoàn tiền gấp',
    chatSummary: 'Khách liên hệ nhiều lần qua hotline nhưng bận máy.',
    category: 'SHIPPING',
    relatedOrderId: '44125e28-653e-4724-96d0-3dd405e85992',
  });

  console.log(`  ✅ Kết quả tạo ticket: ${escalateRes.success}`);
  console.log(`  ✅ Mã ticket sinh ra: ${escalateRes.ticketNumber}`);
  console.log(`  ✅ Phản hồi: ${escalateRes.text.slice(0, 100)}...`);

  if (escalateRes.success && escalateRes.ticketNumber && escalateRes.text.includes(escalateRes.ticketNumber)) {
    passedTests++;
  } else {
    console.error('  ❌ Test 1 thất bại');
  }

  // TEST 2: LLM Intent Detection tự động Escalate khi phát hiện khách giận dữ / bức xúc
  totalTests++;
  console.log('\n👉 [Test 2] Kiểm tra LLM Orchestrator tự động gọi escalate_to_ticket khi khách bức xúc:');
  let chunks: string[] = [];
  const angryMsg = 'Đơn hàng của tôi 5 ngày rồi chưa giao, các bạn lừa đảo à? Cho tôi gặp người thật ngay!';

  const result = await llmOrchestrator.streamResponse({
    messages: [{ role: 'user', content: angryMsg }],
    contextChunks: [],
    customerId: mockCustomerId,
    sessionId: mockSessionId,
    customerEmail: 'khach.angry@gmail.com',
    onChunk: (c) => chunks.push(c),
  });

  const fullText = result.fullText;
  const toolCalled = result.toolCalls?.some((t) => t.name === 'escalate_to_ticket');
  console.log(`  ✅ Tool đã gọi: ${result.toolCalls?.map((t) => t.name).join(', ')}`);
  console.log(`  ✅ Chứa mã ticket: ${fullText.includes('TK-')}`);
  console.log(`  ✅ Thể hiện sự thấu cảm: ${fullText.includes('tiếc') || fullText.includes('CSKH')}`);
  console.log(`  Trích đoạn phản hồi:\n"${fullText.slice(0, 150)}..."`);

  if (toolCalled && fullText.includes('TK-')) {
    passedTests++;
  } else {
    console.error('  ❌ Test 2 thất bại');
  }

  // TEST 3: Xác nhận 2 bước cho lệnh nhạy cảm cancel_order (Mục 3.1)
  totalTests++;
  console.log('\n👉 [Test 3] Kiểm tra xác nhận 2 bước khi hủy đơn hàng:');
  const step1 = await orderTool.cancelOrder({
    customerId: mockCustomerId,
    orderId: 'ORD-2026-9999',
    confirmed: false,
  });
  console.log(`  Bước 1 (chưa xác nhận): needConfirmation=${step1.needConfirmation}`);

  const step2 = await orderTool.cancelOrder({
    customerId: mockCustomerId,
    orderId: 'ORD-2026-9999',
    confirmed: true,
  });
  console.log(`  Bước 2 (đã xác nhận): success=${step2.success}`);

  if (step1.needConfirmation && step2.success) {
    console.log('  ✅ ĐẠT: Luồng 2 bước bảo vệ an toàn cho đơn hàng.');
    passedTests++;
  }

  // TEST 4: Hướng dẫn đăng nhập khi Guest thao tác giỏ hàng / đơn hàng
  totalTests++;
  console.log('\n👉 [Test 4] Kiểm tra yêu cầu đăng nhập đối với khách vãng lai:');
  const guestCart = await cartTool.addToCart({
    customerId: null,
    productId: 'prod-123',
    variantId: 'var-123',
  });
  const guestOrder = await orderTool.getOrders({ customerId: null });
  console.log(`  Cart requireAuth: ${guestCart.requireAuth}`);
  console.log(`  Order requireAuth: ${guestOrder.requireAuth}`);

  if (guestCart.requireAuth && guestOrder.requireAuth) {
    console.log('  ✅ ĐẠT: Bắt buộc đăng nhập bảo mật cho khách vãng lai.');
    passedTests++;
  }

  // TEST 5: Hồi quy các tính năng cốt lõi (Catalog, Product Cards, Comparison Table)
  totalTests++;
  console.log('\n👉 [Test 5] Kiểm tra hồi quy Catalog search & comparison table:');
  const searchRes = await catalogTool.searchProducts({ query: 'iphone', limit: 2 });
  const compareRes = await catalogTool.compareProducts({ products: ['iPhone 15 Pro Max', 'Samsung Galaxy S24 Ultra'] });

  const searchOk = searchRes.success && searchRes.metadata?.type === 'product_cards';
  const compareOk = compareRes.success && compareRes.metadata?.type === 'comparison_table' && !!compareRes.metadata.highlights?.length;

  console.log(`  Search products OK: ${searchOk}`);
  console.log(`  Compare products with highlights OK: ${compareOk}`);

  if (searchOk && compareOk) {
    passedTests++;
  }

  console.log('\n====================================================');
  console.log(`🎉 KẾT QUẢ KIỂM THỬ NGÀY 8-9: ${passedTests}/${totalTests} TESTS PASSED!`);
  console.log('====================================================');
}

runDay89Tests().catch(console.error);
