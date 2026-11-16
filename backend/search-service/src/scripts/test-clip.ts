/**
 * Test Spike CLIP Model with @xenova/transformers
 */
async function main() {
  console.log("🚀 Đang khởi động test CLIP model...");

  try {
    // Dynamic import to bypass CommonJS/ESM transpile issues
    const { pipeline, RawImage, env } = await (Function('return import("@xenova/transformers")')());

    // Cấu hình cache thư mục nếu cần hoặc để mặc định
    console.log("📦 Đang tải pipeline 'image-feature-extraction' (Xenova/clip-vit-base-patch32)...");
    const startTime = Date.now();

    const extractor = await pipeline("image-feature-extraction", "Xenova/clip-vit-base-patch32", {
      quantized: true, // dùng model quantized ~150MB
    });

    console.log(`✅ Tải model thành công trong ${(Date.now() - startTime) / 1000}s!`);

    // Thử nghiệm với 1 ảnh mẫu từ DummyJSON
    const testImageUrl = "https://cdn.dummyjson.com/product-images/beauty/essence-mascara-lash-princess/1.webp";
    console.log(`🖼️ Đang tải ảnh test: ${testImageUrl}`);
    const imgStart = Date.now();
    const image = await RawImage.read(testImageUrl);
    console.log(`✅ Tải ảnh thành công, kích thước: ${image.width}x${image.height}`);

    console.log("⚡ Đang trích xuất feature vector từ ảnh...");
    const output = await extractor(image);
    
    // Chuyển Tensor sang mảng float thông thường
    const rawVector = Array.from(output.data as Float32Array);
    console.log(`✅ Trích xuất thành công!`);
    console.log(`   - Kích thước vector (dims): ${rawVector.length}`);
    console.log(`   - 5 phần tử đầu tiên:`, rawVector.slice(0, 5));

    // L2 Normalize
    const norm = Math.sqrt(rawVector.reduce((sum, val) => sum + val * val, 0));
    const normalizedVector = rawVector.map((val) => val / norm);
    const checkNorm = Math.sqrt(normalizedVector.reduce((sum, val) => sum + val * val, 0));

    console.log(`   - Norm sau chuẩn hóa L2: ${checkNorm.toFixed(4)} (kỳ vọng là 1.0000)`);
    console.log(`🎉 Tổng thời gian test: ${(Date.now() - imgStart) / 1000}s`);
  } catch (err) {
    console.error("❌ Lỗi khi test CLIP:", err);
    process.exit(1);
  }
}

main();
