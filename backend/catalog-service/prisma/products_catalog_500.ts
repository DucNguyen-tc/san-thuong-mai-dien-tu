import { TECH_IMAGES } from './dataset_data';

export interface ProductSeedItem {
  name: string;
  categorySlug: string;
  brand: string;
  price: number;
  description: string;
  images: string[];
  variants: {
    attributes: Record<string, any>;
    price: number;
    stock_quantity: number;
  }[];
}

// ==========================================
// 1. SMARTPHONES & TABLETS (55 PRODUCTS)
// ==========================================
const phoneModels = [
  { name: 'Apple iPhone 16 Pro Max 256GB', brand: 'Apple', model: 'A3296', chip: 'Apple A18 Pro (3nm)', gpu: 'Apple 6-core GPU', ram: '8GB', rom: '256GB', screen: '6.9" Super Retina XDR OLED 120Hz ProMotion', brightness: '2000', camBack: '48MP Fusion + 48MP Ultra Wide + 12MP 5x Telephoto', camFront: '12MP TrueDepth', battery: '4685', charge: '30W dây, 25W MagSafe', ip: 'IP68', weight: '227', price: 34990000, colors: ['Titan Sa Mạc', 'Titan Tự Nhiên', 'Titan Trắng', 'Titan Đen'], img: TECH_IMAGES.iphone_titan },
  { name: 'Apple iPhone 16 Pro 128GB', brand: 'Apple', model: 'A3293', chip: 'Apple A18 Pro (3nm)', gpu: 'Apple 6-core GPU', ram: '8GB', rom: '128GB', screen: '6.3" Super Retina XDR OLED 120Hz ProMotion', brightness: '2000', camBack: '48MP Fusion + 48MP Ultra Wide + 12MP 5x Telephoto', camFront: '12MP TrueDepth', battery: '3582', charge: '27W dây, 25W MagSafe', ip: 'IP68', weight: '199', price: 28990000, colors: ['Titan Sa Mạc', 'Titan Tự Nhiên', 'Titan Đen'], img: TECH_IMAGES.iphone_titan },
  { name: 'Apple iPhone 16 128GB', brand: 'Apple', model: 'A3287', chip: 'Apple A18 (3nm)', gpu: 'Apple 5-core GPU', ram: '8GB', rom: '128GB', screen: '6.1" Super Retina XDR OLED 60Hz', brightness: '2000', camBack: '48MP Fusion + 12MP Ultra Wide', camFront: '12MP TrueDepth', battery: '3561', charge: '25W dây, 25W MagSafe', ip: 'IP68', weight: '170', price: 21990000, colors: ['Xanh Lưu Ly', 'Xanh Mòng Két', 'Hồng', 'Trắng', 'Đen'], img: TECH_IMAGES.iphone_black },
  { name: 'Apple iPhone 16 Plus 128GB', brand: 'Apple', model: 'A3290', chip: 'Apple A18 (3nm)', gpu: 'Apple 5-core GPU', ram: '8GB', rom: '128GB', screen: '6.7" Super Retina XDR OLED 60Hz', brightness: '2000', camBack: '48MP Fusion + 12MP Ultra Wide', camFront: '12MP TrueDepth', battery: '4674', charge: '27W dây, 25W MagSafe', ip: 'IP68', weight: '199', price: 24990000, colors: ['Xanh Lưu Ly', 'Hồng', 'Đen'], img: TECH_IMAGES.iphone_black },
  { name: 'Apple iPhone 15 Pro Max 256GB', brand: 'Apple', model: 'A3106', chip: 'Apple A17 Pro (3nm)', gpu: 'Apple 6-core GPU', ram: '8GB', rom: '256GB', screen: '6.7" Super Retina XDR OLED 120Hz', brightness: '2000', camBack: '48MP + 12MP + 12MP 5x Tele', camFront: '12MP', battery: '4422', charge: '27W dây, 15W MagSafe', ip: 'IP68', weight: '221', price: 29490000, colors: ['Titan Tự Nhiên', 'Titan Xanh', 'Titan Đen'], img: TECH_IMAGES.iphone_titan },
  { name: 'Apple iPhone 15 Pro 128GB', brand: 'Apple', model: 'A3102', chip: 'Apple A17 Pro (3nm)', gpu: 'Apple 6-core GPU', ram: '8GB', rom: '128GB', screen: '6.1" Super Retina XDR OLED 120Hz', brightness: '2000', camBack: '48MP + 12MP + 12MP 3x Tele', camFront: '12MP', battery: '3274', charge: '25W dây, 15W MagSafe', ip: 'IP68', weight: '187', price: 24690000, colors: ['Titan Tự Nhiên', 'Titan Trắng', 'Titan Đen'], img: TECH_IMAGES.iphone_titan },
  { name: 'Apple iPhone 15 128GB', brand: 'Apple', model: 'A3090', chip: 'Apple A16 Bionic (4nm)', gpu: 'Apple 5-core GPU', ram: '6GB', rom: '128GB', screen: '6.1" Super Retina XDR OLED', brightness: '2000', camBack: '48MP + 12MP Ultra Wide', camFront: '12MP', battery: '3349', charge: '20W dây', ip: 'IP68', weight: '171', price: 18990000, colors: ['Xanh lá', 'Hồng', 'Vàng', 'Đen'], img: TECH_IMAGES.iphone_black },
  { name: 'Apple iPhone 14 Pro Max 128GB', brand: 'Apple', model: 'A2894', chip: 'Apple A16 Bionic (4nm)', gpu: 'Apple 5-core GPU', ram: '6GB', rom: '128GB', screen: '6.7" OLED 120Hz Dynamic Island', brightness: '2000', camBack: '48MP + 12MP + 12MP 3x Tele', camFront: '12MP', battery: '4323', charge: '27W dây', ip: 'IP68', weight: '240', price: 25490000, colors: ['Tím Deep Purple', 'Vàng Gold', 'Đen Space'], img: TECH_IMAGES.iphone_black },
  { name: 'Apple iPhone 14 128GB', brand: 'Apple', model: 'A2882', chip: 'Apple A15 Bionic (5nm)', gpu: 'Apple 5-core GPU', ram: '6GB', rom: '128GB', screen: '6.1" Super Retina XDR OLED', brightness: '1200', camBack: '12MP + 12MP', camFront: '12MP', battery: '3279', charge: '20W dây', ip: 'IP68', weight: '172', price: 16990000, colors: ['Xanh Dương', 'Đỏ', 'Trắng Starlight'], img: TECH_IMAGES.iphone_black },
  { name: 'Apple iPhone 13 128GB', brand: 'Apple', model: 'A2633', chip: 'Apple A15 Bionic (5nm)', gpu: 'Apple 4-core GPU', ram: '4GB', rom: '128GB', screen: '6.1" OLED Super Retina XDR', brightness: '1200', camBack: '12MP + 12MP OIS', camFront: '12MP', battery: '3240', charge: '20W dây', ip: 'IP68', weight: '174', price: 13690000, colors: ['Hồng Pink', 'Xanh Midnight', 'Trắng Starlight'], img: TECH_IMAGES.iphone_black },
  { name: 'Samsung Galaxy S24 Ultra 5G 256GB', brand: 'Samsung', model: 'SM-S928B', chip: 'Snapdragon 8 Gen 3 for Galaxy (4nm)', gpu: 'Adreno 750', ram: '12GB', rom: '256GB', screen: '6.8" Dynamic AMOLED 2X 120Hz QHD+', brightness: '2600', camBack: '200MP + 50MP 5x Tele + 10MP 3x Tele + 12MP Ultra Wide', camFront: '12MP Dual Pixel', battery: '5000', charge: '45W dây, 15W sạc không dây', ip: 'IP68', weight: '232', price: 29990000, colors: ['Xám Titan', 'Đen Titan', 'Tím Titan', 'Vàng Titan'], img: TECH_IMAGES.samsung_ultra },
  { name: 'Samsung Galaxy S24+ 5G 256GB', brand: 'Samsung', model: 'SM-S926B', chip: 'Exynos 2400 (4nm)', gpu: 'Xclipse 940 AMD RDNA3', ram: '12GB', rom: '256GB', screen: '6.7" Dynamic AMOLED 2X 120Hz QHD+', brightness: '2600', camBack: '50MP OIS + 10MP 3x Tele + 12MP Ultra Wide', camFront: '12MP', battery: '4900', charge: '45W dây, 15W không dây', ip: 'IP68', weight: '196', price: 22490000, colors: ['Xám Marble', 'Đen Onyx', 'Tím Cobalt'], img: TECH_IMAGES.samsung_ultra },
  { name: 'Samsung Galaxy S24 5G 256GB', brand: 'Samsung', model: 'SM-S921B', chip: 'Exynos 2400 (4nm)', gpu: 'Xclipse 940', ram: '8GB', rom: '256GB', screen: '6.2" Dynamic AMOLED 2X 120Hz FHD+', brightness: '2600', camBack: '50MP OIS + 10MP 3x + 12MP Ultra Wide', camFront: '12MP', battery: '4000', charge: '25W dây', ip: 'IP68', weight: '167', price: 17990000, colors: ['Vàng Amber', 'Đen Onyx', 'Tím Cobalt'], img: TECH_IMAGES.samsung_ultra },
  { name: 'Samsung Galaxy Z Fold 6 5G 256GB', brand: 'Samsung', model: 'SM-F956B', chip: 'Snapdragon 8 Gen 3 for Galaxy', gpu: 'Adreno 750', ram: '12GB', rom: '256GB', screen: '7.6" Dynamic AMOLED 2X gập 120Hz + 6.3" phụ', brightness: '2600', camBack: '50MP OIS + 10MP 3x + 12MP Ultra Wide', camFront: '4MP ẩn dưới màn hình + 10MP màn ngoài', battery: '4400', charge: '25W dây, 15W không dây', ip: 'IP48', weight: '239', price: 41990000, colors: ['Xám Metal', 'Hồng Rosé', 'Xanh Navy'], img: TECH_IMAGES.samsung_fold },
  { name: 'Samsung Galaxy Z Flip 6 5G 256GB', brand: 'Samsung', model: 'SM-F741B', chip: 'Snapdragon 8 Gen 3 for Galaxy', gpu: 'Adreno 750', ram: '12GB', rom: '256GB', screen: '6.7" FHD+ AMOLED 120Hz + 3.4" Super AMOLED FlexWindow', brightness: '2600', camBack: '50MP OIS + 12MP Ultra Wide', camFront: '10MP', battery: '4000', charge: '25W dây', ip: 'IP48', weight: '187', price: 26990000, colors: ['Xanh Maya', 'Vàng Solar', 'Xám Metal'], img: TECH_IMAGES.samsung_fold },
  { name: 'Samsung Galaxy S23 Ultra 5G 256GB', brand: 'Samsung', model: 'SM-S918B', chip: 'Snapdragon 8 Gen 2 for Galaxy', gpu: 'Adreno 740', ram: '8GB', rom: '256GB', screen: '6.8" Dynamic AMOLED 2X 120Hz QHD+', brightness: '1750', camBack: '200MP + 10MP 10x Periscope + 10MP 3x + 12MP', camFront: '12MP', battery: '5000', charge: '45W dây', ip: 'IP68', weight: '234', price: 20990000, colors: ['Đen Phantom', 'Xanh Botanic', 'Kem Cotton'], img: TECH_IMAGES.samsung_ultra },
  { name: 'Samsung Galaxy A55 5G 128GB', brand: 'Samsung', model: 'SM-A556E', chip: 'Exynos 1480 (4nm) GPU Xclipse 530', gpu: 'Xclipse 530', ram: '8GB', rom: '128GB', screen: '6.6" Super AMOLED 120Hz FHD+', brightness: '1000', camBack: '50MP OIS + 12MP Ultra Wide + 5MP Macro', camFront: '32MP', battery: '5000', charge: '25W', ip: 'IP67', weight: '213', price: 9690000, colors: ['Xanh Iceblue', 'Tím Lilac', 'Đen Navy'], img: TECH_IMAGES.samsung_ultra },
  { name: 'Samsung Galaxy A35 5G 128GB', brand: 'Samsung', model: 'SM-A356E', chip: 'Exynos 1380 (5nm)', gpu: 'Mali-G68 MP5', ram: '8GB', rom: '128GB', screen: '6.6" Super AMOLED 120Hz FHD+', brightness: '1000', camBack: '50MP OIS + 8MP + 5MP', camFront: '13MP', battery: '5000', charge: '25W', ip: 'IP67', weight: '209', price: 7790000, colors: ['Vàng Lemon', 'Xanh Iceblue', 'Đen'], img: TECH_IMAGES.samsung_ultra },
  { name: 'Xiaomi 14 Ultra 5G 512GB Leica', brand: 'Xiaomi', model: '24030PN60G', chip: 'Snapdragon 8 Gen 3 (4nm)', gpu: 'Adreno 750', ram: '16GB', rom: '512GB', screen: '6.73" LTPO AMOLED 120Hz WQHD+ Dolby Vision', brightness: '3000', camBack: '50MP LYT-900 1-inch OIS + 50MP 3.2x + 50MP 5x Periscope + 50MP Ultra Wide', camFront: '32MP', battery: '5000', charge: '90W HyperCharge dây, 80W không dây', ip: 'IP68', weight: '219.8', price: 29990000, colors: ['Trắng Da Sinh Học', 'Đen Titan Da'], img: TECH_IMAGES.iphone_titan },
  { name: 'Xiaomi 14 5G 256GB Leica', brand: 'Xiaomi', model: '23127PN0CG', chip: 'Snapdragon 8 Gen 3 (4nm)', gpu: 'Adreno 750', ram: '12GB', rom: '256GB', screen: '6.36" LTPO OLED 120Hz 1.5K', brightness: '3000', camBack: '50MP Light Hunter 900 + 50MP 3.2x Tele + 50MP Ultra Wide', camFront: '32MP', battery: '4610', charge: '90W dây, 50W không dây', ip: 'IP68', weight: '193', price: 19990000, colors: ['Xanh Ngọc Jade', 'Đen', 'Trắng'], img: TECH_IMAGES.iphone_black },
  { name: 'Xiaomi 13T Pro 5G 512GB Leica', brand: 'Xiaomi', model: '23078PND5G', chip: 'MediaTek Dimensity 9200+ (4nm)', gpu: 'Immortalis-G715 MC11', ram: '12GB', rom: '512GB', screen: '6.67" AMOLED 144Hz CrystalRes 1.5K', brightness: '2600', camBack: '50MP Sony IMX707 OIS + 50MP Tele + 12MP Ultra Wide', camFront: '20MP', battery: '5000', charge: '120W HyperCharge (19 phút đầy)', ip: 'IP68', weight: '206', price: 14990000, colors: ['Xanh Alpine Da Thuần Chay', 'Đen Meadow'], img: TECH_IMAGES.iphone_titan },
  { name: 'Xiaomi Redmi Note 13 Pro+ 5G 256GB', brand: 'Xiaomi', model: '23090RA98G', chip: 'MediaTek Dimensity 7200-Ultra (4nm)', gpu: 'Mali-G610 MC4', ram: '8GB', rom: '256GB', screen: '6.67" AMOLED cong 120Hz 1.5K HDR10+', brightness: '1800', camBack: '200MP Samsung HP3 OIS + 8MP + 2MP', camFront: '16MP', battery: '5000', charge: '120W HyperCharge', ip: 'IP68', weight: '204.5', price: 9990000, colors: ['Tím Cực Quang', 'Đen Nửa Đêm', 'Trắng Ánh Trăng'], img: TECH_IMAGES.iphone_black },
  { name: 'Xiaomi POCO F6 Pro 5G 512GB', brand: 'POCO', model: '23113RKC6G', chip: 'Snapdragon 8 Gen 2 (4nm)', gpu: 'Adreno 740', ram: '12GB', rom: '512GB', screen: '6.67" WQHD+ Flow AMOLED 120Hz', brightness: '4000', camBack: '50MP Light Fusion 800 OIS + 8MP + 2MP', camFront: '16MP', battery: '5000', charge: '120W HyperCharge', ip: 'IP54', weight: '209', price: 12990000, colors: ['Trắng Vân Đá', 'Đen Kim Cương'], img: TECH_IMAGES.iphone_black },
  { name: 'OPPO Find X7 Ultra 5G Hasselblad', brand: 'OPPO', model: 'PHY110', chip: 'Snapdragon 8 Gen 3 (4nm)', gpu: 'Adreno 750', ram: '16GB', rom: '512GB', screen: '6.82" LTPO AMOLED 120Hz 2K', brightness: '4500', camBack: '50MP Sony LYT-900 1-inch + 50MP 3x Periscope + 50MP 6x Periscope + 50MP Ultra Wide', camFront: '32MP', battery: '5000', charge: '100W SuperVOOC, 50W AirVOOC', ip: 'IP68', weight: '221', price: 27990000, colors: ['Nâu Da Đại Dương', 'Đen Nhám'], img: TECH_IMAGES.iphone_titan },
  { name: 'OPPO Reno 12 Pro 5G AI Phone', brand: 'OPPO', model: 'CPH2629', chip: 'MediaTek Dimensity 7300-Energy (4nm)', gpu: 'Mali-G615', ram: '12GB', rom: '512GB', screen: '6.7" AMOLED cong 4 cạnh 120Hz', brightness: '1200', camBack: '50MP Sony LYT-600 OIS + 50MP Tele 2x + 8MP Ultra Wide', camFront: '50MP lấy nét tự động', battery: '5000', charge: '80W SuperVOOC', ip: 'IP65', weight: '180', price: 16990000, colors: ['Bạc Tinh Vân', 'Nâu Không Gian'], img: TECH_IMAGES.iphone_black },
  { name: 'Vivo X100 Pro 5G ZEISS Optics', brand: 'Vivo', model: 'V2324A', chip: 'MediaTek Dimensity 9300 (4nm)', gpu: 'Immortalis-G720 MC12', ram: '16GB', rom: '512GB', screen: '6.78" LTPO AMOLED 120Hz 1.5K 3000 nits', brightness: '3000', camBack: '50MP 1-inch Sony IMX989 ZEISS APO + 50MP 4.3x Periscope + 50MP Ultra Wide', camFront: '32MP', battery: '5400', charge: '100W FlashCharge, 50W không dây', ip: 'IP68', weight: '225', price: 24990000, colors: ['Xanh Hoàng Hôn', 'Đen Sao Băng'], img: TECH_IMAGES.iphone_titan },
  { name: 'Google Pixel 8 Pro 5G 128GB AI', brand: 'Google', model: 'GC3VE', chip: 'Google Tensor G3 (4nm) NPU AI TPU', gpu: 'Immortalis-G715s MC10', ram: '12GB', rom: '128GB', screen: '6.7" Super Actua OLED LTPO 120Hz QHD+', brightness: '2400', camBack: '50MP OIS + 48MP 5x Telephoto + 48MP Ultra Wide Macro', camFront: '10.5MP Dual PD', battery: '5050', charge: '30W dây, 23W không dây Pixel Stand', ip: 'IP68', weight: '213', price: 21990000, colors: ['Xanh Bay Blue', 'Đen Obsidian', 'Sứ Porcelain'], img: TECH_IMAGES.iphone_black },
  { name: 'Google Pixel 9 Pro XL 5G Gemini AI', brand: 'Google', model: 'GEC77', chip: 'Google Tensor G4 (4nm) + Titan M2', gpu: 'Mali-G715', ram: '16GB', rom: '256GB', screen: '6.8" Super Actua LTPO OLED 120Hz 3000 nits', brightness: '3000', camBack: '50MP + 48MP 5x + 48MP Ultra Wide', camFront: '42MP AF', battery: '5060', charge: '37W dây, 23W không dây', ip: 'IP68', weight: '221', price: 31990000, colors: ['Xám Hazel', 'Đen Obsidian', 'Hồng Rose Quartz'], img: TECH_IMAGES.iphone_titan },
  { name: 'ASUS ROG Phone 8 Pro 5G Gaming', brand: 'ASUS', model: 'AI2401', chip: 'Snapdragon 8 Gen 3 (4nm)', gpu: 'Adreno 750', ram: '16GB', rom: '512GB', screen: '6.78" Samsung E6 Flexible AMOLED 165Hz LTPO', brightness: '2500', camBack: '50MP Sony IMX890 Gimbal OIS + 32MP 3x + 13MP Ultra Wide', camFront: '32MP', battery: '5500', charge: '65W HyperCharge, 15W Qi không dây', ip: 'IP68', weight: '225', price: 28990000, colors: ['Đen Phantom AniMe Vision'], img: TECH_IMAGES.laptop_gaming },
  { name: 'Sony Xperia 1 VI 5G 256GB Bravia', brand: 'Sony', model: 'XQ-EC54', chip: 'Snapdragon 8 Gen 3 (4nm)', gpu: 'Adreno 750', ram: '12GB', rom: '256GB', screen: '6.5" LTPO OLED 1-120Hz FHD+ Powered by BRAVIA', brightness: '1500', camBack: '48MP Exmor T 24mm + 12MP Tele 85-170mm Optical Zoom + 12MP Ultra Wide', camFront: '12MP', battery: '5000', charge: '30W PD3.0, Qi không dây', ip: 'IP68', weight: '192', price: 31990000, colors: ['Bạc Bạch Kim', 'Xanh Khaki', 'Đen'], img: TECH_IMAGES.iphone_black }
];

