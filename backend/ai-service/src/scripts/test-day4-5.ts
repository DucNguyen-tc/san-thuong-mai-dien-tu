import { catalogTool } from '../tools/catalog.tool';
import { llmOrchestrator } from '../services/llm-orchestrator';

async function runDay45Tests() {
  console.log('====================================================');
  console.log('🚀 BẮT ĐẦU KIỂM THỬ NHIỆM VỤ NGÀY 4-5 CHO BẠN 1 (DỰ)');
  console.log('====================================================\n');

  let passedTests = 0;
  let totalTests = 0;

  // TEST 1: Tool search_products
  totalTests++;
  console.log('👉 [Test 1] Kiểm tra catalogTool.searchProducts:');
  const searchRes = await catalogTool.searchProducts({ query: 'điện thoại', limit: 3 });
  if (searchRes.success && searchRes.metadata?.type === 'product_cards') {
    const products = searchRes.metadata.products;
    const hasVariantId = products.every((p) => p.variant_id && typeof p.variant_id === 'string');
    console.log(`  ✅ Đã tìm thấy ${products.length} sản phẩm.`);
    console.log(`  ✅ Kiểm tra contract Khoa (variant_id tồn tại trên 100% thẻ):`, hasVariantId ? 'ĐẠT' : 'CHƯA ĐẠT');
    console.log(`     Sản phẩm đầu tiên: ${products[0]?.name}`);
    console.log(`     Giá: ${products[0]?.price?.toLocaleString('vi-VN')}đ | variant_id: ${products[0]?.variant_id}`);
    if (hasVariantId && products.length > 0) passedTests++;
  } else {
    console.error('  ❌ Test 1 thất bại:', searchRes.error);
  }

  // TEST 2: Tool get_product_details
  totalTests++;
  console.log('\n👉 [Test 2] Kiểm tra catalogTool.getProductDetails:');
  const detailRes = await catalogTool.getProductDetails({ product_id: 'iphone-15-pro-max-256gb' });
  if (detailRes.success && detailRes.metadata?.type === 'product_cards') {
    const p = detailRes.metadata.products[0];
    console.log(`  ✅ Lấy chi tiết thành công: ${p.name}`);
    console.log(`  ✅ variant_id: ${p.variant_id}`);
    passedTests++;
  } else {
    console.error('  ❌ Test 2 thất bại:', detailRes.error);
  }

  // TEST 3: Tool compare_products
  totalTests++;
  console.log('\n👉 [Test 3] Kiểm tra catalogTool.compareProducts:');
  const compareRes = await catalogTool.compareProducts({
    products: ['iPhone 15 Pro Max', 'Samsung Galaxy S24 Ultra'],
  });
  if (compareRes.success && compareRes.metadata?.type === 'comparison_table') {
    const table = compareRes.metadata;
    console.log(`  ✅ So sánh thành công giữa: ${table.products.join(' VS ')}`);
    console.log(`  ✅ Số tiêu chí kỹ thuật: ${table.attributes.length}`);
    console.log(`  ✅ Gợi ý của AI: ${table.recommendation?.slice(0, 80)}...`);
    passedTests++;
  } else {
    console.error('  ❌ Test 3 thất bại:', compareRes.error);
  }

  // TEST 4: LLM Orchestrator Stream & Tool Calling Integration
  totalTests++;
  console.log('\n👉 [Test 4] Kiểm tra llmOrchestrator.streamResponse với tìm kiếm sản phẩm:');
  let streamChunks: string[] = [];
  let capturedMetadata: any = null;

  const result = await llmOrchestrator.streamResponse({
    messages: [{ role: 'user', content: 'Tìm giúp tôi điện thoại chụp ảnh đẹp tầm 25 đến 30 triệu' }],
    contextChunks: [],
    onChunk: (chunk) => streamChunks.push(chunk),
    onMetadata: (metadata) => {
      capturedMetadata = metadata;
    },
  });

  const fullText = streamChunks.join('');
  const hasMetadata = capturedMetadata?.type === 'product_cards' || result.metadata?.type === 'product_cards';

  console.log(`  ✅ Nhận được ${streamChunks.length} text chunks.`);
  console.log(`  ✅ SSE Metadata thẻ sản phẩm:`, hasMetadata ? 'ĐÃ NHẬN THÀNH CÔNG' : 'CHƯA CÓ');
  if (hasMetadata) {
    const products = (capturedMetadata || result.metadata).products;
    console.log(`     Số lượng thẻ: ${products.length} | Thẻ 1: ${products[0]?.name}`);
    console.log(`     variant_id: ${products[0]?.variant_id}`);
  }
  if (streamChunks.length > 0 && hasMetadata) passedTests++;

  // TEST 5: LLM Orchestrator Stream với câu hỏi so sánh
  totalTests++;
  console.log('\n👉 [Test 5] Kiểm tra llmOrchestrator.streamResponse với so sánh sản phẩm:');
  let compareChunks: string[] = [];
  let compareMetadata: any = null;

  await llmOrchestrator.streamResponse({
    messages: [{ role: 'user', content: 'Nên mua iPhone 15 Pro Max hay Samsung Galaxy S24 Ultra?' }],
    contextChunks: [],
    onChunk: (chunk) => compareChunks.push(chunk),
    onMetadata: (metadata) => {
      compareMetadata = metadata;
    },
  });

  const isCompareTable = compareMetadata?.type === 'comparison_table';
  console.log(`  ✅ SSE Metadata bảng so sánh:`, isCompareTable ? 'ĐÃ NHẬN THÀNH CÔNG' : 'CHƯA CÓ');
  if (isCompareTable) {
    console.log(`     Sản phẩm so sánh: ${compareMetadata.products.join(' và ')}`);
    passedTests++;
  }

  console.log('\n====================================================');
  console.log(`🎉 KẾT QUẢ KIỂM THỬ: ${passedTests}/${totalTests} TESTS PASSED!`);
  console.log('====================================================');
}

runDay45Tests().catch(console.error);
