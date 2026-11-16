import { cartTool } from '../tools/cart.tool';
import { orderTool } from '../tools/order.tool';
import { promotionTool } from '../tools/promotion.tool';
import { catalogTool } from '../tools/catalog.tool';
import { llmOrchestrator } from '../services/llm-orchestrator';

async function runDay67Tests() {
  console.log('====================================================');
  console.log('🚀 BẮT ĐẦU KIỂM THỬ NHIỆM VỤ NGÀY 6-7 CHO BẠN 1 (DỰ)');
  console.log('====================================================\n');

  let passedTests = 0;
  let totalTests = 0;
  const mockCustomerId = '12345678-aaaa-bbbb-cccc-111122223333';

  // TEST 1: Cart Tool - Kiểm tra bảo mật khi chưa đăng nhập (Guest)
  totalTests++;
  console.log('👉 [Test 1] Kiểm tra bảo mật CartTool khi khách chưa đăng nhập (Guest):');
  const guestCart = await cartTool.addToCart({
    customerId: null,
    productId: 'prod-iphone15',
    variantId: 'var-123',
    quantity: 1,
  });
  console.log(`  Require auth: ${guestCart.requireAuth} | Phản hồi: ${guestCart.text.slice(0, 70)}...`);
  if (guestCart.requireAuth && guestCart.text.includes('đăng nhập')) {
    console.log('  ✅ ĐẠT: AI đã từ chối thao tác giỏ hàng và nhắc khách đăng nhập.');
    passedTests++;
  } else {
    console.error('  ❌ Test 1 thất bại');
  }

  // TEST 2: Cart Tool - Thêm vào giỏ khi đã đăng nhập
  totalTests++;
  console.log('\n👉 [Test 2] Kiểm tra cartTool.addToCart & getCart khi đã có customerId:');
  const userCart = await cartTool.addToCart({
    customerId: mockCustomerId,
    productId: '44125e28-653e-4724-96d0-3dd405e85992',
    variantId: '11111111-aaaa-bbbb-cccc-000000000001',
    quantity: 2,
  });
  const viewCart = await cartTool.getCart({ customerId: mockCustomerId });
  console.log(`  ✅ Thêm giỏ hàng: ${userCart.success}`);
  console.log(`  ✅ Xem giỏ hàng: ${viewCart.text.slice(0, 80)}...`);
  if (userCart.success && viewCart.success) {
    passedTests++;
  }

  // TEST 3: Order Tool - getOrders & getOrderDetail
  totalTests++;
  console.log('\n👉 [Test 3] Kiểm tra orderTool.getOrders & getOrderDetail:');
  const ordersRes = await orderTool.getOrders({ customerId: mockCustomerId });
  const orderDetail = await orderTool.getOrderDetail({ customerId: mockCustomerId, orderId: 'ORD-2026-8899' });
  console.log(`  ✅ Danh sách đơn: ${ordersRes.success}`);
  console.log(`  ✅ Chi tiết đơn: ${orderDetail.text.slice(0, 80)}...`);
  if (ordersRes.success && orderDetail.success) {
    passedTests++;
  }

  // TEST 4: Order Tool - cancelOrder 2-step confirmation
  totalTests++;
  console.log('\n👉 [Test 4] Kiểm tra cancelOrder xác nhận 2 bước (Hành động nhạy cảm):');
  const step1 = await orderTool.cancelOrder({ customerId: mockCustomerId, orderId: 'ORD-2026-8899', confirmed: false });
  console.log(`  Bước 1 (chưa confirm): needConfirmation=${step1.needConfirmation}`);
  const step2 = await orderTool.cancelOrder({ customerId: mockCustomerId, orderId: 'ORD-2026-8899', confirmed: true });
  console.log(`  Bước 2 (đã confirm): success=${step2.success}`);
  if (step1.needConfirmation && step2.success) {
    console.log('  ✅ ĐẠT: AI bắt buộc hỏi xác nhận trước khi hủy đơn hàng thật sự.');
    passedTests++;
  }

  // TEST 5: Promotion Tool - checkPromotions
  totalTests++;
  console.log('\n👉 [Test 5] Kiểm tra promotionTool.checkPromotions:');
  const promoRes = await promotionTool.checkPromotions();
  console.log(`  ✅ Kết quả: ${promoRes.success} | ${promoRes.text.slice(0, 90)}...`);
  if (promoRes.success && promoRes.text.includes('FREESHIP')) {
    passedTests++;
  }

  // TEST 6: Catalog Tool - compareProducts có highlights (Ưu/Nhược điểm cho Khoa)
  totalTests++;
  console.log('\n👉 [Test 6] Kiểm tra catalogTool.compareProducts có highlights (Pros/Cons):');
  const compareRes = await catalogTool.compareProducts({ products: ['iPhone 15 Pro Max', 'Samsung Galaxy S24 Ultra'] });
  const hasHighlights = compareRes.metadata?.type === 'comparison_table' && !!compareRes.metadata.highlights?.length;
  console.log(`  ✅ Bảng so sánh có highlights: ${hasHighlights ? 'ĐẠT' : 'CHƯA ĐẠT'}`);
  if (hasHighlights && compareRes.metadata?.type === 'comparison_table') {
    const h1 = compareRes.metadata.highlights![0];
    console.log(`     Sản phẩm: ${h1.product}`);
    console.log(`     Ưu điểm: ${h1.pros[0]}`);
    console.log(`     Nhược điểm: ${h1.cons[0]}`);
    passedTests++;
  }

  // TEST 7: LLM Orchestrator Stream tích hợp nhận diện lệnh Giỏ hàng & Khuyến mãi
  totalTests++;
  console.log('\n👉 [Test 7] Kiểm tra llmOrchestrator.streamResponse với yêu cầu xem giỏ & khuyến mãi:');
  let chunks: string[] = [];
  const orchestratorCart = await llmOrchestrator.streamResponse({
    messages: [{ role: 'user', content: 'Xem giỏ hàng của tôi với' }],
    contextChunks: [],
    customerId: mockCustomerId,
    onChunk: (c) => chunks.push(c),
  });
  console.log(`  ✅ Phản hồi giỏ hàng: ${orchestratorCart.fullText.slice(0, 80)}...`);

  let promoChunks: string[] = [];
  const orchestratorPromo = await llmOrchestrator.streamResponse({
    messages: [{ role: 'user', content: 'Sàn có mã giảm giá khuyến mãi nào không?' }],
    contextChunks: [],
    onChunk: (c) => promoChunks.push(c),
  });
  console.log(`  ✅ Phản hồi voucher: ${orchestratorPromo.fullText.slice(0, 80)}...`);

  if (
    orchestratorCart.fullText.toLowerCase().includes('giỏ hàng') &&
    (orchestratorPromo.fullText.toLowerCase().includes('giảm giá') || orchestratorPromo.fullText.toLowerCase().includes('khuyến mãi'))
  ) {
    passedTests++;
  }

  console.log('\n====================================================');
  console.log(`🎉 KẾT QUẢ KIỂM THỬ NGÀY 6-7: ${passedTests}/${totalTests} TESTS PASSED!`);
  console.log('====================================================');
}

runDay67Tests().catch(console.error);
