const seedData = async () => {
  try {
    console.log('1. Đang tạo các danh mục (Categories)...');
    
    const categoriesToCreate = [
      { name: 'Laptop & Gaming', description: 'Máy tính xách tay cấu hình cao' },
      { name: 'Âm thanh', description: 'Tai nghe, loa, thiết bị âm thanh' },
      { name: 'Phụ kiện', description: 'Phụ kiện công nghệ các loại' }
    ];

    const categoryIds = {};

    for (const cat of categoriesToCreate) {
      const catRes = await fetch('http://localhost:3001/api/catalog/categories', {
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

    console.log('\n2. Đang tạo các sản phẩm (Products)...');
    
    const productsToCreate = [
      {
        category_id: categoryIds['Laptop & Gaming'],
        name: 'MacBook Air M2 2023 13-inch',
        description: 'Chip M2 siêu mạnh mẽ, thiết kế mỏng nhẹ, pin trâu.',
        variants: [{ attributes: { ram: '8GB', storage: '256GB' }, price: 26490000, stock_quantity: 30 }],
        images: [{ url: 'https://cdn.tgdd.vn/Products/Images/44/282827/apple-macbook-air-m2-2022-xam-600x600.jpg', is_primary: true }]
      },
      {
        category_id: categoryIds['Âm thanh'],
        name: 'Tai nghe Sony WH-1000XM5 Chống ồn',
        description: 'Tai nghe chống ồn chủ động tốt nhất thế giới hiện nay.',
        variants: [{ attributes: { color: 'Đen' }, price: 7290000, stock_quantity: 15 }],
        images: [{ url: 'https://cdn.tgdd.vn/Products/Images/54/282921/bluetooth-chup-tai-sony-wh-1000xm5-den-thumb-1-600x600.jpg', is_primary: true }]
      },
      {
        category_id: categoryIds['Phụ kiện'],
        name: 'Bàn phím cơ không dây ASUS ROG',
        description: 'Bàn phím cơ gaming không dây siêu mượt, led RGB.',
        variants: [{ attributes: { switch: 'Red' }, price: 5990000, stock_quantity: 10 }],
        images: [{ url: 'https://cdn.tgdd.vn/Products/Images/86/300262/ban-phim-co-gaming-khong-day-asus-rog-azoth-den-thumb-600x600.jpg', is_primary: true }]
      },
      {
        category_id: categoryIds['Phụ kiện'],
        name: 'Chuột Logitech MX Master 3S',
        description: 'Chuột không dây công thái học tốt nhất cho dân văn phòng và coder.',
        variants: [{ attributes: { color: 'Xám nhạt' }, price: 2490000, stock_quantity: 25 }],
        images: [{ url: 'https://cdn.tgdd.vn/Products/Images/86/282759/chuot-khong-day-logitech-mx-master-3s-den-thumb-600x600.jpg', is_primary: true }]
      }
    ];

    for (const prod of productsToCreate) {
      if (!prod.category_id) {
          // If category creation failed for some reason, we fetch the first category
          const allCats = await fetch('http://localhost:3001/api/catalog/categories').then(r => r.json());
          if (allCats.data && allCats.data.length > 0) prod.category_id = allCats.data[0].id;
      }
      
      const prodRes = await fetch('http://localhost:3001/api/catalog/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(prod),
      });
      const prodData = await prodRes.json();
      if (prodData.data && prodData.data.id) {
        console.log(`- Đã tạo sản phẩm: ${prod.name}`);
      }
    }

    console.log('\nThành công! Đã bắn xong dữ liệu, hãy F5 trình duyệt để xem!');
  } catch (error) {
    console.error('Lỗi khi seed data:', error);
  }
};

seedData();
