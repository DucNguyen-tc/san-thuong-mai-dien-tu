# BỘ CHUẨN HÓA THÔNG SỐ KỸ THUẬT SẢN PHẨM (SPECS SCHEMA)

Tài liệu này định nghĩa cấu trúc trường `specs` (JSONB) cho từng danh mục sản phẩm trong Catalog Service. Toàn bộ tên key sử dụng tiếng Anh dạng `snake_case`, giá trị có đơn vị đo lường rõ ràng để phục vụ việc trích xuất và so sánh sản phẩm tự động bằng mô hình AI.

---

## 1. Điện thoại (`smartphones`)
```json
{
  "brand": "string",
  "model": "string",
  "chip": "string",
  "ram_gb": 8,
  "storage_gb": 256,
  "storage_options_gb": [128, 256, 512],
  "display": {
    "size_inch": 6.7,
    "panel": "OLED / AMOLED / IPS LCD",
    "resolution": "2796x1290",
    "refresh_rate_hz": 120,
    "brightness_nits": 2000
  },
  "camera": {
    "main_mp": 48,
    "ultrawide_mp": 48,
    "telephoto_mp": 12,
    "selfie_mp": 12,
    "features": ["OIS", "4K 60fps", "Night Mode"]
  },
  "battery_mah": 4685,
  "charging_watt": 30,
  "wireless_charging": true,
  "os": "iOS / Android",
  "port": "USB-C",
  "sim": "Dual SIM (Nano + eSIM)",
  "weight_g": 227,
  "water_resistance": "IP68",
  "connectivity": ["5G", "Wi-Fi 7", "Bluetooth 5.4", "NFC"]
}
```

---

## 2. Máy tính xách tay (`laptops`)
```json
{
  "brand": "string",
  "model": "string",
  "cpu": "string (vd: Intel Core i7-13700H / Apple M3 Pro)",
  "gpu": "string (vd: NVIDIA RTX 4060 8GB / Apple 14-core GPU)",
  "ram_gb": 16,
  "ram_type": "DDR5 / LPDDR5X",
  "storage_gb": 512,
  "storage_type": "PCIe NVMe SSD",
  "display": {
    "size_inch": 14.2,
    "resolution": "3024x1964",
    "panel": "Mini-LED / IPS / OLED",
    "refresh_rate_hz": 120,
    "color_gamut": "100% DCI-P3"
  },
  "battery_wh": 70,
  "battery_life_hours": 12,
  "os": "macOS / Windows 11",
  "ports": ["Thunderbolt 4", "HDMI 2.1", "SDXC Card", "3.5mm Jack"],
  "weight_kg": 1.6,
  "material": "Nhôm nguyên khối",
  "keyboard": "Bàn phím có đèn nền LED"
}
```

---

## 3. Máy tính bảng (`tablets`)
```json
{
  "brand": "string",
  "model": "string",
  "chip": "string",
  "ram_gb": 8,
  "storage_gb": 128,
  "display": {
    "size_inch": 11.0,
    "resolution": "2388x1668",
    "panel": "Tandem OLED / Liquid Retina",
    "refresh_rate_hz": 120
  },
  "camera": {
    "main_mp": 12,
    "selfie_mp": 12
  },
  "battery_mah": 8160,
  "stylus_support": true,
  "keyboard_support": true,
  "os": "iPadOS / Android",
  "port": "USB-C",
  "weight_g": 444
}
```

---

## 4. Thiết bị đeo thông minh (`smartwatch` & đồng hồ điện tử)
```json
{
  "brand": "string",
  "model": "string",
  "screen_inch": 1.4,
  "display_type": "AMOLED / Always-On Retina",
  "case_size_mm": 45,
  "case_material": "Nhôm / Thép không gỉ / Titan",
  "battery_life_days": 2,
  "water_resistance": "5 ATM / 50m / IP68",
  "sensors": ["Heart Rate", "SpO2", "ECG", "Sleep Tracker", "GPS"],
  "connectivity": ["Bluetooth 5.3", "Wi-Fi", "eSIM"],
  "strap_material": "Silicone / Dây da / Dây kim loại",
  "weight_g": 38,
  "os_compatibility": ["iOS", "Android"]
}
```

---

