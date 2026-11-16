import { TECH_IMAGES } from './dataset_data';
import { ProductSeedItem } from './products_catalog_500';

// ==========================================
// 1. ROBOT VACUUM & CLEANING (25 ITEMS)
// ==========================================
const robotVacuumData = [
  { name: 'Robot Hút Bụi Lau Nhà Roborock S8 MaxV Ultra Lực Hút 10.000Pa Trạm Omni', brand: 'Roborock', power: 'Lực hút siêu khủng 10.000Pa', nav: 'Điều hướng LiDAR PreciSense kết hợp Camera AI Reactive AI 2.0 nhận diện né tránh 73 loại vật cản', mop: 'Lau rung âm VibraRise 3.0 tần số 4000 lần/phút + Chổi lau cạnh FlexiArm vươn sát góc tường 100%', dock: 'Trạm sạc 8 trong 1: Giặt giẻ nước nóng 60°C, Sấy khô khí nóng, Tự xả rác 60 ngày, Tự pha nước lau sàn', battery: '5200mAh (làm sạch 300m²)', noise: '67dB', price: 29990000, colors: ['Trắng Sang Trọng White', 'Đen Midnight Black'] },
  { name: 'Robot Hút Bụi Lau Nhà Dreame X40 Ultra Lực Hút 12.000Pa Xòe Giẻ Lau Góc', brand: 'Dreame', power: 'Lực hút vô địch 12.000Pa Vormax', nav: 'Cảm biến AI Action 3D ánh sáng cấu trúc kép né tránh đồ chơi dây điện', mop: 'Công nghệ MopExtend RoboSwing vươn giẻ lau chân tường và chân bàn ghế góc chết', dock: 'Trạm sạc giặt giẻ nước nóng 70°C diệt khuẩn 99.99%, tự động tháo lắp giẻ lau khi hút thảm', battery: '6400mAh sạc nhanh hơn 30%', noise: '65dB', price: 28990000, colors: ['Trắng Ngọc Trai', 'Đen Ánh Kim'] },
  { name: 'Robot Hút Bụi Lau Nhà Ecovacs Deebot T30 Pro Omni Lực Hút 11.000Pa Nhỏ Gọn', brand: 'Ecovacs', power: 'Lực hút mạnh mẽ 11.000Pa', nav: 'TrueMapping 2.0 LiDAR + 3D TrueDetect tránh va chạm nhạy bén', mop: 'Công nghệ TruEdge xòe giẻ lau sát mép 1mm, Chống rối tóc ZeroTangle độc quyền', dock: 'Mini Omni Station gọn gàng chiều cao chỉ 48cm, Giặt giẻ nước nóng 70°C tự động', battery: '5200mAh', noise: '65dB', price: 16990000, colors: ['Bạc Xám Silver', 'Trắng Tinh Khôi'] },
  { name: 'Robot Hút Bụi Lau Nhà Ecovacs Deebot X2 Omni Thiết Kế Vuông Góc 8000Pa', brand: 'Ecovacs', power: 'Lực hút 8000Pa thiết kế hình chữ D vuông vức làm sạch mép góc 99.77%', nav: 'Công nghệ LiDAR bán dẫn Dual-laser LiDAR tích hợp thân máy siêu mỏng chỉ 9.5cm chui gầm sofa giường', mop: 'Lau xoay Ozmo Turbo 2.0 tạo áp lực miết sàn', dock: 'Trạm Omni tự động xả rác, giặt giẻ nước nóng 55°C, sấy khí nóng 2 giờ', battery: '6400mAh', noise: '68dB', price: 22490000, colors: ['Đen Midnight', 'Trắng'] },
  { name: 'Robot Hút Bụi Lau Nhà Xiaomi Robot Vacuum X20+ Trạm Đa Năng 6000Pa Giá Tốt', brand: 'Xiaomi', power: 'Lực hút 6000Pa', nav: 'Điều hướng Laser LDS quét 360 độ nhanh chóng toàn bộ ngôi nhà', mop: 'Hai giẻ lau xoay kép 180 vòng/phút, Tự động nâng giẻ lau 7mm khi lên thảm', dock: 'Tự động giặt giẻ và thổi khô, Túi rác tự động gom 75 ngày mới cần đổ', battery: '5200mAh', noise: '65dB', price: 9490000, colors: ['Trắng Tinh Khôi Mi Home'] },
  { name: 'Máy Hút Bụi Không Dây Dyson V15 Detect Absolute Tia Laser Soi Bụi Mịn', brand: 'Dyson', power: 'Công suất hút 240AW động cơ Dyson Hyperdymium 125.000 vòng/phút', nav: 'Đầu hút Fluffy Optic trang bị chùm tia laser xanh soi rõ bụi mịn vô hình trên sàn cứng', mop: 'Cảm biến Piezo đo kích thước và đếm số lượng hạt bụi hiển thị trực tiếp trên màn hình LCD', dock: 'Pin click-in tháo rời chạy liên tục 60 phút không suy giảm lực hút, trạm sạc treo tường', battery: '60 phút vận hành', noise: '72dB', price: 19990000, colors: ['Vàng Đồng Kim Loại & Xám Sắt'] },
  { name: 'Máy Hút Bụi Không Dây Dyson Gen5detect Động Cơ Siêu Mạnh 280AW Lọc HEPA', brand: 'Dyson', power: 'Lực hút mạnh nhất lịch sử Dyson 280 Air Watts', nav: 'Hệ thống lọc toàn thân HEPA kín kẽ giữ lại 99.99% hạt bụi siêu nhỏ 0.1 micron', mop: 'Đầu hút chống rối tóc Hair Screw Tool gỡ tóc động cơ hình nón độc quyền', dock: 'Thời lượng pin ấn tượng lên tới 70 phút sử dụng liên tục', battery: '70 phút', noise: '74dB', price: 23990000, colors: ['Tím Hoàng Gia & Xám Sắt Dyson'] },
  { name: 'Máy Hút Bụi Lau Sàn Cầm Tay Dreame H12 Pro Cuộn Lăn Tràn Viền Giặt Sấy', brand: 'Dreame', power: 'Công suất 300W lực hút 16.000Pa hút và lau ướt cùng lúc', nav: 'Cảm biến độ bẩn thông minh tự điều chỉnh lực hút và lượng nước theo thời gian thực', mop: 'Cuộn lăn tràn cả 2 viền sát chân tường 0mm, Chế độ tự làm sạch cuộn lăn bằng nước nóng và sấy khô 55°C', dock: 'Trạm sạc tự động làm sạch và sấy khô không mùi hôi ẩm mốc', battery: '6x 4000mAh hoạt động liên tục 35 phút', noise: '74dB', price: 9990000, colors: ['Đen Nhám Titan'] },
  { name: 'Máy Hút Bụi Lau Sàn Tineco Floor One S5 Combo Đa Năng 2 Trong 1', brand: 'Tineco', power: 'Lực hút tự động công nghệ cảm biến thông minh iLoop Smart Sensor', nav: 'Chuyển đổi linh hoạt giữa máy lau sàn ướt và máy hút bụi khô cầm tay', mop: 'Bình chứa nước sạch 0.8L và nước bẩn 0.7L dung tích lớn tách rời', dock: 'Đế sạc 3 trong 1 tự làm sạch cuộn chổi', battery: '35 phút lau sàn', noise: '72dB', price: 8990000, colors: ['Trắng Đen Phối Đậm'] },
  { name: 'Robot Hút Bụi Lau Nhà Roborock Q Revo MaxV Lực Hút 7000Pa Giặt Nước Nóng 60°C', brand: 'Roborock', power: 'Lực hút 7000Pa', nav: 'Trợ lý giọng nói thông minh Hello Rocky điều khiển không cần mạng', mop: 'Cánh tay cơ học vươn giẻ lau FlexiArm sát góc chân tường 1.85mm', dock: 'Dock sạc toàn năng giặt giẻ nước nóng 60°C và sấy khô khí nóng 45°C êm ái', battery: '5200mAh', noise: '63dB', price: 18990000, colors: ['Trắng White'] },
  { name: 'Robot Hút Bụi iRobot Roomba j9+ Nhận Diện Tránh Chất Thải Thú Cưng', brand: 'iRobot', power: 'Hệ thống làm sạch 3 giai đoạn lực hút nâng cao gấp 100% dòng 600', nav: 'Công nghệ PrecisionVision nhận diện và tránh dây cáp, tất vớ và chất thải vật nuôi P.O.O.P', mop: 'Chổi cao su kép chống rối tóc lông thú cưng', dock: 'Trạm Clean Base thiết kế vân gỗ nội thất tự động hút bụi vào túi chứa suốt 60 ngày', battery: '120 phút hoạt động', noise: '66dB', price: 21990000, colors: ['Đen Mặt Gỗ Nâu Sang Trọng'] },
  { name: 'Máy Giặt Thảm Đệm Cầm Tay Tineco Carpet One Spot Làm Sạch Vết Bẩn Tự Động', brand: 'Tineco', power: 'Công suất hút sâu loại bỏ bùn đất, vết ố cà phê, nước tiểu thú cưng trên sofa và đệm', nav: 'Cảm biến iLoop tự phát hiện mức độ ố bẩn đổi vòng đèn đỏ sang xanh khi sạch', mop: 'Bàn chải con lăn xoay cơ học đánh bật vết bẩn cứng đầu', dock: 'Tự súc rửa đường ống và đầu hút tại chân đế sạc', battery: 'Không dây pin 25 phút', noise: '70dB', price: 6990000, colors: ['Trắng Phối Đen'] },
  { name: 'Máy Lau Kính Tự Động Ecovacs Winbot W2 Omni Trạm Đa Năng Di Động', brand: 'Ecovacs', power: 'Lực hút chân không bám kính 5500Pa an toàn tuyệt đối', nav: 'Hệ thống định vị WIN-SLAM 3.0 lau sạch toàn bộ mặt kính cửa sổ nhà cao tầng', mop: 'Công nghệ phun sương nước áp lực cao 3 vòi phun kép đánh tan bụi bẩn bám dính', dock: 'Hộp trạm sạc tích hợp pin dùng 110 phút không cần cắm điện rườm rà, có dây an toàn chịu tải 100kg', battery: 'Pin tích hợp trạm sạc', noise: '62dB', price: 13990000, colors: ['Xám Bạc Kim Loại'] },
  { name: 'Máy Hút Bụi Giường Nệm Diệt Khuẩn Tia UV Deerma CM800 Rung Đập 8000 Lần/Phút', brand: 'Deerma', power: 'Công suất 450W lực hút 13.000Pa', nav: 'Cảm biến nhiệt gió nóng 50°C hong khô đệm diệt rệp bọ ẩm mốc', mop: 'Đèn cực tím UV-C bước sóng 253.7nm phá hủy cấu trúc DNA vi khuẩn rệp giường', dock: 'Dây điện dài 4m tiện di chuyển trên giường đôi', battery: 'Cắm điện 220V trực tiếp', noise: '75dB', price: 690000, colors: ['Trắng Tinh Khôi'] },
  { name: 'Robot Hút Bụi Xiaomi Mi Robot Vacuum Mop 2 Pro Lau Rung Sóng Âm 10.000 Lần/Phút', brand: 'Xiaomi', power: 'Lực hút mạnh 3000Pa', nav: 'Định vị Laser LDS thế hệ mới lập bản đồ đa tầng nhà', mop: 'Công nghệ lau rung tần số cao 10.000 lần/phút mô phỏng động tác lau nhà thủ công', dock: 'Đế sạc tự động quay về nạp điện khi pin yếu', battery: '5200mAh', noise: '64dB', price: 5990000, colors: ['Trắng', 'Đen'] },
  { name: 'Máy Hút Bụi Cầm Tay Đa Năng Baseus A3 Lực Hút 15.000Pa Vệ Sinh Nội Thất Ô Tô', brand: 'Baseus', power: 'Lực hút 15.000Pa động cơ không chổi than 80.000 vòng/phút', nav: 'Cảm biến bụi thông minh tự tăng lực hút khi gặp mẩu rác to', mop: 'Đèn LED chiếu sáng các góc khuất hộc cửa, gầm ghế xe hơi', dock: 'Cổng sạc Type-C chuẩn sạc nhanh QC 3.0', battery: '4x 2000mAh dùng liên tục 50 phút', noise: '75dB', price: 1290000, colors: ['Đen Nhám Kim Loại', 'Bạc'] },
  { name: 'Máy Làm Sạch Hơi Nước Nóng Karcher SC 3 EasyFix Khử Khuẩn 99.99% Không Hóa Chất', brand: 'Kärcher', power: 'Công suất làm nóng 1900W áp suất hơi 3.5 bar siêu mạnh', nav: 'Sẵn sàng phun hơi nước chỉ sau 30 giây làm nóng', mop: 'Đầu lau sàn EasyFix với khớp nối linh hoạt và khăn lau vi sợi microfiber tháo dán', dock: 'Nạp nước liên tục không cần chờ nồi nguội', battery: 'Cắm điện trực tiếp dây 4m', noise: 'Êm ái không ồn', price: 4290000, colors: ['Vàng Đặc Trưng Karcher & Đen'] },
  { name: 'Robot Hút Bụi Dreame D9 Max Gen 2 Lực Hút 6000Pa Vượt Chướng Ngại Vật 20mm', brand: 'Dreame', power: 'Lực hút nâng cấp 6000Pa', nav: 'Điều hướng Smart Pathfinder LDS chính xác trong bóng tối', mop: 'Khay nước điện tử 3 mức điều chỉnh độ ẩm giẻ lau', dock: 'Hộp chứa bụi dung tích lớn 570ml', battery: '5200mAh dọn dẹp liên tục 180 phút', noise: '65dB', price: 5490000, colors: ['Đen Nhám Huyền Bí'] },
  { name: 'Máy Hút Bụi Không Dây Philips SpeedPro Max FC6813 Đầu Hút 360 Độ', brand: 'Philips', power: 'Động cơ kỹ thuật số PowerBlade tạo luồng khí 1000 lít/phút', nav: 'Đầu hút tích hợp đèn LED 360 độ hút sạch bụi từ mọi hướng di chuyển', mop: 'Hệ thống lọc 3 lớp giữ lại các hạt phấn hoa và lông thú cưng', dock: 'Đế sạc gắn tường nam châm', battery: 'Pin Li-ion 25.2V vận hành 45 phút', noise: '76dB', price: 6990000, colors: ['Đỏ Nổi Bật Phối Xám'] },
  { name: 'Robot Hút Bụi Ecovacs Deebot N20 Pro Plus Lực Hút 8000Pa Chống Rối Tóc', brand: 'Ecovacs', power: 'Lực hút 8000Pa vượt trội trong tầm giá', nav: 'TrueMapping điều hướng laser nhanh chóng', mop: 'Lau rung âm OZMO Pro 2.0 tẩy sạch vết cafe khô cứng', dock: 'Trạm Auto-Empty gom bụi tự động bằng công nghệ lốc xoáy PureCyclone không cần túi rác', battery: '5200mAh', noise: '66dB', price: 8990000, colors: ['Trắng Hiện Đại'] },
  { name: 'Máy Lau Nhà Hơi Nước Cầm Tay Deerma DEM-ZQ600 5 Đầu Hút Đa Năng Khử Khuẩn', brand: 'Deerma', power: 'Công suất 1700W nhiệt độ hơi nước 150°C diệt sạch vi khuẩn', nav: 'Làm nóng nhanh trong 20 giây', mop: 'Gồm 5 đầu bàn chải lau sàn gạch, kính cửa sổ, bếp ga dầu mỡ, kẽ gạch nhà tắm', dock: 'Bình chứa nước 230ml tháo rời dễ dàng', battery: 'Dây nguồn 4m', noise: 'Rất êm', price: 1190000, colors: ['Trắng Đỏ Tươi'] },
  { name: 'Máy Hút Bụi Nước Công Nghiệp TiTiKa 15L Công Suất 1500W Vệ Sinh Nhà Xưởng', brand: 'TiTiKa', power: 'Công suất 1500W lực hút chân không cực khỏe 20kPa', nav: 'Hút cả rác khô rác ướt và nước tràn ngập sàn nhà', mop: 'Thùng chứa bằng inox không gỉ dung tích 15 lít bền bỉ', dock: 'Bánh xe 360 độ di chuyển dễ dàng kèm ống hút dài', battery: 'Điện 220V', noise: '78dB', price: 1350000, colors: ['Bạc Inox & Xanh'] },
  { name: 'Robot Hút Bụi Thông Minh ILIFE V8s Chuyên Hút Tóc Và Lông Thú Cưng', brand: 'ILIFE', power: 'Động cơ hút Nidec Nhật Bản lực hút 1400Pa không bị quấn tóc', nav: 'Lập trình đường đi thông minh i-Move zigzag không bỏ sót', mop: 'Bình chứa nước i-Dropping tự ngắt nước khi robot đứng yên', dock: 'Màn hình LCD lớn hiển thị trạng thái và giờ hẹn', battery: '2600mAh', noise: '60dB siêu êm', price: 3490000, colors: ['Bạc Titan'] },
  { name: 'Máy Hút Bụi Cầm Tay Không Dây Mini Deerma VC20 Plus 5500Pa Siêu Nhẹ 1kg', brand: 'Deerma', power: 'Công suất 150W lực hút 5500Pa', nav: 'Thiết kế trọng tâm thấp đặt đứng thẳng vững chãi không cần giá đỡ', mop: 'Đầu chổi lăn điện có motor xoay độc lập đánh bay bụi thảm', dock: 'Cổng sạc pin chuyển đổi', battery: '2200mAh chạy 30 phút', noise: '70dB', price: 1090000, colors: ['Trắng Viền Vàng Kim'] },
  { name: 'Robot Lau Cửa Kính Tự Động HOBOT-2S Kép Phun Nước Siêu Âm Kết Nối App', brand: 'HOBOT', power: 'Lực hút bám kính 7kg chống rơi an toàn tích hợp pin dự phòng UPS 20 phút', nav: 'Cảm biến quang học phát hiện cạnh kính không khung mép', mop: '2 vòi phun sương siêu âm hạt nước 15 micron làm sạch không để lại vệt nước', dock: 'Điều khiển qua điện thoại Bluetooth và Remote', battery: 'Dây nguồn có ốc khóa xoay an toàn', noise: '64dB', price: 8990000, colors: ['Trắng Sứ Sang Trọng'] }
];

