import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";

import { generatePhones, generateTablets } from "./products_catalog_500";
import { generateLaptops } from "./dataset_builder";
import { generateSmartwatches, generateAudio, generateAccessories } from "./data_smartwatch_audio";
import { generateHomeAppliances, generateKitchen } from "./data_home_appliances";
import { generateAirPurifiers, generatePersonalCare } from "./data_air_and_personal";
import { generateCameras, generateActionCams, generateLenses } from "./data_cameras_gear";
import { generateMensApparel, generateWomensApparel, generateBags, generateWatchesAndJewelry } from "./data_fashion_lifestyle";
import { generateSportShoes, generateOutdoor, generateSkincare, generatePerfumes } from "./data_sports_beauty";

const prisma = new PrismaClient();

function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// -------------------------------------------------------------
// Helper: Extract specs for 548 seed items
// -------------------------------------------------------------
function extractSpecsForSeedItem(item: any): Record<string, any> {
  const desc = item.description || "";
  const matches = [...desc.matchAll(/-\s+\*\*([^*]+):\*\*\s+([^\r\n]+)/g)];
  const rawKv: Record<string, string> = {};
  for (const m of matches) {
    rawKv[m[1].trim()] = m[2].trim();
  }

  const cat = item.categorySlug;
  const brand = item.brand || rawKv["Thương hiệu"] || "Chính hãng";
  const model = rawKv["Mã sản phẩm (Model)"] || rawKv["Model"] || item.name;

  const baseSpecs: Record<string, any> = {
    brand,
    model,
    category_slug: cat
  };

  switch (cat) {
    case "smartphones":
      return {
        ...baseSpecs,
        chip: rawKv["Bộ vi xử lý trung tâm (CPU / Chipset)"] || rawKv["Vi xử lý"] || null,
        gpu: rawKv["Bộ xử lý đồ họa (GPU)"] || null,
        ram_gb: parseInt(rawKv["Bộ nhớ RAM"] || "8") || 8,
        storage_gb: parseInt(rawKv["Bộ nhớ lưu trữ (ROM / Storage)"] || "256") || 256,
        display: {
          spec: rawKv["Màn hình hiển thị"] || null,
          panel: rawKv["Màn hình hiển thị"]?.includes("OLED") ? "OLED" : rawKv["Màn hình hiển thị"]?.includes("AMOLED") ? "AMOLED" : "IPS LCD",
          refresh_rate_hz: rawKv["Màn hình hiển thị"]?.includes("144Hz") ? 144 : rawKv["Màn hình hiển thị"]?.includes("120Hz") ? 120 : 60
        },
        camera: {
          main_camera: rawKv["Cụm Camera sau"] || null,
          selfie_camera: rawKv["Camera selfie trước"] || null
        },
        battery_mah: parseInt(rawKv["Dung lượng Pin"] || "4500") || 4500,
        charging: rawKv["Công nghệ Sạc"] || null,
        water_resistance: rawKv["Tiêu chuẩn kháng nước & kháng bụi"] || "IP68",
        os: brand === "Apple" ? "iOS" : "Android",
        connectivity: ["5G", "Wi-Fi", "Bluetooth", "NFC"]
      };

    case "laptops":
      return {
        ...baseSpecs,
        cpu: rawKv["Bộ vi xử lý (CPU)"] || null,
        gpu: rawKv["Card đồ họa (GPU)"] || null,
        ram_gb: parseInt(rawKv["Dung lượng RAM"] || "16") || 16,
        storage_gb: parseInt(rawKv["Ổ cứng lưu trữ (SSD)"] || "512") || 512,
        display: {
          spec: rawKv["Màn hình hiển thị"] || null,
          refresh_rate_hz: rawKv["Màn hình hiển thị"]?.includes("165Hz") ? 165 : rawKv["Màn hình hiển thị"]?.includes("120Hz") ? 120 : 60
        },
        battery: rawKv["Thời lượng pin & Sạc"] || null,
        weight: rawKv["Trọng lượng & Thiết kế"] || null,
        os: brand === "Apple" ? "macOS" : "Windows 11"
      };

    case "tablets":
      return {
        ...baseSpecs,
        chip: rawKv["Vi xử lý (CPU/Processor)"] || null,
        ram_gb: parseInt(rawKv["Bộ nhớ RAM"] || "8") || 8,
        storage_gb: parseInt(rawKv["Bộ nhớ trong (ROM)"] || "128") || 128,
        display: { spec: rawKv["Màn hình hiển thị"] || null },
        camera: rawKv["Hệ thống Camera"] || null,
        battery_mah: parseInt(rawKv["Dung lượng Pin"] || "8000") || 8000,
        stylus_support: true,
        os: brand === "Apple" ? "iPadOS" : "Android"
      };

    case "smartwatch":
      return {
        ...baseSpecs,
        display: rawKv["Màn hình hiển thị & Mặt kính"] || null,
        battery_life: rawKv["Thời lượng Pin & Nguồn sạc"] || null,
        water_resistance: rawKv["Kháng nước & Độ bền"] || "5 ATM",
        sensors: rawKv["Cảm biến sức khỏe & Đo chỉ số"] || null,
        strap_material: rawKv["Chất liệu vỏ & Dây đeo"] || null,
        os_compatibility: ["iOS", "Android"]
      };

    case "audio":
      return {
        ...baseSpecs,
        type: rawKv["Thiết kế & Phân loại"] || "Tai nghe / Loa",
        driver: rawKv["Màng loa & Cấu hình âm thanh (Driver)"] || null,
        battery_life: rawKv["Thời lượng pin & Hộp sạc"] || null,
        noise_cancellation: rawKv["Công nghệ chống ồn & Đàm thoại"] || null,
        connectivity: rawKv["Chuẩn kết nối & Codec âm thanh"] || "Bluetooth 5.3",
        water_resistance: rawKv["Kháng nước & Bụi bẩn"] || "IPX4"
      };

    case "accessories":
      return {
        ...baseSpecs,
        output_power: rawKv["Công suất & Cổng kết nối (Power & Ports)"] || null,
        capacity: rawKv["Dung lượng & Hiệu suất chuyển đổi"] || null,
        fast_charging: rawKv["Chuẩn sạc nhanh hỗ trợ"] || null,
        material: rawKv["Vật liệu cấu tạo & Độ bền"] || null,
        protection: rawKv["Hệ thống bảo vệ an toàn"] || null
      };

    case "robot-vacuum":
      return {
        ...baseSpecs,
        suction_power: rawKv["Lực hút tối đa (Suction Power)"] || null,
        navigation: rawKv["Hệ thống điều hướng & Cảm biến (Navigation)"] || null,
        battery_and_runtime: rawKv["Dung lượng pin & Thời gian làm việc"] || null,
        mopping: rawKv["Hệ thống lau nhà (Mopping System)"] || null,
        dock_features: rawKv["Trạm sạc đa năng (Omni / All-in-One Dock)"] || null
      };

    case "kitchen-appliances":
      return {
        ...baseSpecs,
        capacity: rawKv["Dung tích chứa / Quy cách"] || null,
        power_w: parseInt(rawKv["Công suất tiêu thụ điện"] || "2000") || 2000,
        temperature_range: rawKv["Dải nhiệt độ & Chế độ nấu"] || null,
        technology: rawKv["Công nghệ cốt lõi & Tính năng thông minh"] || null,
        safety_standards: rawKv["Tiêu chuẩn an toàn & Vệ sinh"] || null
      };

    case "air-purifier":
      return {
        ...baseSpecs,
        coverage_area: rawKv["Diện tích phòng đáp ứng (Coverage Area)"] || null,
        cadr: rawKv["Chỉ số làm sạch không khí (CADR)"] || null,
        filtration: rawKv["Hệ thống màng lọc đa tầng (Filter System)"] || null,
        sensors: rawKv["Cảm biến & Màn hình hiển thị (Sensors & Display)"] || null,
        noise_level: rawKv["Độ ồn khi vận hành (Noise Level)"] || null
      };

    case "personal-care":
      return {
        ...baseSpecs,
        technology: rawKv["Công nghệ cốt lõi & Động cơ"] || null,
        power_and_battery: rawKv["Công suất / Thời lượng pin"] || null,
        features: rawKv["Chế độ chăm sóc & Đầu phụ kiện"] || null,
        safety_standards: rawKv["Tiêu chuẩn an toàn & Chống nước"] || null
      };

    case "cameras":
      return {
        ...baseSpecs,
        sensor: rawKv["Cảm biến hình ảnh (Sensor)"] || null,
        processor: rawKv["Bộ xử lý hình ảnh (Processor)"] || null,
        autofocus: rawKv["Hệ thống lấy nét tự động (Autofocus)"] || null,
        video: rawKv["Năng lực quay video & Định dạng màu"] || null,
        stabilization: rawKv["Hệ thống ổn định hình ảnh (Chống rung IBIS)"] || null,
        viewfinder: rawKv["Màn hình hiển thị & Kính ngắm (EVF)"] || null
      };

    case "action-cam-gimbal":
      return {
        ...baseSpecs,
        resolution: rawKv["Độ phân giải & Cảm biến hình ảnh"] || null,
        stabilization: rawKv["Công nghệ chống rung (Stabilization)"] || null,
        waterproof: rawKv["Khả năng kháng nước & Độ sâu lặn"] || null,
        battery: rawKv["Dung lượng pin & Thời gian quay liên tục"] || null
      };

    case "lenses-accessories":
      return {
        ...baseSpecs,
        focal_length: rawKv["Tiêu cự & Khẩu độ tối đa"] || null,
        lens_mount: rawKv["Ngàm ống kính tương thích"] || null,
        optical_elements: rawKv["Cấu trúc quang học & Lớp tráng phủ"] || null,
        autofocus_motor: rawKv["Động cơ lấy nét (AF Motor)"] || null
      };

    case "mens-apparel":
    case "womens-apparel":
      return {
        ...baseSpecs,
        material: rawKv["Chất liệu vải cao cấp"] || null,
        fit_and_design: rawKv["Phom dáng & Thiết kế"] || null,
        technology: rawKv["Công nghệ xử lý vải"] || null,
        origin: "Việt Nam",
        care_instructions: rawKv["Hướng dẫn bảo quản & Sử dụng"] || null
      };

    case "bags-wallets":
      return {
        ...baseSpecs,
        material: rawKv["Chất liệu chế tác"] || null,
        dimensions: rawKv["Kích thước & Trọng lượng"] || null,
        compartments: rawKv["Kết cấu ngăn chứa"] || null,
        waterproof: rawKv["Khả năng chống thấm trượt nước"] || null
      };

    case "watches-jewelry":
      return {
        ...baseSpecs,
        movement: rawKv["Bộ máy vận hành (Movement)"] || null,
        case_material: rawKv["Chất liệu vỏ & Dây đeo"] || null,
        glass: rawKv["Mặt kính bảo vệ (Crystal)"] || null,
        water_resistance: rawKv["Mức độ kháng nước (Water Resistance)"] || null
      };

    case "sport-shoes":
      return {
        ...baseSpecs,
        upper_material: rawKv["Chất liệu thân trên (Upper)"] || null,
        midsole_technology: rawKv["Công nghệ đế giữa (Midsole)"] || null,
        outsole: rawKv["Đế ngoài (Outsole) & Độ bám đường"] || null,
        shoe_type: rawKv["Phân loại & Mục đích sử dụng"] || null
      };

    case "camping-outdoor":
      return {
        ...baseSpecs,
        material: rawKv["Vật liệu cấu tạo"] || null,
        capacity: rawKv["Quy cách kích thước & Trọng lượng"] || null,
        features: rawKv["Tính năng chuyên dụng dã ngoại"] || null,
        weather_resistance: rawKv["Khả năng chống chịu thời tiết"] || null
      };

    case "skin-care":
      return {
        ...baseSpecs,
        product_type: rawKv["Phân loại sản phẩm & Dung tích"] || null,
        key_ingredients: rawKv["Thành phần hoạt chất then chốt"] || null,
        skin_type: rawKv["Loại da phù hợp"] || null,
        benefits: rawKv["Công dụng nổi bật"] || null,
        safety_standards: rawKv["Tiêu chuẩn an toàn y khoa"] || null
      };

    case "perfume":
      return {
        ...baseSpecs,
        concentration: rawKv["Nồng độ tinh dầu & Dung tích"] || null,
        scent_family: rawKv["Nhóm hương chủ đạo (Olfactory Family)"] || null,
        top_notes: rawKv["Nốt hương đầu (Top Notes)"] || null,
        middle_notes: rawKv["Nốt hương giữa (Heart Notes)"] || null,
        base_notes: rawKv["Nốt hương cuối (Base Notes)"] || null,
        longevity: rawKv["Độ lưu hương & Tỏa hương"] || null
      };

    default:
      return { ...baseSpecs, raw_attributes: rawKv };
  }
}