## 5. Đồng hồ thời trang (`mens-watches`, `womens-watches`, `watches-jewelry`)
```json
{
  "brand": "string",
  "model": "string",
  "movement": "Automatic (Cơ tự động) / Quartz (Pin) / Solar (Năng lượng mặt trời)",
  "case_size_mm": 40,
  "case_thickness_mm": 11,
  "case_material": "Thép không gỉ 316L / Mạ vàng PVD",
  "water_resistance_m": 50,
  "strap_material": "Da thật / Thép không gỉ",
  "glass_type": "Sapphire nguyên khối chống trầy / Kính khoáng Mineral",
  "dial_color": "Đen / Trắng / Xanh Navy",
  "origin": "Nhật Bản / Thụy Sĩ"
}
```

---

## 6. Tai nghe & Thiết bị âm thanh (`audio`, `mobile-accessories`)
```json
{
  "brand": "string",
  "type": "TWS Earbuds / Over-ear Headphones / Portable Bluetooth Speaker",
  "driver_size_mm": 11,
  "battery_life_hours": 8,
  "total_battery_with_case_hours": 30,
  "charging_time_hours": 1.5,
  "fast_charging": "10 phút sạc dùng 2 giờ",
  "connectivity": ["Bluetooth 5.3", "USB-C", "Jack 3.5mm"],
  "codecs": ["AAC", "SBC", "LDAC"],
  "noise_cancellation": "Active Noise Cancellation (ANC)",
  "mic_count": 4,
  "water_resistance": "IPX4 / IPX7",
  "weight_g": 48
}
```

---

## 7. Phụ kiện công nghệ (`accessories`, `mobile-accessories`)
```json
{
  "brand": "string",
  "accessory_type": "Củ sạc nhanh / Pin dự phòng / Cáp sạc / Giá đỡ điện thoại / Bao da",
  "output_power_w": 65,
  "battery_capacity_mah": 10000,
  "input_ports": ["USB-C"],
  "output_ports": ["USB-C", "USB-A"],
  "fast_charging_protocols": ["PD 3.0", "QC 4.0", "PPS"],
  "cable_length_m": 1.2,
  "material": "Nhựa chống cháy PC/ABS / Hợp kim nhôm / Dây dù bện",
  "weight_g": 180
}
```

---

## 8. Máy ảnh & Thiết bị ghi hình (`cameras`, `action-cam-gimbal`, `lenses-accessories`)
```json
{
  "brand": "string",
  "model": "string",
  "sensor_type": "Full-frame / APS-C / 1-inch",
  "resolution_mp": 33,
  "video_recording": "4K 60p 10-bit 4:2:2",
  "iso_range": "100 - 51200",
  "stabilization": "5-axis In-Body Image Stabilization (IBIS)",
  "autofocus_system": "AI-based Real-time Tracking AF",
  "screen_inch": 3.0,
  "viewfinder": "OLED EVF 3.68M dots",
  "lens_mount": "Sony E-mount / Canon RF / Nikon Z",
  "weight_g": 658
}
```

---

## 9. Đồ gia dụng thông minh & Thiết bị bếp (`robot-vacuum`, `air-purifier`, `kitchen-appliances`, `kitchen-accessories`, `home-appliances`)
```json
{
  "brand": "string",
  "appliance_type": "Robot hút bụi lau nhà / Nồi chiên không dầu / Máy lọc không khí",
  "power_w": 2000,
  "capacity_l": 6.5,
  "suction_power_pa": 6000,
  "coverage_area_m2": 50,
  "noise_db": 55,
  "filtration": "HEPA H13 khử bụi mịn PM2.5",
  "smart_features": ["Điều khiển qua App", "Điều khiển giọng nói", "Cảm biến thông minh"],
  "dimensions_cm": "35 x 35 x 9.8",
  "weight_kg": 4.5
}
```

---

## 10. Chăm sóc cá nhân & Làm đẹp (`personal-care`, `beauty`, `skin-care`)
```json
{
  "brand": "string",
  "product_type": "Serum dưỡng trắng / Kem phục hồi / Máy sấy tóc ion âm",
  "skin_type": "Mọi loại da / Da dầu mụn / Da nhạy cảm",
  "volume_ml": 50,
  "net_weight_g": 150,
  "key_ingredients": ["Niacinamide 10%", "Hyaluronic Acid", "Ceramide NP"],
  "benefits": ["Cấp ẩm sâu", "Làm sáng đều màu da", "Phục hồi hàng rào bảo vệ"],
  "texture": "Dạng tinh chất serum lỏng nhẹ thẩm thấu nhanh",
  "origin": "Hàn Quốc / Nhật Bản / Pháp",
  "safety_standards": "Không cồn, không paraben, không hương liệu nhân tạo"
}
```

