/**
 * Script Test End-to-End Visual Search API (Mô phỏng Postman)
 */
async function runVisualSearchTests() {
  console.log("🚀 Bắt đầu kiểm thử End-to-End Visual Search API...\n");

  const baseUrl = "http://localhost:3008/api/search/visual";

  // -------------------------------------------------------------
  // Test 1: Tìm kiếm bằng imageUrl (JSON body)
  // -------------------------------------------------------------
  console.log("🧪 Test 1: Tìm kiếm qua imageUrl (JSON body)...");
  try {
    const testImageUrl =
      "https://cdn.dummyjson.com/product-images/beauty/essence-mascara-lash-princess/1.webp";

    const response = await fetch(baseUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        imageUrl: testImageUrl,
        limit: 5,
      }),
    });

    const data = (await response.json()) as any;
    console.log(`   Status code: ${response.status}`);

    if (response.status === 200 && data.success) {
      console.log(`   ✅ Thành công! Thời gian xử lý: ${data.data.processing_time_ms}ms`);
      console.log(`   📦 Số sản phẩm tìm thấy: ${data.data.items.length}`);
      console.log("   --- Top 3 sản phẩm tương đồng nhất ---");
      data.data.items.slice(0, 3).forEach((item: any, idx: number) => {
        console.log(
          `   ${idx + 1}. [${item.similarity_percent}%] ${item.name} (${item.price.toLocaleString("vi-VN")} đ)`,
        );
      });
    } else {
      console.error("   ❌ Test 1 thất bại:", data);
    }
  } catch (err: any) {
    console.error("   ❌ Lỗi kết nối Test 1:", err?.message || err);
  }

  console.log("\n-------------------------------------------------------------");

  // -------------------------------------------------------------
  // Test 2: Tìm kiếm bằng File Upload (Multipart/form-data)
  // -------------------------------------------------------------
  console.log("🧪 Test 2: Tìm kiếm qua Multipart File Upload (field 'image')...");
  try {
    const sampleImageUrl =
      "https://cdn.dummyjson.com/product-images/beauty/red-lipstick/1.webp";
    console.log(`   📥 Đang tải ảnh mẫu về bộ nhớ: ${sampleImageUrl}`);
    const imgFetch = await fetch(sampleImageUrl);
    const arrayBuffer = await imgFetch.arrayBuffer();
    const imageBlob = new Blob([arrayBuffer], { type: "image/webp" });

    const formData = new FormData();
    formData.append("image", imageBlob, "lipstick.webp");
    formData.append("limit", "5");

    const response = await fetch(baseUrl, {
      method: "POST",
      body: formData,
    });

    const data = (await response.json()) as any;
    console.log(`   Status code: ${response.status}`);

    if (response.status === 200 && data.success) {
      console.log(`   ✅ Thành công! Thời gian xử lý: ${data.data.processing_time_ms}ms`);
      console.log(`   📦 Số sản phẩm tìm thấy: ${data.data.items.length}`);
      console.log("   --- Top 3 sản phẩm tương đồng nhất ---");
      data.data.items.slice(0, 3).forEach((item: any, idx: number) => {
        console.log(
          `   ${idx + 1}. [${item.similarity_percent}%] ${item.name} (${item.price.toLocaleString("vi-VN")} đ)`,
        );
      });
    } else {
      console.error("   ❌ Test 2 thất bại:", data);
    }
  } catch (err: any) {
    console.error("   ❌ Lỗi kết nối Test 2:", err?.message || err);
  }

  console.log("\n-------------------------------------------------------------");

  // -------------------------------------------------------------
  // Test 3: Validation - Gửi request rỗng không có ảnh
  // -------------------------------------------------------------
  console.log("🧪 Test 3: Kiểm tra Validation khi không gửi ảnh...");
  try {
    const response = await fetch(baseUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({}),
    });

    const data = (await response.json()) as any;
    console.log(`   Status code: ${response.status} (Kỳ vọng: 400)`);
    console.log(`   Message: ${data.message}`);

    if (response.status === 400 && data.success === false) {
      console.log("   ✅ Validation hoạt động chính xác!");
    } else {
      console.error("   ❌ Test 3 thất bại:", data);
    }
  } catch (err: any) {
    console.error("   ❌ Lỗi kết nối Test 3:", err?.message || err);
  }

  console.log("\n=============================================================");
  console.log("🎉 Hoàn tất kiểm thử Visual Search API!");
}

runVisualSearchTests();