// Generate phone items
export function generatePhones(): ProductSeedItem[] {
  return phoneModels.map((p) => {
    const desc = `### 1. Tổng quan & Định vị sản phẩm
${p.name} là mẫu điện thoại thông minh cao cấp hàng đầu thuộc hệ sinh thái ${p.brand}. Thiết bị được thiết kế nguyên khối tinh xảo, đáp ứng toàn diện mọi tác vụ từ làm việc đa nhiệm, sáng tạo nội dung hình ảnh đến xử lý các thuật toán trí tuệ nhân tạo (AI Engine) mượt mà trên thiết bị di động.

### 2. Bảng thông số kỹ thuật chi tiết (Technical Specifications)
- **Thương hiệu:** ${p.brand}
- **Mã sản phẩm (Model):** ${p.model}
- **Bộ vi xử lý trung tâm (CPU / Chipset):** ${p.chip}
- **Bộ xử lý đồ họa (GPU):** ${p.gpu}
- **Bộ nhớ RAM:** ${p.ram} chuẩn LPDDR5X tốc độ cao
- **Bộ nhớ lưu trữ (ROM / Storage):** ${p.rom} chuẩn bộ nhớ tốc độ cao UFS 4.0 / NVMe
- **Màn hình hiển thị:** ${p.screen}, độ sáng đỉnh tối đa ${p.brightness} nits ngoài trời, hỗ trợ dải màu rộng DCI-P3, HDR10+, Dolby Vision
- **Cụm Camera sau:** ${p.camBack}, tích hợp chống rung quang học OIS thế hệ mới, hỗ trợ quay video chuyên nghiệp 4K/60fps Dolby Vision HDR và chế độ chụp đêm Night Mode
- **Camera selfie trước:** ${p.camFront}, hỗ trợ lấy nét khuôn mặt tự động AF, quay video 4K sắc nét
- **Dung lượng Pin:** ${p.battery} mAh, đảm bảo thời lượng sử dụng trọn vẹn cả ngày dài với các tác vụ cường độ cao
- **Công nghệ Sạc:** Hỗ trợ sạc nhanh có dây ${p.charge}
- **Tiêu chuẩn kháng nước & kháng bụi:** Chuẩn ${p.ip} quốc tế, an tâm sử dụng dưới trời mưa và môi trường khắc nghiệt
- **Trọng lượng & Kích thước:** Trọng lượng ${p.weight} gram, viền kim loại cao cấp cùng mặt kính cường lực thế hệ mới
- **Kết nối không dây:** 5G đa băng tần tốc độ cao, Wi-Fi 7 / Wi-Fi 6E, Bluetooth 5.4, NFC thanh toán một chạm

### 3. Tính năng vượt trội & Khả năng hỗ trợ AI
- **Xử lý AI trên thiết bị (On-device AI):** Hỗ trợ dịch thuật trực tiếp hai chiều, chỉnh sửa ảnh thông minh, tách nền chủ thể và tóm tắt nội dung tự động.
- **Hệ thống tản nhiệt tiên tiến:** Duy trì hiệu năng ổn định, không bị giảm xung nhịp khi chơi game nặng hoặc render video liên tục.
- **Bảo mật sinh trắc học:** Mở khóa khuôn mặt 3D / Cảm biến vân tay siêu âm dưới màn hình siêu nhạy.

### 4. Đánh giá & Hướng dẫn so sánh
- **Ưu điểm cốt lõi:** Cấu hình chip ${p.chip} dẫn đầu phân khúc, màn hình hiển thị xuất sắc, hệ thống camera chuẩn studio.
- **Đối tượng phù hợp:** Doanh nhân, nhà sáng tạo nội dung, game thủ và người yêu công nghệ cao cấp.
- **Khuyến nghị so sánh AI:** Có thể đối chiếu trực tiếp các thông số CPU, RAM, màn hình và camera với các flagship cùng phân khúc để đánh giá tỷ lệ hiệu năng / giá thành.`;

    const variants = p.colors.map((c, idx) => ({
      attributes: { color: c, storage: p.rom, ram: p.ram },
      price: p.price + (idx > 1 ? 500000 : 0),
      stock_quantity: 50 + idx * 15
    }));

    return {
      name: p.name,
      categorySlug: 'smartphones',
      brand: p.brand,
      price: p.price,
      description: desc,
      images: p.img,
      variants
    };
  });
}