---

## 11. Nước hoa (`fragrances`, `perfume`)
```json
{
  "brand": "string",
  "concentration": "Eau de Parfum (EDP) / Eau de Toilette (EDT) / Parfum",
  "volume_ml": 100,
  "scent_family": "Woody Aromatic / Oriental Floral / Fresh Citrus",
  "top_notes": "Cam Bergamot, Quả bưởi, Bạc hà",
  "middle_notes": "Gừng, Nhục đậu khấu, Hoa nhài",
  "base_notes": "Gỗ tuyết tùng, Hổ phách, Hương trầm",
  "longevity_hours": "8 - 12 giờ",
  "sillage": "Tỏa hương trong vòng một cánh tay",
  "gender": "Unisex / Nam / Nữ",
  "origin": "Pháp / Ý"
}
```

---

## 12. Thời trang & May mặc (`mens-shirts`, `tops`, `womens-dresses`, `mens-apparel`, `womens-apparel`)
```json
{
  "brand": "string",
  "material": "100% Cotton chải kỹ / Lụa tự nhiên / Vải Linen thoáng mát",
  "sizes": ["S", "M", "L", "XL", "XXL"],
  "fit": "Regular Fit / Slim Fit / Oversized",
  "color_options": ["Trắng", "Đen", "Xanh Navy", "Be"],
  "style": "Công sở lịch lãm / Dạo phố thanh lịch",
  "season": "Xuân Hè / Thu Đông",
  "origin": "Việt Nam",
  "care_instructions": "Giặt máy ở nhiệt độ dưới 30°C, không dùng thuốc tẩy, ủi ở nhiệt độ trung bình"
}
```

---

## 13. Giày dép (`mens-shoes`, `womens-shoes`, `sport-shoes`)
```json
{
  "brand": "string",
  "shoe_type": "Giày chạy bộ (Running) / Sneaker / Giày tây da Oxford / Giày cao gót",
  "upper_material": "Vải dệt Mesh kỹ thuật / Da bò thật 100%",
  "sole_material": "Đế cao su lưu hóa nguyên khối chống trơn trượt",
  "cushioning": "Đệm khí Air Zoom / Đệm bọt Foam phản hồi lực cao",
  "sizes": [39, 40, 41, 42, 43, 44],
  "closure_type": "Buộc dây (Lace-up) / Khóa kéo / Xỏ chân",
  "weight_g": 265,
  "origin": "Việt Nam / Indonesia"
}
```

---

## 14. Túi xách & Ví (`womens-bags`, `bags-wallets`)
```json
{
  "brand": "string",
  "bag_type": "Túi xách đeo chéo / Túi Tote / Balo laptop / Ví da cầm tay",
  "material": "Da hạt tự nhiên cao cấp (Grain Leather) / Vải Canvas trượt nước",
  "dimensions_cm": "25 x 18 x 9",
  "compartments": "1 ngăn chính rộng rãi, 2 ngăn phụ có khóa kéo bảo mật",
  "strap_type": "Quai đeo vai da êm ái kết hợp dây kim loại tháo rời điều chỉnh được",
  "closure_type": "Khóa bấm từ tính / Khóa kéo kim loại trơn tru",
  "weight_g": 520,
  "origin": "Việt Nam"
}
```

---

## 15. Kính râm (`sunglasses`)
```json
{
  "brand": "string",
  "frame_material": "Hợp kim Titanium siêu nhẹ / Nhựa Acetate cao cấp",
  "lens_material": "Polycarbonate chống trầy",
  "lens_width_mm": 54,
  "bridge_width_mm": 18,
  "temple_length_mm": 145,
  "uv_protection": "UV400 chuẩn châu Âu (chống 100% tia UVA & UVB)",
  "polarized": true,
  "frame_style": "Aviator / Wayfarer / Kính phi công",
  "gender": "Unisex"
}
```

---