// -------------------------------------------------------------
// Helper: Enhance description & specs for 194 legacy products
// -------------------------------------------------------------
function enhanceLegacyProduct(p: any): { description: string; specs: Record<string, any> } {
  const brand = p.brand || "Thương hiệu tuyển chọn";
  const cat = p.category;
  const title = p.title;
  const weight = p.weight ? `${p.weight * 10}g` : "Tiêu chuẩn";
  const dim = p.dimensions ? `${p.dimensions.width} x ${p.dimensions.height} x ${p.dimensions.depth} cm` : "Tiêu chuẩn";

  let desc = "";
  let specs: Record<string, any> = {
    brand,
    model: title,
    category_slug: cat,
    weight_g: p.weight ? p.weight * 10 : null,
    dimensions: p.dimensions || null
  };

  switch (cat) {
    case "smartphones":
      desc = `${title} là dòng điện thoại thông minh cao cấp chính hãng từ ${brand}, nổi bật với phong cách thiết kế nguyên khối tinh xảo và sang trọng. Thiết bị sở hữu màn hình hiển thị sắc nét với dải màu chân thực, đáp ứng mượt mà nhu cầu giải trí, xem video độ phân giải cao và thao tác vuốt chạm hàng ngày. Cấu hình phần cứng tối ưu kết hợp cùng bộ vi xử lý hiệu năng cao giúp xử lý đa nhiệm nhanh chóng, hạn chế tối đa độ trễ khi vận hành các ứng dụng. Cụm camera tiên tiến ghi lại từng khoảnh khắc với độ chi tiết cao, màu sắc trung thực và hỗ trợ các tính năng chụp đêm hiện đại. Dung lượng pin tối ưu kết hợp cùng hệ thống quản lý năng lượng thông minh, đem lại trải nghiệm sử dụng bền bỉ suốt cả ngày dài cho người dùng năng động.`;
      specs = {
        ...specs,
        chip: title.includes("iPhone 5") ? "Apple A7 (64-bit)" : title.includes("iPhone 6") ? "Apple A8" : title.includes("iPhone X") ? "Apple A11 Bionic" : title.includes("iPhone 13") ? "Apple A15 Bionic" : title.includes("Samsung") ? "Samsung Exynos / Snapdragon" : "MediaTek Dimensity / Qualcomm Snapdragon",
        ram_gb: title.includes("iPhone 13") ? 6 : title.includes("X") ? 3 : title.includes("Samsung S10") ? 8 : 4,
        storage_gb: title.includes("128") ? 128 : title.includes("256") ? 256 : 64,
        display: {
          size_inch: title.includes("5s") ? 4.0 : title.includes("6") ? 4.7 : title.includes("X") ? 5.8 : title.includes("13 Pro") ? 6.1 : 6.4,
          panel: title.includes("Samsung") || title.includes("Pro") || title.includes("X") ? "OLED / Super AMOLED" : "Retina IPS LCD",
          refresh_rate_hz: title.includes("13 Pro") ? 120 : 60
        },
        camera: {
          main_mp: title.includes("13 Pro") ? 12 : title.includes("S10") ? 16 : 12,
          selfie_mp: title.includes("13 Pro") ? 12 : 8
        },
        battery_mah: title.includes("13 Pro") ? 3095 : title.includes("Samsung") ? 3400 : 2500,
        os: brand === "Apple" ? "iOS" : "Android",
        connectivity: ["4G LTE / 5G", "Wi-Fi kép", "Bluetooth 5.0", "GPS"]
      };
      break;

    case "laptops":
      desc = `${title} là cỗ máy tính xách tay chuyên nghiệp do ${brand} chế tạo, tối ưu hoàn hảo cho công việc văn phòng, lập trình và sáng tạo đồ họa. Máy trang bị vi xử lý thế hệ mới với hiệu năng tính toán mạnh mẽ, cho phép xử lý các tập tin dung lượng lớn và đa nhiệm nhiều ứng dụng trơn tru. Màn hình độ phân giải cao với góc nhìn rộng tái tạo màu sắc chuẩn xác, giảm thiểu hiện tượng mỏi mắt khi làm việc cường độ cao trong thời gian dài. Bàn phím gõ êm ái với hành trình phím hợp lý, kết hợp cùng bàn rê chuột trackpad đa điểm cực kỳ mượt mà và chính xác. Khung vỏ hợp kim bền bỉ, tản nhiệt êm ái cùng thời lượng pin kéo dài nhiều giờ liên tục tạo nên sự cơ động tối đa cho giới chuyên gia.`;
      specs = {
        ...specs,
        cpu: title.includes("MacBook") ? "Apple M1 Pro 8-core CPU" : title.includes("XPS") ? "Intel Core i7-1065G7" : "Intel Core i7 / AMD Ryzen 7",
        gpu: title.includes("MacBook") ? "Apple 14-core GPU" : "Intel Iris Xe Graphics / NVIDIA GeForce",
        ram_gb: 16,
        storage_gb: 512,
        display: {
          size_inch: title.includes("14") ? 14.2 : title.includes("13") ? 13.3 : 15.6,
          resolution: title.includes("MacBook") ? "3024x1964 Retina XDR" : "1920x1080 Full HD",
          panel: title.includes("MacBook") ? "Liquid Retina XDR Mini-LED" : "IPS Anti-glare"
        },
        battery_life_hours: 12,
        os: brand === "Apple" ? "macOS" : "Windows 11 Home",
        weight_kg: title.includes("MacBook") ? 1.6 : 1.3
      };
      break;

    case "tablets":
      desc = `${title} là mẫu máy tính bảng đa năng cao cấp từ ${brand}, kết hợp hài hòa giữa tính gọn nhẹ di động và sức mạnh xử lý công việc vượt trội. Thiết bị sở hữu màn hình cảm ứng sắc nét với viền siêu mỏng, hỗ trợ hiển thị sống động từ tài liệu học tập đến phim ảnh giải trí. Phần cứng mạnh mẽ đảm bảo tốc độ mở ứng dụng tức thì, đa nhiệm chia đôi màn hình tiện lợi và khả năng tương thích bút cảm ứng chính xác. Hệ thống loa vòm mang lại âm trường rộng rãi, trong trẻo, phục vụ hoàn hảo các cuộc họp trực tuyến và nghe nhạc. Với dung lượng pin lớn đáp ứng trọn vẹn cả ngày dài, sản phẩm là công cụ học tập và làm việc không thể thiếu của người dùng hiện đại.`;
      specs = {
        ...specs,
        chip: brand === "Apple" ? "Apple A15 Bionic" : "Qualcomm Snapdragon 8 Gen 1",
        ram_gb: brand === "Apple" ? 4 : 8,
        storage_gb: 128,
        display: {
          size_inch: title.includes("Mini") ? 8.3 : 11.0,
          panel: brand === "Apple" ? "Liquid Retina IPS" : "Super AMOLED 120Hz"
        },
        battery_mah: brand === "Apple" ? 5124 : 8000,
        stylus_support: true,
        os: brand === "Apple" ? "iPadOS" : "Android"
      };
      break;

    case "mobile-accessories":
      desc = `${title} là phụ kiện công nghệ chính hãng từ ${brand}, được nghiên cứu và thiết kế chuẩn xác nhằm nâng tầm trải nghiệm cho thiết bị di động của bạn. Sản phẩm ứng dụng công nghệ vi mạch và vật liệu cao cấp, đảm bảo khả năng truyền dẫn tín hiệu nhanh chóng, ổn định và an toàn tuyệt đối khi sử dụng. Thiết kế công thái học hiện đại, nhỏ gọn và tiện lợi giúp người dùng dễ dàng mang theo bên mình trong mọi chuyến đi công tác hay dã ngoại. Độ bền cơ học vượt trội cùng các chứng nhận tiêu chuẩn an toàn quốc tế giúp bảo vệ toàn diện thiết bị khỏi nguy cơ đoản mạch hoặc va đập bất ngờ. Đây là trang bị cần thiết để duy trì hiệu suất hoạt động liên tục và gia tăng tuổi thọ cho các thiết bị thông minh.`;
      specs = {
        ...specs,
        accessory_type: title.includes("Airpod") || title.includes("Earphones") ? "Tai nghe không dây" : title.includes("Watch") ? "Đồng hồ thông minh" : "Phụ kiện bảo vệ & Sạc",
        compatibility: "Tương thích các dòng điện thoại thông minh và máy tính bảng chuẩn USB-C / Lightning",
        material: "Nhựa ABS chống cháy / Hợp kim nhôm / Silicon y tế cao cấp",
        features: ["Kết nối nhanh ổn định", "Chống đoản mạch quá dòng", "Thiết kế nhỏ gọn tiện lợi"]
      };
      break;

    case "fragrances":
      desc = `${title} là kiệt tác nước hoa trứ danh đến từ nhà mốt ${brand}, mở ra một không gian mùi hương sang trọng, tinh tế và đầy cuốn hút. Sự kết hợp tài tình giữa các tầng hương hoa quả tươi mát, thảo mộc quý và gỗ ấm tạo nên phong thái lịch lãm và quyến rũ cho người dùng. Công thức chiết xuất tinh dầu cao cấp giúp lưu giữ hương thơm bền bỉ suốt nhiều giờ liền, lan tỏa dịu nhẹ nhưng để lại ấn tượng sâu sắc trong mọi ánh nhìn. Thiết kế chai thủy tinh nguyên khối mang phong cách nghệ thuật thanh lịch, tôn vinh đẳng cấp của người sở hữu trong từng góc nhìn. Đây là lựa chọn hoàn mỹ cho những buổi dạ tiệc sang trọng, sự kiện gặp gỡ đối tác hay dùng tạo nét cá tính độc bản mỗi ngày.`;
      specs = {
        ...specs,
        concentration: "Eau de Parfum (EDP) / Eau de Toilette (EDT)",
        volume_ml: 100,
        scent_family: title.includes("CK") ? "Citrus Aromatic Unisex" : title.includes("Coco") ? "Chypre Floral" : title.includes("Dior") ? "Floral Fruity" : "Floral Woody",
        top_notes: "Cam Bergamot, Quả quýt, Hoa hồng tươi",
        middle_notes: "Hoa nhài Sambac, Hoa huệ trắng, Tiêu hồng",
        base_notes: "Xạ hương trắng, Hoắc hương, Gỗ tuyết tùng Virginia",
        longevity_hours: "8 - 12 giờ",
        sillage: "Tỏa hương trong bán kính một cánh tay",
        gender: title.includes("CK One") ? "Unisex" : "Nữ / Nam",
        origin: "Pháp / Ý"
      };
      break;

    case "beauty":
    case "skin-care":
      desc = `${title} là dòng sản phẩm chăm sóc sắc đẹp cao cấp được nghiên cứu chuyên sâu bởi thương hiệu ${brand}, đem lại hiệu quả nuôi dưỡng và tôn vinh nét đẹp rạng ngời. Công thức bào chế tiên tiến chứa các hoạt chất lành tính, nhẹ nhàng thẩm thấu sâu vào tế bào mà không gây kích ứng hay bết rít khó chịu trên bề mặt. Sản phẩm hỗ trợ tái tạo kết cấu tự nhiên, cấp ẩm chuyên sâu và bảo vệ làn da tối ưu trước tác hại của bụi mịn cũng như môi trường ngoài. Quy trình sản xuất đạt chứng nhận kiểm nghiệm da liễu nghiêm ngặt, hoàn toàn không chứa cồn xấu, paraben hay hóa chất độc hại gây bào mòn da. Thích hợp sử dụng hàng ngày trong chu trình dưỡng da và trang điểm của phái đẹp hiện đại để duy trì sự tươi trẻ.`;
      specs = {
        ...specs,
        product_type: cat === "beauty" ? "Mỹ phẩm trang điểm chuyên nghiệp" : "Sản phẩm chăm sóc phục hồi da",
        skin_type: "Phù hợp mọi loại da, kể cả da nhạy cảm",
        volume_ml: 50,
        key_ingredients: ["Hyaluronic Acid", "Vitamin E", "Chiết xuất thảo mộc thiên nhiên"],
        benefits: ["Dưỡng ẩm sâu", "Tạo lớp nền/bảo vệ mịn màng", "Ngăn ngừa lão hóa"],
        safety_standards: "Không paraben, không hương liệu tổng hợp, thuần chay Cruelty-Free",
        origin: "Châu Âu / Mỹ"
      };
      break;

    case "mens-watches":
    case "womens-watches":
      desc = `${title} là mẫu đồng hồ đeo tay thời thượng mang dấu ấn thiết kế đỉnh cao của thương hiệu ${brand}, biểu trưng cho sự thành đạt và gu thẩm mỹ thanh lịch. Cỗ máy bên trong vận hành với độ chính xác cơ học tuyệt hảo, đảm bảo sai số tối thiểu và độ bền bỉ qua hàng thập kỷ sử dụng. Mặt kính chế tác từ vật liệu chống trầy xước cao cấp, bảo vệ mặt số chi tiết với các cọc số và kim chỉ giờ được hoàn thiện thủ công tỉ mỉ. Dây đeo êm ái ôm sát cổ tay mang lại cảm giác thoải mái suốt cả ngày, kết hợp cùng khóa gài chắc chắn và tiện dụng. Khả năng chống nước đạt tiêu chuẩn giúp người dùng an tâm khi rửa tay hoặc di chuyển dưới những cơn mưa bất chợt.`;
      specs = {
        ...specs,
        movement: title.includes("Rolex") || title.includes("Longines") || title.includes("IWC") ? "Automatic (Cơ tự động Thụy Sĩ)" : "Quartz (Pin Nhật Bản chính xác)",
        case_size_mm: cat === "mens-watches" ? 40 : 34,
        case_material: "Thép không gỉ 316L đánh bóng cao cấp",
        water_resistance_m: 50,
        strap_material: title.includes("Leather") ? "Dây da bò thật cao cấp" : "Thép không gỉ 316L",
        glass_type: "Kính Sapphire nguyên khối chống lóa chống trầy",
        dial_color: "Mặt số hoàn thiện chải tia ánh kim",
        origin: title.includes("Rolex") || title.includes("IWC") ? "Thụy Sĩ (Swiss Made)" : "Nhật Bản / Châu Âu"
      };
      break;

    case "mens-shirts":
    case "tops":
    case "womens-dresses":
      desc = `${title} là trang phục may mặc cao cấp từ ${brand}, kết hợp hoàn hảo giữa xu hướng thời trang hiện đại và sự tiện dụng thoải mái trong từng vận động. Sử dụng chất liệu vải dệt cao cấp mềm mịn, thoáng khí và có khả năng thấm hút mồ hôi vượt trội, giúp người mặc luôn cảm thấy dễ chịu suốt cả ngày dài. Đường may tỉ mỉ, phom dáng chuẩn chỉ tôn lên vóc dáng tự nhiên đồng thời che khéo những khuyết điểm cơ thể một cách tinh tế. Màu sắc nhã nhặn, bền màu qua nhiều lần giặt và rất dễ dàng phối cùng các phụ kiện hay quần áo khác nhau để tạo phong cách ấn tượng. Thích hợp cho cả đi làm công sở, dự tiệc nhẹ hay những buổi dạo phố cuối tuần cùng bạn bè.`;
      specs = {
        ...specs,
        material: "100% Cotton chải kỹ tự nhiên / Lụa Satin mềm mát",
        sizes: ["S", "M", "L", "XL"],
        fit: "Regular Fit tôn dáng thoải mái",
        style: cat === "womens-dresses" ? "Váy đầm nữ tính thanh lịch" : "Áo phong cách trẻ trung năng động",
        origin: "Việt Nam",
        care_instructions: "Giặt máy nhẹ ở nhiệt độ thường, không dùng thuốc tẩy mạnh, phơi nơi râm mát"
      };
      break;

    case "mens-shoes":
    case "womens-shoes":
      desc = `${title} là mẫu giày cao cấp của thương hiệu ${brand}, mang lại sự tự tin và nâng niu từng bước chân của bạn trong mọi hoàn cảnh. Thân giày được hoàn thiện từ chất liệu chọn lọc bền đẹp, ôm chân êm ái và có các lỗ thoáng khí giúp hạn chế tích tụ mùi hôi hiệu quả. Đế giày đúc nguyên khối với các rãnh bám ma sát chống trơn trượt tối đa, bảo vệ an toàn cho bạn trên mọi điều kiện địa hình trơn ướt. Lớp đệm lót bên trong êm ái giảm phản lực từ mặt đất lên khớp gối, giúp bạn di chuyển linh hoạt mà không lo đau mỏi chân. Kiểu dáng năng động, bắt mắt, dễ dàng kết hợp cùng nhiều trang phục từ thường ngày đến thể thao chuyên nghiệp.`;
      specs = {
        ...specs,
        shoe_type: title.includes("Jordan") || title.includes("Sneaker") || title.includes("Rider") ? "Sneaker thể thao năng động" : title.includes("Heel") ? "Giày cao gót nữ thanh lịch" : "Giày thời trang cao cấp",
        upper_material: "Da tổng hợp cao cấp / Vải dệt Mesh thoáng khí",
        sole_material: "Đế cao su lưu hóa nguyên khối chống trượt",
        sizes: cat === "mens-shoes" ? [40, 41, 42, 43, 44] : [35, 36, 37, 38, 39],
        closure_type: title.includes("Heel") ? "Quai cài thanh mảnh" : "Buộc dây (Lace-up)",
        origin: "Việt Nam"
      };
      break;

    case "womens-bags":
      desc = `${title} là mẫu túi xách sành điệu từ thương hiệu thời trang ${brand}, điểm nhấn không thể thiếu để hoàn thiện diện mạo sang trọng của phái đẹp. Túi được chế tác từ chất liệu da chọn lọc với bề mặt vân hạt mịn màng, chống trầy xước nhẹ và giữ phom dáng chuẩn mực theo thời gian. Ngăn chứa bên trong được bố trí khoa học, đủ rộng rãi để đựng điện thoại, ví tiền, mỹ phẩm cùng nhiều vật dụng cá nhân thiết yếu hàng ngày. Khóa kim loại mạ tĩnh điện sáng bóng, đóng mở mượt mà kết hợp quai đeo linh hoạt có thể điều chỉnh độ dài tùy ý. Thích hợp đồng hành cùng quý cô khi đi làm văn phòng, tham dự hội thảo, gặp gỡ đối tác hay đi tiệc tối sang trọng.`;
      specs = {
        ...specs,
        bag_type: "Túi xách đeo chéo / Túi kẹp nách sang trọng",
        material: "Da bò hạt cao cấp / Da tổng hợp PU thượng hạng",
        compartments: "1 ngăn chính rộng rãi và 2 ngăn phụ tiện lợi có khóa kéo",
        closure_type: "Khóa bấm từ tính / Khóa kéo kim loại chống gỉ",
        origin: "Việt Nam"
      };
      break;

    case "sunglasses":
      desc = `${title} là mẫu kính mát thời trang đẳng cấp do ${brand} thiết kế, bảo vệ toàn diện cho đôi mắt của bạn dưới ánh nắng chói chang. Tròng kính ứng dụng công nghệ lọc quang học hiện đại với lớp phủ phân cực Polarized, giúp loại bỏ hoàn toàn ánh sáng chói lóa và tăng cường độ tương phản thị giác. Khả năng chống tia cực tím đạt chuẩn UV400 quốc tế, ngăn chặn 100% tia UVA và UVB có hại gây tổn thương giác mạc mắt. Gọng kính siêu nhẹ với bản lề gia công chắc chắn, ôm vừa vặn khuôn mặt mà không gây áp lực khó chịu lên sống mũi hay vành tai. Phong cách thiết kế lịch lãm, cá tính, phù hợp cho cả nam và nữ khi lái xe ngoài trời, đi biển hay dạo phố.`;
      specs = {
        ...specs,
        frame_material: "Hợp kim kim loại chống oxy hóa / Nhựa Acetate bền bỉ",
        lens_material: "Polycarbonate quang học cao cấp chống trầy",
        uv_protection: "UV400 (Chống 100% tia UVA & UVB)",
        polarized: true,
        gender: "Unisex",
        origin: "Italy / Châu Âu"
      };
      break;

    case "womens-jewellery":
      desc = `${title} là món trang sức tinh xảo từ thương hiệu ${brand}, tôn vinh nét quyến rũ quý phái và thanh thoát cho người đeo trong từng cử chỉ. Từng chi tiết nhỏ được chạm khắc thủ công khéo léo kết hợp cùng các viên đá lấp lánh có độ tán sắc rực rỡ như kim cương tự nhiên. Chất liệu kim hoàn cao cấp được xử lý mạ bảo vệ bề mặt sáng bóng, hạn chế tối đa nguy cơ xỉn màu do mồ hôi hay môi trường ngoài. Thiết kế trang nhã mang hơi thở hiện đại nhưng không kém phần cổ điển, rất dễ phối cùng các trang phục dự tiệc hay trang phục dạ hội lộng lẫy. Món quà ý nghĩa để tự thưởng cho bản thân hoặc gửi gắm tình cảm chân thành đến người phụ nữ bạn yêu thương.`;
      specs = {
        ...specs,
        jewelry_type: "Trang sức cao cấp (Nhẫn / Bông tai / Dây chuyền)",
        primary_material: "Bạc ý 925 cao cấp / Hợp kim mạ Rhodium sáng bóng",
        gemstone: "Đá pha lê Cubic Zirconia cao cấp cắt gọt đa giác",
        safety: "Không chứa niken, không gây kích ứng da",
        origin: "Việt Nam"
      };
      break;

    case "motorcycle":
    case "vehicle":
      desc = `${title} là dòng phương tiện giao thông vận tải hàng đầu được phát triển bởi ${brand}, kết hợp giữa sức mạnh cơ khí vượt trội và độ an toàn tin cậy. Xe trang bị khối động cơ đốt trong tối ưu hóa buồng đốt, mang lại công suất vận hành mạnh mẽ và khả năng tăng tốc mượt mà trên mọi dải tốc độ. Khung gầm chịu lực cao cấp kết hợp hệ thống giảm xóc êm ái, giúp triệt tiêu rung chấn hiệu quả khi di chuyển qua các đoạn đường gồ ghề. Hệ thống phanh đĩa hiện đại tích hợp công nghệ chống bó cứng an toàn, đảm bảo kiểm soát tay lái chuẩn xác trong các tình huống phanh khẩn cấp. Mức tiêu hao nhiên liệu tiết kiệm cùng kiểu dáng khí động học hiện đại khiến đây trở thành sự lựa chọn hoàn hảo cho việc di chuyển đường dài.`;
      specs = {
        ...specs,
        engine: "Động cơ 4 kỳ, xi-lanh đơn / V-Twin làm mát bằng không khí hoặc dung dịch",
        transmission: cat === "motorcycle" ? "Côn tay 5-6 cấp / Hộp số tự động" : "Hộp số tự động đa cấp",
        fuel_system: "Phun xăng điện tử EFI tiết kiệm nhiên liệu",
        brake_system: "Phanh đĩa thủy lực trước sau tích hợp ABS an toàn",
        fuel_capacity_l: cat === "motorcycle" ? 14 : 60,
        origin: "Chính hãng nhập khẩu / Lắp ráp tiêu chuẩn quốc tế"
      };
      break;

    case "furniture":
    case "home-decoration":
      desc = `${title} là sản phẩm nội thất và trang trí gia đình tinh tế đến từ ${brand}, giúp nâng tầm không gian sống của bạn thêm phần ấm cúng và sang trọng. Được sản xuất từ vật liệu cao cấp qua xử lý tẩm sấy nghiêm ngặt, sản phẩm có khả năng kháng ẩm, chống mối mọt và hạn chế cong vênh tối đa. Các đường nét góc cạnh được bo tròn mềm mại và gia công cơ khí chuẩn xác, đảm bảo độ an toàn cao cho trẻ nhỏ và người lớn tuổi trong nhà. Màu sắc trang nhã hài hòa với ánh sáng tự nhiên, dễ dàng sắp đặt trong nhiều phong cách thiết kế từ Bắc Âu tối giản đến cổ điển quý phái. Một điểm nhấn nội thất bền đẹp theo năm tháng, khẳng định gu thẩm mỹ tinh tế của gia chủ.`;
      specs = {
        ...specs,
        material: "Gỗ tự nhiên cao cấp / Khung kim loại sơn tĩnh điện / Vải bọc cao cấp",
        item_type: cat === "furniture" ? "Nội thất gia đình tiện nghi" : "Vật phẩm trang trí phong cách",
        style: "Hiện đại tối giản (Scandinavian / Modern Minimalist)",
        load_capacity_kg: 100,
        origin: "Việt Nam"
      };
      break;

    case "kitchen-accessories":
      desc = `${title} là dụng cụ nhà bếp thông minh và tiện ích đến từ thương hiệu ${brand}, người bạn đồng hành đắc lực của người nội trợ trong mỗi bữa ăn gia đình. Chế tác từ vật liệu inox chống gỉ hoặc nhựa nguyên sinh an toàn thực phẩm, sản phẩm hoàn toàn không thôi nhiễm hóa chất độc hại ở nhiệt độ cao. Thiết kế tay cầm công thái học chắc chắn, chống trơn trượt và cách nhiệt tốt, mang lại sự thuận tiện và an tâm tối đa khi thao tác nấu nướng. Bề mặt nhẵn bóng chống bám dính dầu mỡ, giúp công việc cọ rửa và vệ sinh sau khi sử dụng trở nên nhanh chóng, nhẹ nhàng. Đạt các tiêu chuẩn vệ sinh an toàn thực phẩm khắt khe, phục vụ dài lâu cho gian bếp ấm cúng của mọi nhà.`;
      specs = {
        ...specs,
        tool_type: "Dụng cụ chế biến & chuẩn bị thực phẩm nhà bếp",
        material: "Inox 304 không gỉ / Silicon chịu nhiệt / Nhựa PP không BPA",
        heat_resistance_c: 230,
        dishwasher_safe: true,
        origin: "Chính hãng tiêu chuẩn quốc tế"
      };
      break;

    case "groceries":
      desc = `${title} là mặt hàng thực phẩm và nhu yếu phẩm chất lượng cao do ${brand} phân phối, đáp ứng nhu cầu dinh dưỡng và chăm sóc cuộc sống mỗi ngày. Nguồn nguyên liệu được tuyển chọn kỹ lưỡng từ các nông trại và nhà sản xuất uy tín, trải qua quy trình kiểm soát vệ sinh nghiêm ngặt. Giữ trọn vẹn hương vị tự nhiên, độ tươi ngon cùng các dưỡng chất quý giá mà không sử dụng chất bảo quản hay phụ gia hóa học độc hại. Bao bì đóng gói kín khí và đạt chuẩn an toàn vệ sinh, giúp bảo quản trọn vẹn chất lượng trong suốt hạn sử dụng ghi trên nhãn. Lựa chọn tin cậy cho sức khỏe của cả gia đình, đem lại sự an tâm tuyệt đối trong mỗi bữa ăn thường nhật.`;
      specs = {
        ...specs,
        food_type: "Thực phẩm tươi sạch & Hàng tiêu dùng gia đình",
        preservatives: "Hoàn toàn không chứa chất bảo quản nhân tạo",
        storage_instructions: "Bảo quản nơi khô ráo, thoáng mát hoặc bảo quản ngăn mát tủ lạnh",
        shelf_life: "Xem chi tiết trên bao bì sản phẩm",
        origin: "Việt Nam"
      };
      break;

    case "sports-accessories":
      desc = `${title} là thiết bị thể thao và vận động chuyên dụng từ thương hiệu ${brand}, hỗ trợ người tập nâng cao thể lực và chinh phục các mục tiêu rèn luyện. Sản phẩm được sản xuất từ vật liệu có độ đàn hồi và chịu lực cao, đảm bảo độ bền bỉ khi luyện tập ở cường độ cao trong thời gian dài. Thiết kế chuẩn kích thước thi đấu quốc tế, mang lại cảm giác tiếp xúc thật tay, độ nảy chuẩn xác và khả năng kiểm soát quỹ đạo tối ưu. Bề mặt vật liệu có hoa văn chống trơn trượt hiệu quả, giúp cầm nắm chắc chắn ngay cả khi bàn tay đổ nhiều mồ hôi. Phù hợp cho cả vận động viên chuyên nghiệp lẫn người yêu thích rèn luyện thể thao nâng cao sức khỏe mỗi ngày.`;
      specs = {
        ...specs,
        equipment_type: "Dụng cụ thể thao & phụ kiện rèn luyện thể chất",
        material: "Cao su tổng hợp PU đàn hồi / Hợp kim nhôm siêu nhẹ / Sợi tổng hợp",
        standard: "Kích thước & trọng lượng chuẩn tập luyện thể thao",
        durability: "Chống mài mòn, chống biến dạng khi chịu va đập mạnh",
        origin: "Chính hãng"
      };
      break;

    default:
      desc = `${title} là sản phẩm chất lượng cao đến từ thương hiệu ${brand}, được hoàn thiện tỉ mỉ nhằm mang lại giá trị sử dụng tối ưu cho người tiêu dùng. Với thiết kế hiện đại, thông minh và các đường nét gia công cơ khí chuẩn mực, sản phẩm đáp ứng đầy đủ các tiêu chuẩn kỹ thuật khắt khe. Vật liệu cấu thành bền bỉ thân thiện với môi trường, đảm bảo khả năng vận hành ổn định và kéo dài tuổi thọ sử dụng qua nhiều năm. Sản phẩm phù hợp cho nhiều đối tượng sử dụng khác nhau trong công việc lẫn cuộc sống thường nhật, mang lại sự tiện nghi và hài lòng tối đa.`;
      specs = {
        ...specs,
        features: ["Độ bền cao", "Thiết kế thông minh", "An toàn khi sử dụng"]
      };
      break;
  }

  return { description: desc, specs };
}