// Tablets (25 items)
const tabletModels = [
  { name: 'Apple iPad Pro M4 13-inch 256GB Ultra Retina XDR', brand: 'Apple', model: 'A2925', chip: 'Apple M4 9-core CPU 10-core GPU', ram: '8GB', rom: '256GB', screen: '13" Tandem OLED Ultra Retina XDR 120Hz ProMotion 1600 nits', cam: '12MP F/1.8 + LiDAR Scanner', battery: '10290', weight: '579', price: 37990000, colors: ['Bạc Silver', 'Đen Không Gian Space Black'] },
  { name: 'Apple iPad Pro M4 11-inch 256GB Ultra Retina XDR', brand: 'Apple', model: 'A2836', chip: 'Apple M4 9-core CPU 10-core GPU', ram: '8GB', rom: '256GB', screen: '11" Tandem OLED Ultra Retina XDR 120Hz ProMotion', cam: '12MP + LiDAR', battery: '8160', weight: '444', price: 28990000, colors: ['Bạc Silver', 'Đen Space Black'] },
  { name: 'Apple iPad Air M2 13-inch 128GB Liquid Retina', brand: 'Apple', model: 'A2898', chip: 'Apple M2 8-core CPU 9-core GPU', ram: '8GB', rom: '128GB', screen: '13" Liquid Retina IPS 600 nits True Tone', cam: '12MP sau + 12MP trước Center Stage', battery: '9700', weight: '617', price: 21990000, colors: ['Xanh Dương Tinh Vân', 'Tím Ánh Sao', 'Xám Không Gian'] },
  { name: 'Apple iPad Air M2 11-inch 128GB Liquid Retina', brand: 'Apple', model: 'A2902', chip: 'Apple M2 8-core CPU 9-core GPU', ram: '8GB', rom: '128GB', screen: '11" Liquid Retina IPS 500 nits P3', cam: '12MP', battery: '7600', weight: '462', price: 16990000, colors: ['Xanh Dương', 'Tím', 'Xám Không Gian'] },
  { name: 'Apple iPad Gen 10 10.9-inch 64GB Wi-Fi', brand: 'Apple', model: 'A2696', chip: 'Apple A14 Bionic', ram: '4GB', rom: '64GB', screen: '10.9" Liquid Retina IPS True Tone', cam: '12MP', battery: '7538', weight: '477', price: 9490000, colors: ['Vàng', 'Xanh Lam', 'Hồng', 'Bạc'] },
  { name: 'Apple iPad Mini 6 8.3-inch 64GB Wi-Fi', brand: 'Apple', model: 'A2567', chip: 'Apple A15 Bionic', ram: '4GB', rom: '64GB', screen: '8.3" Liquid Retina IPS 500 nits', cam: '12MP', battery: '5124', weight: '293', price: 12490000, colors: ['Tím Purple', 'Hồng Pink', 'Xám Space'] },
  { name: 'Samsung Galaxy Tab S9 Ultra 5G 256GB S-Pen', brand: 'Samsung', model: 'SM-X916B', chip: 'Snapdragon 8 Gen 2 for Galaxy', ram: '12GB', rom: '256GB', screen: '14.6" Dynamic AMOLED 2X 120Hz 1750 nits', cam: '13MP + 8MP sau, 12MP kép trước', battery: '11200', weight: '732', price: 29990000, colors: ['Xám Graphite', 'Kem Beige'] },
  { name: 'Samsung Galaxy Tab S9+ 5G 256GB S-Pen', brand: 'Samsung', model: 'SM-X816B', chip: 'Snapdragon 8 Gen 2 for Galaxy', ram: '12GB', rom: '256GB', screen: '12.4" Dynamic AMOLED 2X 120Hz', cam: '13MP + 8MP', battery: '10090', weight: '586', price: 23990000, colors: ['Xám Graphite'] },
  { name: 'Samsung Galaxy Tab S9 FE+ 5G 128GB S-Pen', brand: 'Samsung', model: 'SM-X616B', chip: 'Exynos 1380', ram: '8GB', rom: '128GB', screen: '12.4" IPS LCD 90Hz WQXGA', cam: '8MP kép', battery: '10090', weight: '628', price: 13990000, colors: ['Xanh Mint', 'Xám Than', 'Bạc'] },
  { name: 'Samsung Galaxy Tab S9 FE 128GB Wi-Fi S-Pen', brand: 'Samsung', model: 'SM-X510', chip: 'Exynos 1380', ram: '6GB', rom: '128GB', screen: '10.9" IPS LCD 90Hz', cam: '8MP', battery: '8000', weight: '523', price: 9490000, colors: ['Xanh Mint', 'Xám'] },
  { name: 'Xiaomi Pad 6S Pro 12.4 256GB 144Hz HyperOS', brand: 'Xiaomi', model: '24018RPACC', chip: 'Snapdragon 8 Gen 2 (4nm)', ram: '8GB', rom: '256GB', screen: '12.4" 3K 144Hz LCD 900 nits 3:2 Dolby Vision', cam: '50MP + 2MP', battery: '10000', weight: '590', price: 14490000, colors: ['Xám Kim Loại'] },
  { name: 'Xiaomi Pad 6 128GB 144Hz WQHD+', brand: 'Xiaomi', model: '23043RP34G', chip: 'Snapdragon 870 5G (7nm)', ram: '6GB', rom: '128GB', screen: '11" WQHD+ 144Hz LCD 550 nits', cam: '13MP', battery: '8840', weight: '490', price: 7990000, colors: ['Xanh Dương', 'Xám Khói', 'Vàng Gold'] },
  { name: 'Lenovo Legion Tab Y700 Gen 2 256GB Gaming', brand: 'Lenovo', model: 'TB320FC', chip: 'Snapdragon 8+ Gen 1 (4nm)', ram: '12GB', rom: '256GB', screen: '8.8" 2.5K 144Hz 500 nits 100% DCI-P3', cam: '13MP + 2MP', battery: '6550', weight: '348', price: 9890000, colors: ['Xám Titan Titan'] },
  { name: 'Lenovo Tab P12 Pro 12.6-inch 256GB AMOLED', brand: 'Lenovo', model: 'TB-Q706F', chip: 'Snapdragon 870', ram: '8GB', rom: '256GB', screen: '12.6" AMOLED 2K 120Hz Dolby Vision HDR10+', cam: '13MP + 5MP', battery: '10200', weight: '565', price: 15990000, colors: ['Xám Bão Storm Grey'] },
  { name: 'Microsoft Surface Pro 11 Copilot+ PC Snapdragon X Plus', brand: 'Microsoft', model: 'SP11-OLED', chip: 'Snapdragon X Plus 10-core 45 TOPS NPU', ram: '16GB', rom: '256GB', screen: '13" PixelSense Flow OLED 120Hz 2880x1920', cam: '10.5MP Ultra-wide 1440p Quad HD', battery: '5400', weight: '895', price: 32990000, colors: ['Bạch Kim Platinum', 'Đen Nhám Black', 'Xanh Sapphire'] },
  { name: 'Microsoft Surface Pro 9 Core i7 256GB', brand: 'Microsoft', model: 'QIX-00001', chip: 'Intel Core i7-1255U 10-core', ram: '16GB', rom: '256GB', screen: '13" PixelSense Flow 120Hz 2880x1920', cam: '10MP 4K', battery: '5000', weight: '879', price: 27990000, colors: ['Bạch Kim', 'Xanh Forest'] },
  { name: 'Huawei MatePad Pro 13.2 OLED 256GB NearLink', brand: 'Huawei', model: 'PCE-W29', chip: 'Kirin 9000S (7nm)', ram: '12GB', rom: '256GB', screen: '13.2" Flexible OLED 144Hz 2.8K 1000 nits', cam: '13MP + 8MP', battery: '10100', weight: '580', price: 21990000, colors: ['Xanh Lục Bảo', 'Đen'] },
  { name: 'Huawei MatePad 11.5S PaperMatte Chống Lóa', brand: 'Huawei', model: 'TGR-W09', chip: 'Kirin 9000WL', ram: '8GB', rom: '256GB', screen: '11.5" PaperMatte chống chói 144Hz 2.8K', cam: '13MP', battery: '8800', weight: '510', price: 11490000, colors: ['Tím Mộng Mơ', 'Xám Không Gian'] },
  { name: 'OnePlus Pad 2 256GB Snapdragon 8 Gen 3', brand: 'OnePlus', model: 'OPD2401', chip: 'Snapdragon 8 Gen 3', ram: '12GB', rom: '256GB', screen: '12.1" 3K 144Hz 7:5 tỷ lệ vàng 900 nits', cam: '13MP 4K', battery: '9510', weight: '584', price: 16990000, colors: ['Xám Nimbus Grey'] },
  { name: 'OPPO Pad 2 256GB Dimensity 9000 144Hz', brand: 'OPPO', model: 'OPD2201', chip: 'MediaTek Dimensity 9000', ram: '8GB', rom: '256GB', screen: '11.61" LCD 144Hz 2.8K 7:5', cam: '13MP', battery: '9510', weight: '552', price: 13990000, colors: ['Vàng Tinh Vân'] },
  { name: 'Samsung Galaxy Tab A9+ 5G 64GB', brand: 'Samsung', model: 'SM-X216B', chip: 'Snapdragon 695 5G', ram: '4GB', rom: '64GB', screen: '11" TFT LCD 90Hz WUXGA', cam: '8MP', battery: '7040', weight: '491', price: 5490000, colors: ['Xanh Navy', 'Bạc'] },
  { name: 'Samsung Galaxy Tab A9 64GB Wi-Fi', brand: 'Samsung', model: 'SM-X110', chip: 'MediaTek Helio G99', ram: '4GB', rom: '64GB', screen: '8.7" LCD 60Hz', cam: '8MP', battery: '5100', weight: '332', price: 3490000, colors: ['Xám Than'] },
  { name: 'Lenovo Tab M11 128GB kèm bút cảm ứng', brand: 'Lenovo', model: 'TB330FU', chip: 'MediaTek Helio G88', ram: '4GB', rom: '128GB', screen: '11" IPS 90Hz FHD 4 loa Dolby Atmos', cam: '8MP', battery: '7040', weight: '465', price: 4790000, colors: ['Xám Biển Lặng'] },
  { name: 'Xiaomi Redmi Pad SE 128GB 90Hz', brand: 'Xiaomi', model: '23073RPBFG', chip: 'Snapdragon 680', ram: '4GB', rom: '128GB', screen: '11" FHD+ 90Hz 4 loa âm thanh vòm', cam: '8MP', battery: '8000', weight: '478', price: 3990000, colors: ['Xanh Bạc Hà', 'Xám Than'] },
  { name: 'Chuwi Hi10 Max 2-in-1 Windows 11 Tablet 512GB', brand: 'Chuwi', model: 'Hi10-Max', chip: 'Intel N100 4-core 3.4GHz', ram: '12GB', rom: '512GB SSD', screen: '12.96" 3K 2880x1920 IPS', cam: '8MP', battery: '5000', weight: '780', price: 8990000, colors: ['Xám Kim Loại'] }
];