export function generateHomeAppliances(): ProductSeedItem[] {
  return robotVacuumData.map((r) => {
    const desc = `### 1. Tổng quan & Định vị sản phẩm
${r.name} là giải pháp vệ sinh và làm sạch thông minh đỉnh cao từ thương hiệu ${r.brand}. Thiết bị được thiết kế nhằm tự động hóa hoàn toàn công việc lau dọn nhà cửa, giúp bạn tiết kiệm thời gian quý báu mà vẫn duy trì không gian sống sạch khuẩn, trong lành cho cả gia đình.

### 2. Thông số kỹ thuật chi tiết (Technical Specifications)
- **Thương hiệu:** ${r.brand}
- **Công suất & Lực hút động cơ:** ${r.power}
- **Hệ thống điều hướng & Cảm biến thông minh:** ${r.nav}
- **Cơ chế lau sàn & Khăn lau:** ${r.mop}
- **Trạm sạc đa năng (Dock Station):** ${r.dock}
- **Thời lượng Pin & Khả năng dọn dẹp:** ${r.battery}
- **Mức độ ồn khi vận hành:** ${r.noise}
- **Kết nối thông minh:** Wi-Fi 2.4GHz, điều khiển từ xa qua ứng dụng di động tiếng Việt

### 3. Công nghệ nổi bật & Thuật toán AI
- Nhận diện đồ vật bằng Camera AI và cảm biến 3D, tự động phân loại vết bẩn cứng đầu để tăng áp lực miết sàn.
- Tự động nhận diện thảm trải sàn để nâng cao giẻ lau, ngăn nước làm ướt thảm.

### 4. Đánh giá & Khuyến nghị sử dụng
- **Ưu điểm cốt lõi:** Lực hút vượt trội, vận hành tự động khép kín từ hút bụi đến giặt sấy giẻ nóng.
- **Đối tượng sử dụng:** Nhà phố nhiều tầng, căn hộ chung cư cao cấp diện tích lớn.`;

    const variants = r.colors.map((c, idx) => ({
      attributes: { color: c, brand: r.brand },
      price: r.price,
      stock_quantity: 20 + idx * 5
    }));

    return {
      name: r.name,
      categorySlug: 'robot-vacuum',
      brand: r.brand,
      price: r.price,
      description: desc,
      images: TECH_IMAGES.robot_vacuum,
      variants
    };
  });
}

