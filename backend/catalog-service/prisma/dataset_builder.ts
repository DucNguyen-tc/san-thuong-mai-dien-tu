import { TECH_IMAGES } from './dataset_data';
import { ProductSeedItem } from './products_catalog_500';

// ==========================================
// 2. LAPTOPS & COMPUTERS (30 ITEMS)
// ==========================================
const laptopData = [
  { name: 'Apple MacBook Pro 16-inch M3 Max (36GB RAM / 1TB SSD)', brand: 'Apple', cpu: 'Apple M3 Max 14-core CPU 30-core GPU', ram: '36GB Unified Memory', ssd: '1TB NVMe SSD', screen: '16.2" Liquid Retina XDR 120Hz ProMotion 1600 nits Mini-LED', battery: '100Whr (22h pin)', ports: '3x Thunderbolt 4, HDMI 2.1, Khe SDXC, MagSafe 3', weight: '2.14kg', price: 79990000, colors: ['Đen Không Gian Space Black', 'Bạc Silver'] },
  { name: 'Apple MacBook Pro 14-inch M3 Pro (18GB RAM / 512GB SSD)', brand: 'Apple', cpu: 'Apple M3 Pro 11-core CPU 14-core GPU', ram: '18GB Unified Memory', ssd: '512GB NVMe SSD', screen: '14.2" Liquid Retina XDR 120Hz Mini-LED', battery: '70Whr (18h pin)', ports: '3x Thunderbolt 4, HDMI, SDXC, MagSafe 3', weight: '1.61kg', price: 49990000, colors: ['Đen Space Black', 'Bạc Silver'] },
  { name: 'Apple MacBook Air 15-inch M3 (16GB RAM / 512GB SSD)', brand: 'Apple', cpu: 'Apple M3 8-core CPU 10-core GPU', ram: '16GB Unified', ssd: '512GB SSD', screen: '15.3" Liquid Retina IPS 500 nits', battery: '66.5Whr (18h pin)', ports: '2x Thunderbolt 4 / USB 4, MagSafe 3', weight: '1.51kg', price: 37990000, colors: ['Xanh Đen Midnight', 'Bạc Starlight', 'Xám Space Grey'] },
  { name: 'Apple MacBook Air 13-inch M2 (8GB RAM / 256GB SSD)', brand: 'Apple', cpu: 'Apple M2 8-core CPU 8-core GPU', ram: '8GB Unified', ssd: '256GB SSD', screen: '13.6" Liquid Retina IPS 500 nits True Tone', battery: '52.6Whr (18h pin)', ports: '2x Thunderbolt 4, MagSafe 3', weight: '1.24kg', price: 23990000, colors: ['Midnight', 'Starlight', 'Space Grey', 'Silver'] },
  { name: 'Dell XPS 16 9640 Intel Core Ultra 7 155H RTX 4060', brand: 'Dell', cpu: 'Intel Core Ultra 7 155H 16-core NPU AI Boost', ram: '32GB LPDDR5x 7467MHz', ssd: '1TB PCIe Gen 4 SSD', screen: '16.3" 4K+ OLED Touch 90Hz 100% DCI-P3 400 nits', battery: '99.5Whr', ports: '3x Thunderbolt 4 USB-C, Khe microSD', weight: '2.13kg', price: 68990000, colors: ['Bạch Kim Platinum', 'Than Chì Graphite'] },
  { name: 'Dell XPS 14 9440 Intel Core Ultra 7 155H RTX 4050', brand: 'Dell', cpu: 'Intel Core Ultra 7 155H', ram: '16GB LPDDR5x', ssd: '512GB PCIe Gen 4', screen: '14.5" 3.2K OLED Touch 120Hz Gorilla Glass Victus', battery: '69.5Whr', ports: '3x Thunderbolt 4 USB-C', weight: '1.68kg', price: 54990000, colors: ['Bạch Kim Platinum'] },
  { name: 'Lenovo ThinkPad X1 Carbon Gen 12 Core Ultra 7 155H', brand: 'Lenovo', cpu: 'Intel Core Ultra 7 155H vPro Enterprise', ram: '32GB LPDDR5X', ssd: '1TB M.2 PCIe Gen 4', screen: '14" 2.8K OLED 120Hz 400 nits 100% DCI-P3 HDR500', battery: '57Whr hỗ trợ sạc nhanh Rapid Charge', ports: '2x Thunderbolt 4, 2x USB-A 3.2, HDMI 2.1, Audio 3.5mm', weight: '1.09kg', price: 58990000, colors: ['Đen Sợi Carbon Chống Bám Vân Tay'] },
  { name: 'Lenovo ThinkPad T14s Gen 5 AMD Ryzen 7 PRO 8840U', brand: 'Lenovo', cpu: 'AMD Ryzen 7 PRO 8840U 8-core 16-thread Ryzen AI', ram: '16GB LPDDR5x', ssd: '512GB SSD NVMe', screen: '14" WUXGA IPS 400 nits chống lóa Low Power', battery: '58Whr', ports: '2x USB4, 2x USB-A 3.2, HDMI 2.1', weight: '1.24kg', price: 34990000, colors: ['Đen Eclipse Black'] },
  { name: 'ASUS ROG Zephyrus G16 OLED GU605 (RTX 4080 / Core Ultra 9)', brand: 'ASUS', cpu: 'Intel Core Ultra 9 185H 16-core 5.1GHz', ram: '32GB LPDDR5X 7467MHz', ssd: '1TB PCIe 4.0 NVMe', screen: '16" 2.5K ROG Nebula OLED 240Hz 0.2ms 500 nits G-Sync', battery: '90Whr sạc Type-C 100W PD', ports: 'Thunderbolt 4, USB-C 3.2, HDMI 2.1, Khe SD UHS-II', weight: '1.85kg', price: 69990000, colors: ['Xám Eclipse Grey', 'Trắng Platinum White'] },
  { name: 'ASUS ROG Strix SCAR 18 G834 (i9-14900HX / RTX 4090)', brand: 'ASUS', cpu: 'Intel Core i9-14900HX 24 nhân 32 luồng 5.8GHz', ram: '64GB DDR5 5600MHz', ssd: '2TB PCIe 4.0 RAID 0', screen: '18" Mini-LED 2.5K ROG Nebula HDR 240Hz 1100 nits', battery: '90Whr', ports: 'Thunderbolt 4, HDMI 2.1, LAN 2.5G, Audio Hi-Res', weight: '3.10kg', price: 119990000, colors: ['Đen Translucent ROG'] },
  { name: 'ASUS Zenbook 14 OLED UX3405 Core Ultra 7 155H', brand: 'ASUS', cpu: 'Intel Core Ultra 7 155H Intel Arc Graphics', ram: '16GB LPDDR5X', ssd: '1TB SSD NVMe', screen: '14" 3K ASUS Lumina OLED 120Hz 0.2ms 600 nits', battery: '75Whr (15h pin)', ports: '2x Thunderbolt 4, USB-A 3.2, HDMI 2.1', weight: '1.20kg', price: 29990000, colors: ['Xanh Lam Trầm Ponder Blue'] },
  { name: 'Lenovo Legion Pro 7i Gen 9 (i9-14900HX / RTX 4080)', brand: 'Lenovo', cpu: 'Intel Core i9-14900HX AI Legion Coldfront', ram: '32GB DDR5 5600MHz', ssd: '1TB PCIe 4.0', screen: '16" WQXGA IPS 240Hz 500 nits 100% sRGB DisplayHDR 400', battery: '99.99Whr Super Rapid Charge', ports: 'Thunderbolt 4, 4x USB-A, HDMI 2.1, RJ45 LAN', weight: '2.62kg', price: 74990000, colors: ['Xám Onyx Grey'] },
  { name: 'Lenovo Yoga Slim 7x Copilot+ PC Snapdragon X Elite', brand: 'Lenovo', cpu: 'Snapdragon X Elite X1E-78-100 45 TOPS NPU', ram: '16GB LPDDR5X', ssd: '1TB PCIe Gen 4', screen: '14.5" 3K PureSight OLED Touch 90Hz 1000 nits', battery: '70Whr (lên đến 23h xem video)', ports: '3x USB-C USB4 40Gbps', weight: '1.28kg', price: 34990000, colors: ['Xanh Cosmic Blue'] },
  { name: 'Acer Predator Helios 16 PH16 (i9-14900HX / RTX 4070)', brand: 'Acer', cpu: 'Intel Core i9-14900HX Tản nhiệt kim loại lỏng', ram: '32GB DDR5 5600MHz', ssd: '1TB PCIe Gen 4 NVMe', screen: '16" WQXGA IPS 240Hz 500 nits DCI-P3 100%', battery: '90Whr', ports: 'Thunderbolt 4, HDMI 2.1, Ethernet Killer E3100G', weight: '2.60kg', price: 54990000, colors: ['Đen Abyssal Black'] },
  { name: 'Acer Swift Go 14 AI OLED Intel Core Ultra 5 125H', brand: 'Acer', cpu: 'Intel Core Ultra 5 125H Intel Arc', ram: '16GB LPDDR5X', ssd: '512GB PCIe Gen 4', screen: '14" 2.8K OLED 90Hz 100% DCI-P3 500 nits', battery: '65Whr', ports: '2x Thunderbolt 4, 2x USB-A, HDMI 2.1', weight: '1.32kg', price: 21990000, colors: ['Bạc Tinh Thể Pure Silver'] },
  { name: 'HP Spectre x360 14 2-in-1 OLED Core Ultra 7 155H', brand: 'HP', cpu: 'Intel Core Ultra 7 155H', ram: '32GB LPDDR5X', ssd: '1TB NVMe Gen 4', screen: '14" 2.8K OLED cảm ứng xoay gập 360 độ 120Hz kèm bút HP Pen', battery: '68Whr', ports: '2x Thunderbolt 4, 1x USB-A drop-jaw', weight: '1.44kg', price: 47990000, colors: ['Xanh Đêm Nightfall Black'] },
  { name: 'HP OMEN 16 Gaming Laptop (Ryzen 7 7840HS / RTX 4060)', brand: 'HP', cpu: 'AMD Ryzen 7 7840HS 8 nhân 16 luồng', ram: '16GB DDR5 5600MHz', ssd: '1TB PCIe Gen 4', screen: '16.1" QHD 240Hz 3ms IPS 300 nits', battery: '83Whr', ports: 'USB-C, 3x USB-A, HDMI 2.1, RJ-45', weight: '2.37kg', price: 36990000, colors: ['Đen Bóng Đêm Shadow Black'] },
  { name: 'HP Pavilion 15-eg3093TU Core i5-1335U Văn phòng', brand: 'HP', cpu: 'Intel Core i5-1335U 10 nhân 12 luồng Turbo 4.6GHz', ram: '16GB DDR4 3200MHz', ssd: '512GB SSD NVMe', screen: '15.6" Full HD IPS viền siêu mỏng chống chói', battery: '41Whr sạc nhanh HP Fast Charge', ports: 'USB Type-C, 2x USB Type-A, HDMI, Audio jack', weight: '1.74kg', price: 16990000, colors: ['Vàng Ánh Kim Warm Gold', 'Bạc Tự Nhiên'] },
  { name: 'MSI Raider GE78 HX 14V (i9-14900HX / RTX 4090 / 64GB)', brand: 'MSI', cpu: 'Intel Core i9-14900HX Overclock sẵn', ram: '64GB DDR5 5600MHz', ssd: '2TB PCIe Gen 5 SSD', screen: '17" QHD+ 240Hz IPS-Level 100% DCI-P3 Matrix RGB Bar', battery: '99.9Whr sạc 330W', ports: 'Thunderbolt 4, USB-C 3.2, HDMI 2.1, Đầu đọc SD Express', weight: '3.10kg', price: 109990000, colors: ['Đen Đỏ Huyền Bí MSI'] },
  { name: 'MSI Stealth 16 AI Studio A1V (Core Ultra 9 / RTX 4070)', brand: 'MSI', cpu: 'Intel Core Ultra 9 185H mỏng nhẹ Magie-Nhôm', ram: '32GB DDR5 5600MHz', ssd: '1TB PCIe Gen 4', screen: '16" UHD+ Mini-LED 120Hz 100% DCI-P3 VESA DisplayHDR 1000', battery: '99.9Whr', ports: 'Thunderbolt 4, HDMI 2.1, Khe thẻ MicroSD', weight: '1.99kg', price: 63990000, colors: ['Xanh Sao Trời Star Blue'] },
  { name: 'MSI Modern 14 C12MO Core i5-1235U Sinh viên', brand: 'MSI', cpu: 'Intel Core i5-1235U 10 nhân', ram: '16GB DDR4 3200MHz', ssd: '512GB NVMe PCIe', screen: '14" FHD IPS-Level chống chói viền mỏng', battery: '39.3Whr', ports: 'USB-C hỗ trợ sạc PD, 3x USB-A, HDMI, Khe thẻ microSD', weight: '1.40kg', price: 12990000, colors: ['Đen Cổ Điển Classic Black'] },
  { name: 'LG Gram 17 2024 Intel Core Ultra 7 155H 77Wh', brand: 'LG', cpu: 'Intel Core Ultra 7 155H chuẩn Intel Evo', ram: '32GB LPDDR5X', ssd: '1TB NVMe Gen 4 kép', screen: '17" WQXGA 2560x1600 IPS chống lóa DCI-P3 99%', battery: '77Whr chuẩn quân đội MIL-STD-810H', ports: '2x Thunderbolt 4, 2x USB-A 3.2, HDMI, Khe MicroSD', weight: '1.35kg', price: 44990000, colors: ['Trắng Tuyết Snow White', 'Xám Than Đen'] },
  { name: 'LG Gram Pro 16 2024 OLED RTX 3050 Siêu Nhẹ', brand: 'LG', cpu: 'Intel Core Ultra 7 155H card rời RTX 3050 4GB', ram: '32GB LPDDR5X', ssd: '1TB PCIe 4.0', screen: '16" WQXGA+ 2.8K OLED 120Hz 400 nits', battery: '90Whr', ports: '2x Thunderbolt 4, HDMI, 2x USB 3.2', weight: '1.27kg', price: 51990000, colors: ['Đen Nhám Obsidian Black'] },
  { name: 'Dell Alienware m16 R2 (Core Ultra 9 / RTX 4070)', brand: 'Dell', cpu: 'Intel Core Ultra 9 185H Buồng hơi Cryo-Tech', ram: '32GB DDR5 5600MHz', ssd: '1TB PCIe Gen 4', screen: '16" QHD+ 240Hz 3ms 100% sRGB ComfortView Plus', battery: '90Whr', ports: 'Thunderbolt 4, RJ-45 LAN 2.5G, HDMI 2.1', weight: '2.61kg', price: 62990000, colors: ['Xám Ánh Trăng Dark Metallic Moon'] },
  { name: 'Razer Blade 16 OLED (i9-14900HX / RTX 4080 / 32GB)', brand: 'Razer', cpu: 'Intel Core i9-14900HX Nhôm nguyên khối CNC Anodized', ram: '32GB DDR5 5600MHz', ssd: '1TB PCIe 4.0 NVMe', screen: '16" QHD+ 240Hz OLED 0.2ms chuẩn màu Calman Verified', battery: '95.2Whr', ports: 'Thunderbolt 4, 3x USB-A 3.2 Gen 2, HDMI 2.1, Khe thẻ SD UHS-II', weight: '2.45kg', price: 89990000, colors: ['Đen Anodized Logo Rắn Xanh'] },
  { name: 'Gigabyte AORUS 16X (i7-14650HX / RTX 4070 / AI Gaming)', brand: 'Gigabyte', cpu: 'Intel Core i7-14650HX Gi Boost AI Nexus', ram: '16GB DDR5 5600MHz', ssd: '1TB PCIe 4.0', screen: '16" WQXGA 165Hz 100% sRGB viền siêu mỏng 3mm', battery: '99Whr sạc nhanh 50% trong 30 phút', ports: 'Thunderbolt 4, HDMI 2.1, USB Type-A, Khe MicroSD', weight: '2.30kg', price: 44990000, colors: ['Xám Gunmetal'] },
  { name: 'Dell Inspiron 14 5440 Core i7-150U Kim loại', brand: 'Dell', cpu: 'Intel Core i7-150U 10 nhân 12 luồng 5.4GHz', ram: '16GB DDR5 5200MHz', ssd: '1TB M.2 PCIe NVMe', screen: '14" FHD+ 16:10 WVA chống chói 300 nits ComfortView', battery: '54Whr', ports: 'USB-C 3.2 Gen 2 sạc PD, 2x USB-A, HDMI 1.4', weight: '1.54kg', price: 23990000, colors: ['Bạc Băng Ice Blue'] },
  { name: 'Lenovo IdeaPad Slim 5 14IRH8 Core i7-13620H', brand: 'Lenovo', cpu: 'Intel Core i7-13620H 10 nhân 16 luồng hiệu năng cao', ram: '16GB LPDDR5 5200MHz', ssd: '512GB SSD NVMe', screen: '14" WUXGA OLED 100% DCI-P3 400 nits DisplayHDR True Black 500', battery: '56.6Whr', ports: '2x USB-C đầy đủ tính năng, 2x USB-A, HDMI 1.4b', weight: '1.46kg', price: 19990000, colors: ['Xám Bão Storm Grey'] },
  { name: 'ASUS Vivobook 15 X1504VA Core i5-1335U Kháng khuẩn', brand: 'ASUS', cpu: 'Intel Core i5-1335U 10 nhân 12 luồng', ram: '16GB DDR4', ssd: '512GB PCIe Gen 4', screen: '15.6" FHD IPS NanoEdge góc nhìn 178 độ', battery: '42Whr lớp phủ ion bạc kháng khuẩn ASUS Antimicrobial Guard', ports: 'USB-C, USB-A 3.2, USB 2.0, HDMI', weight: '1.70kg', price: 14490000, colors: ['Xanh Yên Tĩnh Quiet Blue', 'Bạc'] },
  { name: 'Acer Aspire 5 A515 Core i5-13420H Đồ họa văn phòng', brand: 'Acer', cpu: 'Intel Core i5-13420H 8 nhân 12 luồng', ram: '16GB DDR5', ssd: '512GB PCIe NVMe', screen: '15.6" FHD IPS Acer ComfyView chống mỏi mắt', battery: '50Whr', ports: 'Thunderbolt 4 Type-C, 2x USB 3.2, HDMI 2.1', weight: '1.78kg', price: 13990000, colors: ['Xám Thép Steel Grey'] }
];