export function generateTablets(): ProductSeedItem[] {
  return tabletModels.map((t) => {
    const desc = `### 1. Giới thiệu & Định vị sản phẩm
${t.name} là dòng máy tính bảng đa năng cao cấp từ thương hiệu ${t.brand}. Sản phẩm kết hợp hoàn hảo giữa tính di động cao của tablet và năng lực xử lý mạnh mẽ của laptop chuyên nghiệp, hỗ trợ tối ưu ghi chú viết vẽ sáng tạo và làm việc di động.

### 2. Thông số kỹ thuật chi tiết (Technical Specifications)
- **Thương hiệu:** ${t.brand}
- **Model:** ${t.model}
- **Vi xử lý (CPU/Processor):** ${t.chip}
- **Bộ nhớ RAM:** ${t.ram}
- **Bộ nhớ trong (ROM):** ${t.rom}
- **Màn hình hiển thị:** ${t.screen}
- **Hệ thống Camera:** ${t.cam}
- **Dung lượng Pin:** ${t.battery} mAh, thời lượng lướt web và xem video liên tục lên đến 10 - 14 giờ
- **Trọng lượng & Kích thước:** ${t.weight}g, thiết kế siêu mỏng nhẹ tiện lợi mang theo
- **Hỗ trợ bút cảm ứng:** Tương thích bút Stylus độ trễ siêu thấp, hỗ trợ nhận diện 4096 lực nhấn
- **Âm thanh:** Hệ thống 4 loa vòm chuẩn Dolby Atmos / Spatial Audio sống động

### 3. Tính năng vượt trội & AI
- Hỗ trợ đa nhiệm chia đôi màn hình (Split View) và chế độ giao diện Desktop chuyên nghiệp.
- Nhận diện chữ viết tay thông minh, chuyển đổi chữ viết sang văn bản bằng AI chuẩn xác.

### 4. Đối tượng sử dụng & So sánh
- **Phù hợp với:** Học sinh sinh viên, giáo viên, họa sĩ digital art, chuyên viên văn phòng cần máy tính phụ làm việc linh hoạt.`;

    const variants = t.colors.map((c, idx) => ({
      attributes: { color: c, storage: t.rom, ram: t.ram },
      price: t.price + (idx > 0 ? 300000 : 0),
      stock_quantity: 40 + idx * 10
    }));

    return {
      name: t.name,
      categorySlug: 'tablets',
      brand: t.brand,
      price: t.price,
      description: desc,
      images: TECH_IMAGES.ipad,
      variants
    };
  });
}