// ==========================================
// 2. KITCHEN APPLIANCES (25 ITEMS)
// ==========================================
const kitchenData = [
  { name: 'Nồi Chiên Không Dầu Philips HD9880/90 Connected Airfryer XXL 8.3L', brand: 'Philips', cap: '8.3L (nấu 7 phần ăn hoặc nguyên con gà 3kg)', power: '2200W Rapid CombiAir công nghệ đối lưu tự động chỉnh luồng khí', temp: '40°C - 200°C hỗ trợ sấy dẻo và ủ bột', tech: 'Nhiệt kế đo thực phẩm tích hợp đo nhiệt độ tâm miếng bít tết chuẩn xác, Kết nối ứng dụng NutriU hơn 500 công thức AI', clean: 'Lòng nồi QuickClean chống dính cao cấp tháo rời rửa máy rửa bát', price: 8990000, colors: ['Đen Nhám Viền Bạc'] },
  { name: 'Nồi Chiên Không Dầu Lock&Lock Silencer 5.2L Giảm Ồn 45dB Cửa Kính Đèn', brand: 'Lock&Lock', cap: '5.2L', power: '1800W khí nóng 360 độ giảm 85% chất béo', temp: '80°C - 200°C', tech: 'Công nghệ giảm ồn triệt để chỉ 45dB êm ái nhất thị trường, Cửa kính cường lực trong suốt và đèn chiếu sáng bên trong lòng nồi', clean: 'Lòng giỏ tráng Teflon chống dính', price: 2490000, colors: ['Trắng Ngà Tinh Tế', 'Đen'] },
  { name: 'Nồi Cơm Cao Tần Cuckoo CRP-LHTR0610FW 1.08L Áp Suất Kép Twin Pressure', brand: 'Cuckoo', cap: '1.08L (phù hợp gia đình 2-6 người)', power: '1090W công nghệ đốt nóng cảm ứng từ cao tần IH', temp: 'Nấu cơm áp suất cao 2 atm hạt cơm dẻo quánh hoặc nấu không áp suất cơm tơi xốp cho món sushi', tech: 'Lòng nồi gang đúc Eco Stainless Steel tráng men Xwall Black Shine chịu nhiệt cực đại, Van xả hơi nước tự động làm sạch', clean: 'Nắp phụ tháo rời một chạm rửa sạch', price: 9290000, colors: ['Trắng Tuyết Sang Trọng'] },
  { name: 'Nồi Cơm Điện Cao Tần Tiger JKT-D18V 1.8L Sản Xuất Tại Nhật Bản', brand: 'Tiger', cap: '1.8L (4-8 người ăn)', power: '1200W công nghệ từ tính IH đốt nóng đa chiều', temp: '130°C nhiệt độ cao giữ trọn vị ngọt tự nhiên của gạo', tech: 'Lòng nồi 3 lớp hợp kim phủ men gốm chống dính Ceramic tráng bạc hồng ngoại, 12 chế độ nấu tự động', clean: 'Nắp trong và van thoát hơi tháo rời', price: 8490000, colors: ['Nâu Đồng Kim Loại'] },
  { name: 'Lò Vi Sóng Điện Tử Có Nướng Panasonic NN-GD37HBYUE 23L Inverter Tiết Kiệm Điện', brand: 'Panasonic', cap: '23L khoang lò sơn tĩnh điện dễ lau chùi', power: 'Vi sóng 1000W + Nướng thạch anh 1000W', temp: 'Công nghệ biến tần Inverter nấu chín đều giữ trọn dinh dưỡng', tech: 'Chế độ rã đông siêu tốc Turbo Defrost theo khối lượng, 15 thực đơn tự động lập trình sẵn', clean: 'Đĩa xoay thủy tinh đường kính 285mm', price: 3490000, colors: ['Đen Gương Phối Bạc'] },
  { name: 'Máy Ép Chậm Hurom H400 Easy Clean Miệng Ép Nguyên Trái Trục Ép Đa Năng', brand: 'Hurom', cap: 'Khoang chứa 2 lít chứa vừa cả quả táo quả ổi không cần cắt nhỏ', power: '150W động cơ AC giảm tốc 90 vòng/phút siêu êm', temp: 'Ép lạnh không sinh nhiệt bảo toàn 100% vitamin và enzyme sống', tech: 'Trục ép tự cắt thông minh thế hệ mới không dùng lưới kim loại, xả sạch dưới vòi nước trong 30 giây', clean: 'Rửa sạch siêu nhanh Easy Clean', price: 9990000, colors: ['Trắng Ấm Warm White', 'Xám Đậm Titan', 'Vàng Cát'] },
  { name: 'Máy Xay Sinh Tố Chuyên Nghiệp Vitamix E310 Explorian Cối 1.4L Lưỡi Thép Cắt Laser', brand: 'Vitamix', cap: 'Cối nhựa Tritan không chứa BPA dung tích 1.4L', power: 'Động cơ 2.0 mã lực xay nát đá viên và hạt cứng trong vài giây', temp: 'Tốc độ ma sát quay lưỡi dao làm nóng súp nóng trực tiếp trong 6 phút', tech: 'Lưỡi dao thép không gỉ nguyên khối cắt bằng laser, 10 mức tốc độ biến thiên linh hoạt', clean: 'Tự làm sạch trong 60 giây chỉ với nước ấm và giọt xà phòng', price: 12900000, colors: ['Đen Đẳng Cấp Nhà Hàng'] },
  { name: 'Bếp Từ Đôi Bosch PPI82560MS Serie 8 Mặt Kính Schott Ceran Đức', brand: 'Bosch', cap: '2 vùng nấu từ kích thước lớn 180mm và 280mm', power: 'Tổng công suất 3500W chức năng Booster gia nhiệt siêu tốc 3100W/vùng', temp: '9 mức điều chỉnh nhiệt độ chính xác nấu lẩu rán xào', tech: 'Mặt kính gốm thủy tinh Schott Ceran Đức vát cạnh viền nhôm bo chống sứt mẻ, Cảm ứng nhận diện đáy nồi tự động', clean: 'Chống trầy xước lau chùi bóng loáng', price: 11490000, colors: ['Đen Kính Gốm Schott Ceran'] },
  { name: 'Nồi Áp Suất Đa Năng Instant Pot Pro 10-in-1 Dung Tích 5.7L Màn Hình Kỹ Thuật Số', brand: 'Instant Pot', cap: '5.7L lòng nồi đáy 3 lớp dùng được trên bếp từ', power: '1200W nấu nhanh hơn 70% so với phương pháp truyền thống', temp: '28 chương trình cài đặt thông minh: Nấu cơm, Hầm xương, Nấu chậm, Làm sữa chua, Sous-vide', tech: 'Van xả áp suất êm ái khuếch tán hơi nước Gentle Steam Release chống bắn nước bỏng tay', clean: 'Nắp và lòng nồi rửa được trong máy rửa bát', price: 4490000, colors: ['Đen Phối Thép Không Gỉ'] },
  { name: 'Máy Nấu Sữa Hạt Đa Năng Medion MD 19725 Nhập Khẩu Đức Tự Động Rửa', brand: 'Medion', cap: 'Bình chứa nước 1L và cối nấu thủy tinh cao cấp', power: 'Công suất nấu 1200W công suất xay 250W', temp: 'Tự động làm sạch cối bằng nhiệt độ cao và sấy khô tiệt trùng sau khi rót sữa', tech: '9 chương trình tự động: Sữa hạt, Súp nóng, Sinh tố, Nước sốt, Cà phê pha phin', clean: 'Tự động bơm nước và rửa sấy hoàn toàn tự động', price: 7990000, colors: ['Trắng Đen Phong Cách Châu Âu'] },
  { name: 'Máy Rửa Bát Độc Lập Bosch SMS46GI01P Serie 4 12 Bộ Đồ Ăn Châu Âu', brand: 'Bosch', cap: '12 bộ bát đĩa châu Âu khay VarioFlex sắp xếp linh hoạt', power: '2400W tiêu thụ chỉ 9.5 lít nước mỗi chu trình rửa Eco', temp: 'Nhiệt độ rửa 70°C diệt sạch dầu mỡ và vi khuẩn HygienePlus', tech: 'Động cơ EcoSilence Drive không chổi than êm ái 46dB, Cảm biến độ đục nước AquaSensor', clean: 'Hệ thống chống rò rỉ nước AquaStop bảo hành trọn đời', price: 13990000, colors: ['Inox Bạc Chống Vân Tay'] },
  { name: 'Máy Pha Cà Phê Tự Động DeLonghi Magnifica S ECAM 22.110.B Xay Hạt Tươi', brand: 'DeLonghi', cap: 'Ngăn chứa hạt cà phê 250g và bình nước 1.8L', power: '1450W áp suất bơm 15 bar chuẩn espresso Italy', temp: 'Hệ thống cấp nhiệt Thermoblock duy trì nhiệt độ pha chế hoàn hảo 92°C', tech: 'Cối xay tích hợp 13 cấp độ mịn lưỡi thép hình nón, Vòi đánh sữa Cappuccino truyền thống tạo bọt kem mịn', clean: 'Bộ phận pha tháo rời vệ sinh nhanh chóng', price: 14990000, colors: ['Đen Cổ Điển Magnifica'] },
  { name: 'Ấm Siêu Tốc Giữ Nhiệt Thông Minh Xiaomi Mi Smart Kettle Pro Màn Hình OLED', brand: 'Xiaomi', cap: '1.5L ruột inox 304 nguyên khối không mùi', power: '1800W đun sôi 1.5L nước chỉ trong 5 phút', temp: 'Bộ điều chỉnh nhiệt độ Strix chuẩn Anh Quốc kiểm soát chính xác 5 mức giữ ấm (40°C - 90°C)', tech: 'Màn hình OLED hiển thị nhiệt độ nước thời gian thực, Giữ ấm nước liên tục 12 giờ qua App Mi Home', clean: 'Thiết kế cách nhiệt 2 lớp chống bỏng tay', price: 890000, colors: ['Trắng Tinh Khôi Mi'] },
  { name: 'Máy Hút Mùi Kính Vát Canzy CZ 9979 Động Cơ Biến Tần Inverter 1400m3/h', brand: 'Canzy', cap: 'Mặt kính cường lực đen vát nghiêng sang trọng 700mm', power: 'Động cơ Smart Inverter hút cực khỏe 1400m³/h độ ồn thấp dưới 45dB', temp: 'Khử mùi bằng than hoạt tính hoặc đường ống thoát phi 150mm', tech: 'Cảm biến cử chỉ vẫy tay điều khiển không cần chạm tay dính dầu mỡ vào máy, Đèn LED chiếu sáng vùng nấu', clean: 'Lưới lọc nhôm inox thanh nan dễ ngâm rửa', price: 4990000, colors: ['Đen Kính Vát Hiện Đại'] },
  { name: 'Máy Ép Chậm Trục Ngang Hurom Chef GH-SBF06 Chuyên Ép Rau Cần Tây Làm Mì Sợi', brand: 'Hurom', cap: 'Trục ngang đa năng ép kiệt nước các loại rau nhiều xơ không lo kẹt máy', power: '150W tốc độ 70 vòng/phút', temp: 'Ép kiệt bã khô cong giữ trọn màu xanh diệp lục rau củ', tech: 'Gồm 4 đầu khuôn làm mì sợi, xúc xích, xay gia vị tỏi ớt, nghiền bột', clean: 'Dễ dàng tháo lắp phụ kiện', price: 7490000, colors: ['Bạc Titan Chải Xước'] },
  { name: 'Nồi Nấu Chậm Cách Thủy 2L Bear SUBE002 Thố Sứ 6 Thố Hầm Chưng Yến', brand: 'Bear', cap: '1 thố sứ lớn 2L + 4 thố sứ nhỏ 0.4L hầm nhiều món cùng lúc', power: '175W làm chín bằng hơi nước bao quanh thố sứ không làm trào nước canh', temp: 'Nấu chậm ở nhiệt độ sôi liu riu giữ trọn vẹn dinh dưỡng yến sào vi cá thuốc bắc', tech: '8 chế độ nấu tự động hẹn giờ nấu trước 9.5 tiếng', clean: 'Thố sứ tự nhiên tráng men chống bám mùi', price: 790000, colors: ['Vàng Nhạt Họa Tiết Retro'] },
  { name: 'Máy Làm Kem Tươi Gia Đình Cuisinart ICE-100 Có Lốc Làm Lạnh Tự Động', brand: 'Cuisinart', cap: 'Âu làm kem dung tích 1.4L', power: '150W máy nén khí Compressor thương mại tự làm lạnh sâu đến -30°C không cần để ngăn đá trước', temp: 'Giữ lạnh kem tươi lên đến 60 phút sau khi hoàn thành', tech: '2 cánh khuấy riêng biệt cho kem Gelato dẻo mịn và kem Sorbet xốp mềm', clean: 'Âu kem nhôm tráng men tháo rời', price: 7990000, colors: ['Thép Không Gỉ Sáng Bóng'] },
  { name: 'Lò Nướng Điện Đối Lưu Bluestone EOB-7588 56L Đèn Halogen Nướng Gà Nguyên Con', brand: 'Bluestone', cap: '56L khoang nướng cực rộng nướng bánh pizza gà tây', power: '2000W thanh nhiệt trên dưới kèm quạt đối lưu phân bổ nhiệt đồng đều', temp: '100°C - 230°C hẹn giờ 60 phút có chuông báo', tech: 'Tích hợp xiên quay 360 độ tự động cho món quay da giòn rụm', clean: 'Cửa kính 2 lớp cách nhiệt an toàn', price: 2390000, colors: ['Đen Viền Bạc'] },
  { name: 'Máy Làm Sữa Đậu Nành Tự Động Joyoung DJ13C-Q3 Nấu Không Cần Lọc Bã', brand: 'Joyoung', cap: '1.3L phục vụ gia đình 3-5 thành viên', power: 'Nấu 1000W xay 300W tốc độ 20.000 vòng/phút', temp: 'Gia nhiệt đa chiều đáy nồi hạt đậu chín mềm nhuyễn', tech: 'Dao cắt 3 cánh lượn sóng nghiền siêu mịn uống trực tiếp không cần lọc qua rây', clean: 'Ruột ấm inox 304 một khối', price: 2190000, colors: ['Nâu Cà Phê Sang Trọng'] },
  { name: 'Bếp Nướng Điện Không Khói Lock&Lock Grill EJG231 Công Suất 2000W Tiệc BBQ', brand: 'Lock&Lock', cap: 'Mặt vỉ nướng lớn 52cm nướng nhiều món cùng lúc', power: '2000W làm nóng thanh nhiệt tức thì trong 1 phút', temp: '5 mức chỉnh nhiệt độ có rơ-le tự ngắt chống quá nhiệt', tech: 'Bề mặt vỉ nướng có rãnh thoát mỡ thừa chảy xuống khay chứa bên dưới giảm khói 90%', clean: 'Lớp chống dính đá hoa cương không chứa PFOA', price: 890000, colors: ['Đen Nhám Thể Thao'] },
  { name: 'Máy Xay Thịt Đa Năng Cối Thủy Tinh Lock&Lock EJM171 2L 4 Lưỡi Dao Sắc Bén', brand: 'Lock&Lock', cap: 'Cối thủy tinh chịu lực dày dặn dung tích 2.0L', power: '300W động cơ đồng nguyên chất bền bỉ', temp: 'Tự ngắt khi quá nhiệt bảo vệ máy', tech: 'Hệ trục 4 lưỡi dao inox 304 xoay kép 2 tầng xay nhuyễn thịt cá cua tỏi ớt trong 15 giây', clean: 'Thủy tinh trong suốt rửa không bị bám mùi', price: 490000, colors: ['Bạc Inox & Thủy Tinh Trong'] },
  { name: 'Bình Thủy Điện Tử Tiger PDU-A50W 5.0L Giữ Nhiệt Bằng Công Nghệ Chân Không VE', brand: 'Tiger', cap: '5.0L nước sôi lớn dùng thoải mái cả ngày', power: '928W đun sôi nhanh và công nghệ giữ nhiệt chân không siêu tiết kiệm điện', temp: '4 mức giữ ấm (98°C pha trà đen, 90°C pha cafe, 80°C pha trà xanh, 70°C pha sữa bột trẻ em)', tech: 'Chế độ khử mùi Clo nước máy, Khóa an toàn chống trẻ em nghịch nước sôi', clean: 'Lòng bình tráng men fluororesin chống đóng cặn vôi', price: 5490000, colors: ['Xám Bạc Kim Loại'] },
  { name: 'Máy Đánh Trứng Để Bàn Trộn Bột Unold 68520 Công Suất 350W Thau Inox 2.5L', brand: 'Unold', cap: 'Thau trộn inox dung tích 2.5 lít xoay tự động', power: '350W mạnh mẽ đánh bông lòng trắng trứng trong 3 phút', temp: '5 tốc độ đánh + Nút nhồi Turbo cực mạnh', tech: 'Kèm 2 que đánh trứng phới lồng và 2 móc nhào bột bánh mì inox', clean: 'Tháo rời dễ dàng rửa sạch', price: 1690000, colors: ['Trắng Phối Bạc Đức'] },
  { name: 'Máy Sấy Bát Đĩa Tiệt Trùng Tia UV Malloca MSC-100A Để Bàn Khử Khuẩn 99.9%', brand: 'Malloca', cap: 'Dung tích 40L xếp được 10 bộ chén đĩa xoong nồi', power: '350W sấy khô bằng luồng khí nóng 70°C', temp: 'Diệt sạch nấm mốc và vi khuẩn trên bát đũa mùa nồm ẩm', tech: 'Đèn chiếu tia cực tím UV diệt khuẩn toàn diện, Khay đũa thìa inox không gỉ', clean: 'Cửa lật kính cường lực ngăn bụi bẩn côn trùng', price: 4490000, colors: ['Đen Kính Gương Hiện Đại'] },
  { name: 'Bộ Nồi Chảo Từ 5 Món Fissler Original-Profi Collection Nắp Inox Sản Xuất Tại Đức', brand: 'Fissler', cap: 'Gồm 3 nồi nấu canh (16cm, 20cm, 24cm), 1 quánh có tay cầm 16cm và 1 chảo chiên chống dính 24cm', power: 'Đáy nồi Cookstar độc quyền phân bổ nhiệt cực nhanh tiết kiệm 50% thời gian nấu', temp: 'Chịu nhiệt độ lò nướng lên tới 230°C', tech: 'Thép không gỉ 18/10 cao cấp tiêu chuẩn y tế Đức, Nắp nồi dập nặng giữ ẩm kín hơi tuần hoàn giọt nước Condensate-plus', clean: 'Rửa máy rửa bát an toàn sáng bóng trọn đời', price: 19900000, colors: ['Thép Bạc Chải Mờ Satin Fissler'] }
];

