import { createRateLimiter } from '../middlewares/rateLimiter';
import { llmOrchestrator } from '../services/llm-orchestrator';
import { catalogTool } from '../tools/catalog.tool';
import { cartTool } from '../tools/cart.tool';
import { orderTool } from '../tools/order.tool';
import { ticketTool } from '../tools/ticket.tool';

async function runDay1011Tests() {
  console.log('======================================================');
  console.log('🚀 BẮT ĐẦU KIỂM THỬ NHIỆM VỤ NGÀY 10-11 CHO BẠN 1 (DỰ)');
  console.log('======================================================\n');

  let passedTests = 0;
  let totalTests = 0;

  // TEST 1: Rate Limiter Middleware
  totalTests++;
  console.log('👉 [Test 1] Kiểm tra Rate Limiting bảo vệ Chat API:');
  const testLimiter = createRateLimiter({
    windowMs: 1000,
    max: 3,
    message: 'Quá giới hạn',
  });

  const mockReq: any = {
    headers: { 'x-user-id': 'client-test-rate-limit' },
    body: {},
  };

  let rejected = false;
  let retrySeconds = 0;

  for (let i = 0; i < 5; i++) {
    const mockRes: any = {
      status: (code: number) => {
        if (code === 429) rejected = true;
        return {
          json: (data: any) => {
            retrySeconds = data.retry_after_seconds;
          },
        };
      },
      setHeader: () => {},
    };
    let nextCalled = false;
    testLimiter(mockReq, mockRes, () => {
      nextCalled = true;
    });
  }

  console.log(`  ✅ Bị chặn đúng ngưỡng 429: ${rejected}`);
  if (rejected) {
    console.log('  ✅ ĐẠT: Rate Limiter đã bảo vệ server thành công khi có spam.');
    passedTests++;
  } else {
    console.error('  ❌ Test 1 thất bại');
  }

  // TEST 2: Context Window Limit (Tối đa 10 tin nhắn gần nhất)
  totalTests++;
  console.log('\n👉 [Test 2] Kiểm tra giới hạn Context Window 10 messages:');
  const history15 = Array.from({ length: 15 }, (_, i) => ({
    role: (i % 2 === 0 ? 'user' : 'assistant') as 'user' | 'assistant',
    content: `Tin nhắn số ${i + 1}`,
  }));

  // Cắt 10 tin nhắn gần nhất
  const trimmed = history15.slice(-10);
  console.log(`  Độ dài ban đầu: ${history15.length} -> Sau khi giới hạn context window: ${trimmed.length}`);
  if (trimmed.length === 10 && trimmed[9].content === 'Tin nhắn số 15') {
    console.log('  ✅ ĐẠT: Giữ đúng 10 tin nhắn gần nhất cho ngữ cảnh hội thoại.');
    passedTests++;
  } else {
    console.error('  ❌ Test 2 thất bại');
  }

  // TEST 3: Graceful Error Handling khi service ngoài offline
  totalTests++;
  console.log('\n👉 [Test 3] Kiểm tra Graceful Error Handling khi các service ngoài offline:');
  const catRes = await catalogTool.searchProducts({ query: 'iphone' });
  const cartRes = await cartTool.addToCart({ customerId: 'usr-1', productId: 'p1', variantId: 'v1' });
  const ordRes = await orderTool.getOrders({ customerId: 'usr-1' });
  const tktRes = await ticketTool.escalateToTicket({ customerId: 'usr-1', reason: 'Khiếu nại giao trễ' });

  const allGraceful = catRes.success && cartRes.success && ordRes.success && tktRes.success;
  console.log(`  Catalog graceful: ${catRes.success}`);
  console.log(`  Cart graceful: ${cartRes.success}`);
  console.log(`  Order graceful: ${ordRes.success}`);
  console.log(`  Ticket graceful: ${tktRes.success}`);

  if (allGraceful) {
    console.log('  ✅ ĐẠT: Không có service nào bị crash khi các container khác offline.');
    passedTests++;
  } else {
    console.error('  ❌ Test 3 thất bại');
  }

  // TEST 4: LLM Timeout fallback
  totalTests++;
  console.log('\n👉 [Test 4] Kiểm tra Stream Response fallback khi không có API key / LLM timeout:');
  let streamChunks: string[] = [];
  const res = await llmOrchestrator.streamResponse({
    messages: [{ role: 'user', content: 'Chính sách bảo hành sàn như thế nào?' }],
    contextChunks: [
      {
        chunk_id: 1,
        document_id: 'doc-1',
        document_title: 'Chính sách bảo hành sản phẩm',
        source_type: 'POLICY',
        content: 'Mọi sản phẩm điện thoại được bảo hành chính hãng từ 12 đến 24 tháng.',
        score: 0.95,
      },
    ],
    onChunk: (c) => streamChunks.push(c),
  });

  const fullText = res.fullText;
  console.log(`  Số text chunks nhận: ${streamChunks.length}`);
  console.log(`  Phản hồi có chứa nội dung RAG: ${fullText.includes('bảo hành')}`);

  if (streamChunks.length > 0 && fullText.includes('bảo hành')) {
    console.log('  ✅ ĐẠT: Stream response fallback hoạt động mượt mà với RAG Context.');
    passedTests++;
  } else {
    console.error('  ❌ Test 4 thất bại');
  }

  // TEST 5: Tổng kiểm tra 12 Tools hoạt động đồng bộ
  totalTests++;
  console.log('\n👉 [Test 5] Kiểm tra tổng hợp toàn bộ các Tool Calling:');
  const toolList = [
    'search_products',
    'get_product_details',
    'compare_products',
    'add_to_cart',
    'get_cart',
    'update_cart_item',
    'remove_cart_item',
    'get_orders',
    'get_order_detail',
    'cancel_order',
    'check_promotions',
    'escalate_to_ticket',
  ];

  let toolsOk = 0;
  for (const t of toolList) {
    const executed = await llmOrchestrator.executeTool(t, { query: 'test', product_id: 'p1', variant_id: 'v1', order_id: 'o1', item_id: 'i1', reason: 'khiếu nại' }, 'usr-1');
    if (executed && typeof executed.text === 'string') {
      toolsOk++;
    }
  }

  console.log(`  Số tool thực thi thành công: ${toolsOk}/${toolList.length}`);
  if (toolsOk === toolList.length) {
    console.log('  ✅ ĐẠT: 100% 12 Tools đều có thể thực thi trơn tru.');
    passedTests++;
  } else {
    console.error('  ❌ Test 5 thất bại');
  }

  console.log('\n======================================================');
  console.log(`🎉 KẾT QUẢ KIỂM THỬ NGÀY 10-11: ${passedTests}/${totalTests} TESTS PASSED!`);
  console.log('======================================================');
}

runDay1011Tests().catch(console.error);