export function generateLaptops(): ProductSeedItem[] {
  return laptopData.map((l) => {
    const desc = `### 1. Tổng quan & Định vị phân khúc
${l.name} là cỗ máy tính xách tay cao cấp đại diện cho phân khúc laptop hiệu năng cao của hãng ${l.brand}. Sản phẩm được tối ưu hóa cho các kỹ sư phần mềm, nhà thiết kế đồ họa 3D, kiến trúc sư, chuyên viên dựng phim 4K/8K và giới doanh nhân đòi hỏi sự bền bỉ, sang trọng cùng hiệu suất xử lý tác vụ vượt trội.

### 2. Thông số kỹ thuật chi tiết (Technical Specifications)
- **Thương hiệu:** ${l.brand}
- **Bộ vi xử lý trung tâm (CPU):** ${l.cpu}
- **Bộ nhớ RAM:** ${l.ram}
- **Ổ cứng lưu trữ (SSD):** ${l.ssd}
- **Màn hình hiển thị:** ${l.screen}
- **Dung lượng Pin & Thời lượng:** ${l.battery}
- **Cổng kết nối vật lý:** ${l.ports}
- **Trọng lượng & Kích thước máy:** ${l.weight}, độ mỏng tinh tế, hoàn thiện từ hợp kim nguyên khối
- **Bàn phím & Touchpad:** Bàn phím công thái học có đèn nền LED, Touchpad kính phủ nano cảm ứng đa điểm siêu rộng
- **Bảo mật sinh trắc học:** Nhận diện khuôn mặt Windows Hello / Cảm biến vân tay Touch ID một chạm
- **Hệ điều hành:** Bản quyền Windows 11 / macOS cài sẵn theo máy

### 3. Công nghệ nổi trội & Hỗ trợ AI
- Tích hợp chip xử lý NPU AI chuyên biệt tăng tốc xử lý các mô hình ngôn ngữ lớn, khử ồn micro đàm thoại bằng AI và tự động làm mờ hậu cảnh webcam chuẩn studio.
- Hệ thống tản nhiệt buồng hơi buồng kép hoặc quạt khí động học giúp máy duy trì xung nhịp đỉnh cao trong thời gian dài mà không bị quá nhiệt.

### 4. Đánh giá & Khuyến nghị so sánh
- **Ưu điểm cốt lõi:** Tốc độ xử lý đa nhiệm ấn tượng, màn hình hiển thị xuất sắc đạt chuẩn màu đồ họa quốc tế, bàn phím gõ êm ái.
- **Đối tượng sử dụng:** Lập trình viên, chuyên viên sáng tạo nội dung, doanh nhân cần một chiếc laptop chuẩn mực.
- **Tiêu chí so sánh cấu hình AI:** Dễ dàng đối chiếu dung lượng RAM, thông số CPU/GPU và chuẩn màn hình với các đối thủ cùng tầm giá.`;

    const variants = l.colors.map((c, idx) => ({
      attributes: { color: c, ram: l.ram, ssd: l.ssd },
      price: l.price,
      stock_quantity: 25 + idx * 10
    }));

    return {
      name: l.name,
      categorySlug: 'laptops',
      brand: l.brand,
      price: l.price,
      description: desc,
      images: l.name.includes('MacBook') ? TECH_IMAGES.macbook : TECH_IMAGES.laptop_gaming,
      variants
    };
  });
}