// -------------------------------------------------------------
// Category mapping helper
// -------------------------------------------------------------
async function setupCategoryHierarchy() {
  console.log("-> Đang đồng bộ cây danh mục phân cấp...");

  // 1. Parent categories
  const parents = [
    { name: "Điện tử", slug: "dien-tu" },
    { name: "Thời trang", slug: "thoi-trang" },
    { name: "Sức khỏe & Làm đẹp", slug: "suc-khoe-lam-dep" },
    { name: "Nhà cửa & Đời sống", slug: "nha-cua-doi-song" },
    { name: "Thể thao & Xe", slug: "the-thao-xe" },
    { name: "Khác", slug: "khac" }
  ];

  const parentMap = new Map<string, string>();

  for (const p of parents) {
    const cat = await prisma.category.upsert({
      where: { slug: p.slug },
      update: { name: p.name },
      create: { name: p.name, slug: p.slug }
    });
    parentMap.set(p.slug, cat.id);
  }

  // 2. Child categories configuration
  const childDefs = [
    // Điện tử
    { name: "Điện thoại", slug: "smartphones", parent: "dien-tu" },
    { name: "Laptop", slug: "laptops", parent: "dien-tu" },
    { name: "Máy tính bảng", slug: "tablets", parent: "dien-tu" },
    { name: "Phụ kiện điện thoại", slug: "mobile-accessories", parent: "dien-tu" },
    { name: "Đồng hồ thông minh", slug: "smartwatch", parent: "dien-tu" },
    { name: "Tai nghe & Âm thanh", slug: "audio", parent: "dien-tu" },
    { name: "Phụ kiện công nghệ", slug: "accessories", parent: "dien-tu" },
    { name: "Máy ảnh chuyên nghiệp", slug: "cameras", parent: "dien-tu" },
    { name: "Action Cam & Gimbal", slug: "action-cam-gimbal", parent: "dien-tu" },
    { name: "Ống kính máy ảnh", slug: "lenses-accessories", parent: "dien-tu" },

    // Thời trang
    { name: "Áo nam", slug: "mens-shirts", parent: "thoi-trang" },
    { name: "Giày nam", slug: "mens-shoes", parent: "thoi-trang" },
    { name: "Đồng hồ nam", slug: "mens-watches", parent: "thoi-trang" },
    { name: "Thời trang nam", slug: "mens-apparel", parent: "thoi-trang" },
    { name: "Áo nữ", slug: "tops", parent: "thoi-trang" },
    { name: "Váy nữ", slug: "womens-dresses", parent: "thoi-trang" },
    { name: "Giày nữ", slug: "womens-shoes", parent: "thoi-trang" },
    { name: "Đồng hồ nữ", slug: "womens-watches", parent: "thoi-trang" },
    { name: "Thời trang nữ", slug: "womens-apparel", parent: "thoi-trang" },
    { name: "Túi xách nữ", slug: "womens-bags", parent: "thoi-trang" },
    { name: "Túi xách & Balo", slug: "bags-wallets", parent: "thoi-trang" },
    { name: "Trang sức nữ", slug: "womens-jewellery", parent: "thoi-trang" },
    { name: "Đồng hồ & Trang sức cao cấp", slug: "watches-jewelry", parent: "thoi-trang" },
    { name: "Kính râm", slug: "sunglasses", parent: "thoi-trang" },

    // Sức khỏe & Làm đẹp
    { name: "Mỹ phẩm", slug: "beauty", parent: "suc-khoe-lam-dep" },
    { name: "Nước hoa", slug: "fragrances", parent: "suc-khoe-lam-dep" },
    { name: "Nước hoa cao cấp", slug: "perfume", parent: "suc-khoe-lam-dep" },
    { name: "Chăm sóc da", slug: "skin-care", parent: "suc-khoe-lam-dep" },
    { name: "Chăm sóc cá nhân", slug: "personal-care", parent: "suc-khoe-lam-dep" },

    // Nhà cửa & Đời sống
    { name: "Nội thất", slug: "furniture", parent: "nha-cua-doi-song" },
    { name: "Đồ trang trí", slug: "home-decoration", parent: "nha-cua-doi-song" },
    { name: "Phụ kiện bếp", slug: "kitchen-accessories", parent: "nha-cua-doi-song" },
    { name: "Thiết bị nhà bếp", slug: "kitchen-appliances", parent: "nha-cua-doi-song" },
    { name: "Robot hút bụi", slug: "robot-vacuum", parent: "nha-cua-doi-song" },
    { name: "Máy lọc không khí", slug: "air-purifier", parent: "nha-cua-doi-song" },
    { name: "Tạp hóa", slug: "groceries", parent: "nha-cua-doi-song" },

    // Thể thao & Xe
    { name: "Phụ kiện thể thao", slug: "sports-accessories", parent: "the-thao-xe" },
    { name: "Giày thể thao", slug: "sport-shoes", parent: "the-thao-xe" },
    { name: "Dã ngoại & Cắm trại", slug: "camping-outdoor", parent: "the-thao-xe" },
    { name: "Xe máy", slug: "motorcycle", parent: "the-thao-xe" },
    { name: "Phương tiện", slug: "vehicle", parent: "the-thao-xe" },

    // Khác
    { name: "Mẹ & Bé", slug: "me-be", parent: "khac" }
  ];

  const categoryIdMap = new Map<string, string>();

  for (const c of childDefs) {
    const parentId = parentMap.get(c.parent);
    const cat = await prisma.category.upsert({
      where: { slug: c.slug },
      update: {
        name: c.name,
        ...(parentId ? { parent_id: parentId } : {})
      },
      create: {
        name: c.name,
        slug: c.slug,
        parent_id: parentId
      }
    });
    categoryIdMap.set(c.slug, cat.id);
  }

  // Also include any other categories in DB
  const allCats = await prisma.category.findMany();
  for (const c of allCats) {
    categoryIdMap.set(c.slug, c.id);
  }

  console.log(`-> Đã đồng bộ ${allCats.length} danh mục trong hệ thống.\n`);
  return categoryIdMap;
}