export function generateKitchen(): ProductSeedItem[] {
  return kitchenData.map((k) => {
    const desc = `### 1. Giới thiệu tổng quan & Phân khúc
${k.name} là thiết bị nhà bếp thông minh cao cấp từ thương hiệu gia dụng hàng đầu thế giới ${k.brand}. Sản phẩm là trợ thủ đắc lực trong gian bếp hiện đại, mang lại bữa ăn thơm ngon, chuẩn vị nhà hàng và an toàn tuyệt đối cho sức khỏe cả gia đình.

### 2. Thông số kỹ thuật chi tiết (Technical Specifications)
- **Thương hiệu:** ${k.brand}
- **Dung tích chứa / Quy cách:** ${k.cap}
- **Công suất tiêu thụ điện:** ${k.power}
- **Dải nhiệt độ & Chế độ nấu:** ${k.temp}
- **Công nghệ cốt lõi & Tính năng thông minh:** ${k.tech}
- **Tiêu chuẩn an toàn & Vệ sinh:** ${k.clean}
- **Nguồn điện vận hành:** Điện xoay chiều 220V - 240V / 50Hz tiêu chuẩn Việt Nam

### 3. Ưu điểm nổi bật
- Giữ trọn dưỡng chất và hương vị tự nhiên của thực phẩm, giảm thiểu dầu mỡ và chất béo có hại.
- Vật liệu chế tạo cao cấp, không chứa chì hoặc hợp chất PFOA độc hại, an toàn tuyệt đối khi tiếp xúc với thực phẩm nóng.

### 4. Đối tượng sử dụng phù hợp
- Gia đình yêu thích nấu nướng, người theo đuổi lối sống Eat Clean lành mạnh và các cặp vợ chồng trẻ hiện đại.`;

    const variants = k.colors.map((c, idx) => ({
      attributes: { color: c, brand: k.brand },
      price: k.price,
      stock_quantity: 25 + idx * 5
    }));

    return {
      name: k.name,
      categorySlug: 'kitchen-appliances',
      brand: k.brand,
      price: k.price,
      description: desc,
      images: TECH_IMAGES.kitchen,
      variants
    };
  });
}