## 16. Trang sức (`womens-jewellery`)
```json
{
  "brand": "string",
  "jewelry_type": "Dây chuyền / Lắc tay / Nhẫn / Bông tai",
  "primary_material": "Bạc 925 cao cấp / Vàng 18K",
  "plating": "Mạ vàng trắng Rhodium chống xỉn màu",
  "gemstone": "Đá Cubic Zirconia (CZ) / Kim cương nhân tạo / Ngọc trai nước ngọt",
  "size_options": "Dây dài 40cm + 5cm mở rộng",
  "weight_g": 4.5,
  "origin": "Việt Nam",
  "care_instructions": "Tránh tiếp xúc trực tiếp với hóa chất, nước hoa và chất tẩy rửa"
}
```

---

## 17. Nội thất & Đồ trang trí (`furniture`, `home-decoration`)
```json
{
  "brand": "string",
  "item_type": "Ghế công thái học / Bàn làm việc nâng hạ / Kệ sách đa năng / Đèn decor",
  "material": "Gỗ sồi tự nhiên / Khung thép sơn tĩnh điện / Lưới thoáng khí cao cấp",
  "dimensions_cm": "120 x 60 x 75",
  "load_capacity_kg": 150,
  "room_type": "Phòng làm việc / Phòng khách / Phòng ngủ",
  "assembly_required": true,
  "color": "Màu gỗ sồi sáng / Đen nhám",
  "weight_kg": 22.5
}
```

---

## 18. Tạp hóa & Thực phẩm (`groceries`)
```json
{
  "brand": "string",
  "product_type": "Thực phẩm khô / Trà & Cà phê cao cấp / Đồ hộp / Gia vị",
  "net_weight_g": 500,
  "packaging": "Hũ thủy tinh / Túi zip màng nhôm bảo quản hút chân không",
  "ingredients": "100% nguyên liệu tự nhiên chọn lọc",
  "dietary_preferences": "Không đường hóa học, không phẩm màu nhân tạo, đạt chuẩn hữu cơ Organic",
  "shelf_life_months": 24,
  "storage_instructions": "Bảo quản nơi khô ráo, thoáng mát, tránh ánh nắng trực tiếp",
  "origin": "Việt Nam"
}
```

---

## 19. Phụ kiện thể thao & Dã ngoại (`sports-accessories`, `camping-outdoor`)
```json
{
  "brand": "string",
  "equipment_type": "Thảm tập Yoga / Lều cắm trại gấp gọn / Balo du lịch leo núi / Bình nước giữ nhiệt",
  "material": "Cao su tự nhiên TPE thân thiện môi trường / Vải Oxford chống thấm 3000mm",
  "capacity": "4 người / 40 lít / 1000ml",
  "dimensions_cm": "210 x 200 x 135",
  "weight_kg": 2.8,
  "suitable_for": "Cắm trại dã ngoại, leo núi trekking, rèn luyện thể thao hàng ngày",
  "features": ["Gấp gọn tiện lợi", "Chống thấm nước tuyệt đối", "Chống tia UV"]
}
```

---

## 20. Phương tiện & Xe máy (`motorcycle`, `vehicle`)
```json
{
  "brand": "string",
  "model": "string",
  "engine_cc": 155,
  "engine_type": "4 kỳ, 1 xi-lanh, làm mát bằng dung dịch, van biến thiên VVA",
  "power_hp": 15.1,
  "torque_nm": 13.9,
  "fuel_tank_l": 5.4,
  "transmission": "Vô cấp CVT (Tự động) / Côn tay 6 cấp",
  "brake_system": "Phanh đĩa trước sau tích hợp hệ thống chống bó cứng phanh ABS",
  "seat_height_mm": 790,
  "curb_weight_kg": 118,
  "fuel_consumption_l_per_100km": 2.05
}
```

---

## 21. Mẹ & Bé (`mẹ bé` / `me-be`)
```json
{
  "brand": "string",
  "product_type": "Xe đẩy em bé gấp gọn / Bình sữa kháng khuẩn / Ghế ngồi ô tô cho bé",
  "age_range": "0 - 36 tháng tuổi",
  "material": "Nhựa y tế PPSU an toàn không chứa BPA / Khung nhôm hàng không",
  "capacity_weight_kg": 20,
  "safety_certifications": "Chứng nhận an toàn tiêu chuẩn châu Âu EN 1888",
  "features": ["Có thể gấp gọn mang lên máy bay", "Đệm lưng êm ái thoáng khí", "Mái che chống tia cực tím UV"],
  "origin": "Hàn Quốc / Nhật Bản"
}
```