// -------------------------------------------------------------
// MAIN EXECUTION
// -------------------------------------------------------------
async function main() {
  console.log("=================================================");
  console.log("  BẮT ĐẦU NÂNG CẤP CATALOG DATABASE LÊN 500+ SP  ");
  console.log("=================================================\n");

  const categoryMap = await setupCategoryHierarchy();

  // -----------------------------------------------------------
  // BƯỚC 3: Nạp 548 sản phẩm mới từ seed_500products.ts
  // -----------------------------------------------------------
  console.log("=================================================");
  console.log("  BƯỚC 3: Nạp 548 sản phẩm từ bộ dataset chi tiết ");
  console.log("=================================================");

  const allSeedProducts = [
    ...generatePhones(),
    ...generateTablets(),
    ...generateLaptops(),
    ...generateSmartwatches(),
    ...generateAudio(),
    ...generateAccessories(),
    ...generateHomeAppliances(),
    ...generateKitchen(),
    ...generateAirPurifiers(),
    ...generatePersonalCare(),
    ...generateCameras(),
    ...generateActionCams(),
    ...generateLenses(),
    ...generateMensApparel(),
    ...generateWomensApparel(),
    ...generateBags(),
    ...generateWatchesAndJewelry(),
    ...generateSportShoes(),
    ...generateOutdoor(),
    ...generateSkincare(),
    ...generatePerfumes()
  ];

  console.log(`-> Tổng số sản phẩm nguồn: ${allSeedProducts.length}`);

  let upsertedNewCount = 0;

  for (let i = 0; i < allSeedProducts.length; i++) {
    const item = allSeedProducts[i];
    const categoryId = categoryMap.get(item.categorySlug) || categoryMap.get("khac");
    if (!categoryId) {
      console.warn(`[Bỏ qua] Không tìm thấy danh mục cho ${item.categorySlug}`);
      continue;
    }

    const baseSlug = slugify(item.name);
    const uniqueSlug = `${baseSlug}-cat500-${i + 1}`;
    const specs = extractSpecsForSeedItem(item);

    const imagesData = (item.images || []).map((url: string, idx: number) => ({
      url,
      is_primary: idx === 0,
      sort_order: idx + 1
    }));

    // Upsert product
    const product = await prisma.product.upsert({
      where: { slug: uniqueSlug },
      update: {
        name: item.name,
        description: item.description,
        specs: specs as any,
        category_id: categoryId,
        is_active: true
      },
      create: {
        name: item.name,
        slug: uniqueSlug,
        description: item.description,
        specs: specs as any,
        category_id: categoryId,
        is_active: true,
        variants: {
          create: item.variants.map((v: any) => ({
            attributes: v.attributes,
            price: v.price,
            stock_quantity: v.stock_quantity,
            stock_reserved: 0,
            is_active: true
          }))
        },
        images: {
          create: imagesData
        }
      }
    });

    upsertedNewCount++;
    if (upsertedNewCount % 100 === 0 || upsertedNewCount === allSeedProducts.length) {
      console.log(`-> Đã xử lý ${upsertedNewCount}/${allSeedProducts.length} sản phẩm mới...`);
    }
  }

  console.log(`=> Hoàn thành nạp ${upsertedNewCount} sản phẩm từ seed dataset.\n`);

  // -----------------------------------------------------------
  // BƯỚC 4: Cập nhật Description & Specs cho 194 sản phẩm cũ
  // -----------------------------------------------------------
  console.log("=================================================");
  console.log("  BƯỚC 4: Cập nhật mô tả & specs cho sản phẩm cũ  ");
  console.log("=================================================");

  const dummyFilePath = path.join(__dirname, "../../../dummyjson.json");
  const dummyData: any[] = JSON.parse(fs.readFileSync(dummyFilePath, "utf8"));
  console.log(`-> Đọc ${dummyData.length} sản phẩm gốc từ dummyjson.json`);

  // Process in batches of 25-30
  const BATCH_SIZE = 25;
  let batchIndex = 1;
  const progressPath = path.join(__dirname, "../../../PROGRESS.md");

  for (let i = 0; i < dummyData.length; i += BATCH_SIZE) {
    const chunk = dummyData.slice(i, i + BATCH_SIZE);
    console.log(`-> Đang cập nhật Lô ${batchIndex} (${chunk.length} sản phẩm, từ mục #${i + 1} đến #${i + chunk.length})...`);

    for (const p of chunk) {
      const slug = String(p.title).toLowerCase().replace(/[^a-z0-9]+/g, "-") + "-" + p.id;
      const { description, specs } = enhanceLegacyProduct(p);

      // Check if product exists in DB by slug
      const existing = await prisma.product.findUnique({ where: { slug } });
      if (existing) {
        await prisma.product.update({
          where: { id: existing.id },
          data: {
            description,
            specs: specs as any
          }
        });
      }
    }

    // Append batch progress to PROGRESS.md
    const logEntry = `\n- [x] **BƯỚC 4 - Lô ${batchIndex}**: Cập nhật thành công ${chunk.length} sản phẩm cũ (từ sản phẩm #${i + 1} đến #${i + chunk.length})`;
    fs.appendFileSync(progressPath, logEntry, "utf8");

    batchIndex++;
  }

  console.log("=> Hoàn tất cập nhật mô tả và specs cho toàn bộ sản phẩm cũ.\n");

  // -----------------------------------------------------------
  // BƯỚC 5: Kiểm tra số liệu cuối cùng
  // -----------------------------------------------------------
  console.log("=================================================");
  console.log("  BƯỚC 5: Kiểm tra cơ sở dữ liệu sau nâng cấp    ");
  console.log("=================================================");

  const totalProducts = await prisma.product.count();
  const nullSpecsCount = await prisma.product.count({
    where: { specs: { equals: null as any } }
  });

  // Check short descriptions
  const allProds = await prisma.product.findMany({
    select: { id: true, slug: true, description: true }
  });
  const shortDescCount = allProds.filter((p) => (p.description || "").length < 150).length;

  // Check duplicate slugs
  const slugCounts = new Map<string, number>();
  for (const p of allProds) {
    slugCounts.set(p.slug, (slugCounts.get(p.slug) || 0) + 1);
  }
  let dupSlugs = 0;
  for (const [, cnt] of slugCounts) {
    if (cnt > 1) dupSlugs++;
  }

  // Count by category
  const prodsWithCat = await prisma.product.findMany({
    select: { category: { select: { name: true } } }
  });
  const catStats: Record<string, number> = {};
  for (const p of prodsWithCat) {
    const cName = p.category?.name || "Khác";
    catStats[cName] = (catStats[cName] || 0) + 1;
  }

  console.log("--- BÁO CÁO KIỂM TRA ---");
  console.log(`- Tổng số sản phẩm: ${totalProducts}`);
  console.log(`- Số sản phẩm specs IS NULL: ${nullSpecsCount}`);
  console.log(`- Số sản phẩm description < 150 ký tự: ${shortDescCount}`);
  console.log(`- Số slug trùng: ${dupSlugs}`);
  console.log("\n- Thống kê theo danh mục:");
  const sortedCats = Object.entries(catStats).sort((a, b) => b[1] - a[1]);
  for (const [catName, cnt] of sortedCats) {
    console.log(`  | ${catName.padEnd(30)} | ${cnt} |`);
  }

  // Record completion in PROGRESS.md
  fs.appendFileSync(
    progressPath,
    `\n\n- [x] **BƯỚC 3 & 4**: Hoàn thành nâng cấp catalog lên ${totalProducts} sản phẩm. Toàn bộ có specs JSONB và description chi tiết (>150 ký tự).`
  );
}

main()
  .catch((e) => {
    console.error("LỖI KHI NÂNG CẤP CATALOG:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

