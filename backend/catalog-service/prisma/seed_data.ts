

const API_BASE_URL = 'http://127.0.0.1:3002/api/catalog'; // Sử dụng port của catalog-service

const seedData = async () => {
  try {
    console.log('1. Đang tạo các danh mục (Categories)...');
    
    const categoriesToCreate = [
      { name: 'Laptop & Máy tính', description: 'Máy tính xách tay cấu hình cao' },
      { name: 'Điện thoại & Tablet', description: 'Smartphones và máy tính bảng' },
      { name: 'Tai nghe & Âm thanh', description: 'Tai nghe, loa, thiết bị âm thanh' },
      { name: 'Phụ kiện công nghệ', description: 'Phụ kiện công nghệ các loại' },
      { name: 'Đồ gia dụng thông minh', description: 'Robot hút bụi, máy lọc không khí' },
      { name: 'Đồng hồ thông minh', description: 'Smartwatch và vòng đeo tay' },
      { name: 'Máy ảnh & Quay phim', description: 'Camera, ống kính và phụ kiện máy ảnh' }
    ];

    const categoryIds: Record<string, string> = {};

    for (const cat of categoriesToCreate) {
      const catRes = await fetch(`${API_BASE_URL}/categories`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cat),
      });
      const catData = await catRes.json();
      if (catData.data && catData.data.id) {
        categoryIds[cat.name] = catData.data.id;
        console.log(`- Đã tạo danh mục: ${cat.name}`);
      }
    }

    console.log('\n2. Đang tạo các sản phẩm (Products), biến thể (Variants), và ảnh (Images)...');
    
    const productsToCreate = [
      {
        category_id: categoryIds['Laptop & Máy tính'],
        name: 'MacBook Pro M3 14-inch',
        description: 'MacBook Pro M3 cực kỳ mạnh mẽ, dành cho giới chuyên nghiệp.',
        is_active: true,
        variants: [
          { attributes: { ram: '16GB', storage: '512GB' }, price: 39990000, stock_quantity: 20 },
          { attributes: { ram: '18GB', storage: '1TB' }, price: 49990000, stock_quantity: 10 }
        ],
        images: [
          { url: 'https://cdn.tgdd.vn/Products/Images/44/316954/apple-macbook-pro-14-inch-m3-pro-2023-space-black-thumb-600x600.jpg', is_primary: true, sort_order: 1 },
          { url: 'https://cdn.tgdd.vn/Products/Images/44/316954/apple-macbook-pro-14-inch-m3-pro-2023-silver-thumb-600x600.jpg', is_primary: false, sort_order: 2 }
        ]
      },
      {
        category_id: categoryIds['Laptop & Máy tính'],
        name: 'Dell XPS 15 9530',
        description: 'Laptop màn hình OLED tuyệt đẹp dành cho creator.',
        is_active: true,
        variants: [
          { attributes: { ram: '16GB', storage: '512GB' }, price: 42990000, stock_quantity: 15 }
        ],
        images: [
          { url: 'https://cdn.tgdd.vn/Products/Images/44/311029/dell-xps-15-9530-i7-71014936-thumb-1-600x600.jpg', is_primary: true, sort_order: 1 }
        ]
      },
      {
        category_id: categoryIds['Laptop & Máy tính'],
        name: 'ThinkPad X1 Carbon Gen 11',
        description: 'Laptop doanh nhân siêu mỏng nhẹ, bàn phím gõ sướng nhất.',
        is_active: true,
        variants: [
          { attributes: { ram: '16GB', storage: '512GB' }, price: 38990000, stock_quantity: 12 }
        ],
        images: [
          { url: 'https://cdn.tgdd.vn/Products/Images/44/311019/lenovo-thinkpad-x1-carbon-gen-11-i7-21hm006fvn-thumb-1-600x600.jpg', is_primary: true, sort_order: 1 }
        ]
      },
      {
        category_id: categoryIds['Điện thoại & Tablet'],
        name: 'iPhone 15 Pro Max',
        description: 'Titanium nguyên khối, camera zoom quang học 5x.',
        is_active: true,
        variants: [
          { attributes: { color: 'Titan tự nhiên', storage: '256GB' }, price: 29990000, stock_quantity: 50 },
          { attributes: { color: 'Titan đen', storage: '512GB' }, price: 34990000, stock_quantity: 30 }
        ],
        images: [
          { url: 'https://cdn.tgdd.vn/Products/Images/42/305658/iphone-15-pro-max-blue-titan-thumb-600x600.jpg', is_primary: true, sort_order: 1 },
          { url: 'https://cdn.tgdd.vn/Products/Images/42/305658/iphone-15-pro-max-black-titan-thumb-1-600x600.jpg', is_primary: false, sort_order: 2 }
        ]
      },
      {
        category_id: categoryIds['Điện thoại & Tablet'],
        name: 'Samsung Galaxy S24 Ultra',
        description: 'Điện thoại AI với bút S Pen tích hợp.',
        is_active: true,
        variants: [
          { attributes: { color: 'Xám Titan', storage: '256GB' }, price: 28990000, stock_quantity: 40 },
          { attributes: { color: 'Đen Titan', storage: '512GB' }, price: 33990000, stock_quantity: 20 }
        ],
        images: [
          { url: 'https://cdn.tgdd.vn/Products/Images/42/319665/samsung-galaxy-s24-ultra-grey-thumb-600x600.jpg', is_primary: true, sort_order: 1 },
          { url: 'https://cdn.tgdd.vn/Products/Images/42/319665/samsung-galaxy-s24-ultra-black-thumb-1-600x600.jpg', is_primary: false, sort_order: 2 }
        ]
      },
      {
        category_id: categoryIds['Điện thoại & Tablet'],
        name: 'iPad Pro M4 2024',
        description: 'Màn hình OLED, chip M4 siêu mạnh mẽ.',
        is_active: true,
        variants: [
          { attributes: { color: 'Đen', storage: '256GB' }, price: 27990000, stock_quantity: 25 }
        ],
        images: [
          { url: 'https://cdn.tgdd.vn/Products/Images/522/325492/ipad-pro-m4-11-inch-wifi-space-black-thumb-600x600.jpg', is_primary: true, sort_order: 1 }
        ]
      },
      {
        category_id: categoryIds['Tai nghe & Âm thanh'],
        name: 'Sony WH-1000XM5',
        description: 'Tai nghe chụp tai chống ồn hàng đầu.',
        is_active: true,
        variants: [
          { attributes: { color: 'Đen' }, price: 7290000, stock_quantity: 15 },
          { attributes: { color: 'Trắng' }, price: 7290000, stock_quantity: 10 }
        ],
        images: [
          { url: 'https://cdn.tgdd.vn/Products/Images/54/282921/bluetooth-chup-tai-sony-wh-1000xm5-den-thumb-1-600x600.jpg', is_primary: true, sort_order: 1 },
          { url: 'https://cdn.tgdd.vn/Products/Images/54/282921/bluetooth-chup-tai-sony-wh-1000xm5-bac-thumb-1-600x600.jpg', is_primary: false, sort_order: 2 }
        ]
      },
      {
        category_id: categoryIds['Tai nghe & Âm thanh'],
        name: 'Apple AirPods Pro 2',
        description: 'Tai nghe in-ear chống ồn xuất sắc của Apple.',
        is_active: true,
        variants: [
          { attributes: { color: 'Trắng' }, price: 5990000, stock_quantity: 100 }
        ],
        images: [
          { url: 'https://cdn.tgdd.vn/Products/Images/54/289781/tai-nghe-bluetooth-airpods-pro-2-magsafe-apple-mqd83-thumb-1-600x600.jpg', is_primary: true, sort_order: 1 }
        ]
      },
      {
        category_id: categoryIds['Phụ kiện công nghệ'],
        name: 'Bàn phím Logitech MX Mechanical',
        description: 'Bàn phím cơ low-profile êm ái.',
        is_active: true,
        variants: [
          { attributes: { switch: 'Tactile Quiet' }, price: 3490000, stock_quantity: 20 },
          { attributes: { switch: 'Linear' }, price: 3490000, stock_quantity: 15 }
        ],
        images: [
          { url: 'https://cdn.tgdd.vn/Products/Images/86/300431/ban-phim-co-khong-day-logitech-mx-mechanical-mini-den-thumb-600x600.jpg', is_primary: true, sort_order: 1 },
          { url: 'https://cdn.tgdd.vn/Products/Images/86/300431/ban-phim-co-khong-day-logitech-mx-mechanical-mini-den-thumb-2-600x600.jpg', is_primary: false, sort_order: 2 }
        ]
      },
      {
        category_id: categoryIds['Phụ kiện công nghệ'],
        name: 'Chuột Logitech MX Master 3S',
        description: 'Chuột công thái học tốt nhất cho làm việc.',
        is_active: true,
        variants: [
          { attributes: { color: 'Đen' }, price: 2490000, stock_quantity: 30 }
        ],
        images: [
          { url: 'https://cdn.tgdd.vn/Products/Images/86/282759/chuot-khong-day-logitech-mx-master-3s-den-thumb-600x600.jpg', is_primary: true, sort_order: 1 }
        ]
      },
      {
        category_id: categoryIds['Đồ gia dụng thông minh'],
        name: 'Robot hút bụi Roborock S8 Pro Ultra',
        description: 'Tự động giặt giẻ, hút bụi mạnh mẽ.',
        is_active: true,
        variants: [
          { attributes: { color: 'Trắng' }, price: 24990000, stock_quantity: 10 }
        ],
        images: [
          { url: 'https://cdn.tgdd.vn/Products/Images/8991/318182/robot-hut-bui-lau-nha-roborock-s8-pro-ultra-trang-thumb-600x600.jpg', is_primary: true, sort_order: 1 }
        ]
      },
      {
        category_id: categoryIds['Đồ gia dụng thông minh'],
        name: 'Máy lọc không khí Xiaomi Smart Air Purifier 4 Pro',
        description: 'Lọc bụi mịn PM2.5, khử mùi hôi.',
        is_active: true,
        variants: [
          { attributes: { color: 'Trắng' }, price: 4290000, stock_quantity: 20 }
        ],
        images: [
          { url: 'https://cdn.tgdd.vn/Products/Images/8138/269150/may-loc-khong-khi-xiaomi-smart-air-purifier-4-pro-thumb-2-600x600.jpg', is_primary: true, sort_order: 1 }
        ]
      },
      {
        category_id: categoryIds['Đồng hồ thông minh'],
        name: 'Apple Watch Series 9',
        description: 'Đo nhịp tim, điện tâm đồ, cử chỉ Double Tap.',
        is_active: true,
        variants: [
          { attributes: { color: 'Đen', size: '45mm' }, price: 10490000, stock_quantity: 35 },
          { attributes: { color: 'Hồng', size: '41mm' }, price: 9490000, stock_quantity: 15 }
        ],
        images: [
          { url: 'https://cdn.tgdd.vn/Products/Images/7077/314742/apple-watch-s9-gps-41mm-vien-nhom-day-silicone-thumb-den-600x600.jpg', is_primary: true, sort_order: 1 },
          { url: 'https://cdn.tgdd.vn/Products/Images/7077/314742/apple-watch-s9-gps-41mm-vien-nhom-day-silicone-thumb-hong-600x600.jpg', is_primary: false, sort_order: 2 }
        ]
      },
      {
        category_id: categoryIds['Đồng hồ thông minh'],
        name: 'Garmin Fenix 7 Sapphire Solar',
        description: 'Đồng hồ GPS thể thao cao cấp.',
        is_active: true,
        variants: [
          { attributes: { color: 'Đen Titan' }, price: 22490000, stock_quantity: 8 }
        ],
        images: [
          { url: 'https://cdn.tgdd.vn/Products/Images/7077/274092/garmin-fenix-7-sapphire-titanium-den-thumb-1-600x600.jpg', is_primary: true, sort_order: 1 }
        ]
      },
      {
        category_id: categoryIds['Máy ảnh & Quay phim'],
        name: 'Sony Alpha A7 IV',
        description: 'Máy ảnh mirrorless full-frame quay phim 4K.',
        is_active: true,
        variants: [
          { attributes: { model: 'Body Only' }, price: 59990000, stock_quantity: 5 }
        ],
        images: [
          { url: 'https://cdn.vjshop.vn/may-anh/mirrorless/sony/sony-alpha-a7-iv/sony-alpha-a7-iv-500x500.jpg', is_primary: true, sort_order: 1 }
        ]
      }
    ];

    for (const prod of productsToCreate) {
      if (!prod.category_id) {
          // If category creation failed for some reason, we fetch the first category
          const allCats = await fetch(`${API_BASE_URL}/categories`).then(r => r.json());
          if (allCats.data && allCats.data.length > 0) prod.category_id = allCats.data[0].id;
      }
      
      const prodRes = await fetch(`${API_BASE_URL}/products`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(prod),
      });
      const prodData = await prodRes.json();
      if (prodData.data && prodData.data.id) {
        console.log(`- Đã tạo sản phẩm: ${prod.name}`);
      }
    }

    console.log('\nThành công! Đã bắn xong dữ liệu: 7 categories, 15 products, 20 variants, 20 images.');
  } catch (error) {
    console.error('Lỗi khi seed data:', error);
  }
};

seedData();
