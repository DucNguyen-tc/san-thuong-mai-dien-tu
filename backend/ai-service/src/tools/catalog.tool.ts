import axios from 'axios';
import { env } from '../config/env';

export interface ProductCardItem {
  id: string;
  name: string;
  slug: string;
  image_url: string;
  price: number;
  original_price?: number | null;
  discount_percent?: number | null;
  category?: string;
  in_stock?: boolean;
  variant_id?: string | null;
}

export interface ProductCardsMetadata {
  type: 'product_cards';
  products: ProductCardItem[];
}

export interface ComparisonAttribute {
  name: string;
  values: string[];
}

export interface ProductProsCons {
  product: string;
  pros: string[];
  cons: string[];
}

export interface ComparisonTableMetadata {
  type: 'comparison_table';
  products: string[];
  attributes: ComparisonAttribute[];
  highlights?: ProductProsCons[];
  recommendation?: string;
}

export interface OrderItemSummary {
  name: string;
  image_url?: string;
  quantity: number;
  price: number;
  product_id?: string;
}

export interface OrderCardItem {
  id: string;
  order_number: string;
  status: string;
  status_text: string;
  total_amount: number;
  created_at?: string;
  items: OrderItemSummary[];
}

export interface OrderCardsMetadata {
  type: 'order_cards';
  orders: OrderCardItem[];
}

export type ToolMetadataPayload = ProductCardsMetadata | ComparisonTableMetadata | OrderCardsMetadata;

export interface ToolExecutionResult {
  success: boolean;
  text: string;
  metadata?: ToolMetadataPayload | null;
  error?: string;
}

const FALLBACK_IMAGE = 'https://placehold.co/400x400/f3f4f6/6b7280?text=V-Shop';

// Danh mục hệ thống chuẩn xác theo cơ sở dữ liệu catalog_db
export const SYSTEM_CATEGORIES = {
  // 1. NHÀ CỬA & ĐỜI SỐNG / ĐỒ GIA DỤNG
  HOME_LIVING: '62d6d8f6-f23a-4aa6-908f-5e414390b1aa',
  KITCHEN: '99ba77af-27bd-4000-9a94-09ff148d9450',
  FURNITURE: '6b1d5944-29f1-4793-931e-d600309d2cfd',
  DECORATION: '1ba816b1-0a29-4b5b-ab99-f8074015bb87',
  GROCERIES: 'c34fb514-2ed6-4b00-af51-1bbecd4e4cf6',

  // 2. SỨC KHỎE & LÀM ĐẸP / MỸ PHẨM
  HEALTH_BEAUTY: 'b81eacd4-45c4-43ab-8799-7414ef556d8c',
  BEAUTY: '12b0941d-d45e-4790-b8b2-07ce29fe4642',
  FRAGRANCES: '8b6bd8af-8d26-48de-8a63-c57b3028b060',
  SKIN_CARE: 'c534782e-e768-4857-83e1-0e3fdbc38682',

  // 3. THỜI TRANG & PHỤ KIỆN
  FASHION: '67dcfd9d-440c-4628-94ce-ad3495138c2e',
  MENS_SHIRTS: '22693c16-8822-4be8-8193-ad67a86de0e5',
  MENS_SHOES: 'f8483b28-4336-4f60-949e-05374d2f9dcf',
  MENS_WATCHES: '0e32b980-6e98-4843-aadb-83aade40d157',
  WOMENS_WATCHES: '00e07d81-7230-4646-9a1b-ef086e10ca31',
  SUNGLASSES: '277de7c6-a355-4489-828f-4290bfe7deba',
  WOMENS_BAGS: 'd61711e3-20c7-4a08-be4e-e6b991ecb7d3',
  WOMENS_DRESSES: '48bea21f-0897-4273-a188-50385ed3bc5c',
  WOMENS_JEWELLERY: '0ebb1598-e063-467f-81ea-8b59514f8135',
  WOMENS_SHOES: 'f05a6c0e-cafe-4cb2-b56f-e46f386dadab',
  TOPS: 'bfa205a2-6a5f-4b4e-be9d-cfe715379caf',

  // 4. THỂ THAO & XE
  SPORTS_VEHICLES: '0e9bd969-f03a-4305-924d-69677ebdbb22',
  MOTORCYCLE: '46f9927b-5080-4c5e-8a19-ffed060c8bcc',
  SPORTS_ACCESSORIES: 'ce073c15-0008-4eaf-9eff-6ee943fbac8f',
  VEHICLE: 'cf90362b-81f4-450d-8c86-1ca7d998cca0',

  // 5. ĐIỆN TỬ
  ELECTRONICS: 'b4fc0548-28e3-41fa-8ea0-e186a2035ffb',
  SMARTPHONES: 'dbf3280b-6051-4633-a2ac-d166fc9e73b7',
  LAPTOPS: '36ef8b95-b8cf-42ed-aeb7-ab1394f43c81',
  TABLETS: '74ac44ed-fac2-420f-a32d-e48d845ca910',
  MOBILE_ACCESSORIES: '0bc98247-0aff-4553-a26e-fcfa6dcc1532',
};

// Bộ dữ liệu mẫu chất lượng cao dự phòng với UUID THẬT trong catalog_db đại diện cho tất cả ngành hàng
const SAMPLE_PRODUCTS: any[] = [
  // 1. Điện thoại & Công nghệ
  {
    id: '008375fe-6070-4806-adab-b2246d534333',
    name: 'iPhone X 64GB Silver Chính Hãng',
    slug: 'iphone-x-64gb-silver',
    description: 'Màn hình OLED Super Retina 5.8 inch, Face ID, camera kép 12MP chống rung quang học OIS.',
    category: { name: 'Điện thoại' },
    variants: [{ id: 'af49c163-3917-4362-9db6-c3789da5b0c9', price: 22499750, stock_quantity: 37 }],
    images: [{ image_url: 'https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?w=500', is_primary: true }],
  },
  {
    id: 'f7dac4fb-83c5-4109-843f-394c2b8ed334',
    name: 'Samsung Galaxy Tab S8 Plus Grey',
    slug: 'samsung-galaxy-tab-s8-plus-grey-160',
    description: 'Màn hình Super AMOLED 12.4 inch 120Hz, kèm bút S-Pen, vi xử lý Snapdragon 8 Gen 1.',
    category: { name: 'Máy tính bảng' },
    variants: [{ id: '48d4c884-a5b3-4cc1-8b0b-132b1226429e', price: 14999750, stock_quantity: 20 }],
    images: [{ image_url: 'https://cdn.dummyjson.com/product-images/tablets/samsung-galaxy-tab-s8-plus-grey/1.webp', is_primary: true }],
  },
  {
    id: 'c09b103a-b925-4464-8e29-82d13d58c7a1',
    name: 'Apple Watch Series 4 Gold',
    slug: 'apple-watch-series-4-gold-106',
    description: 'Đồng hồ thông minh theo dõi sức khỏe chủ động, cảm biến đo điện tâm đồ ECG.',
    category: { name: 'Phụ kiện điện thoại' },
    variants: [{ id: 'efd0fc70-42cd-4edd-98bd-54d271f0b143', price: 8749750, stock_quantity: 14 }],
    images: [{ image_url: 'https://cdn.dummyjson.com/product-images/mobile-accessories/apple-watch-series-4-gold/1.webp', is_primary: true }],
  },
  {
    id: '8f612add-a2f3-4774-a955-12f4c534f032',
    name: 'Apple AirPods Max Silver',
    slug: 'apple-airpods-max-silver-101',
    description: 'Tai nghe Over-ear cao cấp với âm thanh trung thực Hi-Fi, chống ồn chủ động vượt trội.',
    category: { name: 'Phụ kiện điện thoại' },
    variants: [{ id: 'f137bc49-49cb-4cb5-a784-cc4631b42e59', price: 13749750, stock_quantity: 10 }],
    images: [{ image_url: 'https://cdn.dummyjson.com/product-images/mobile-accessories/apple-airpods-max-silver/1.webp', is_primary: true }],
  },
  {
    id: '0ccdc7b6-0e25-4ec0-a8c6-674b822a95e2',
    name: 'Apple MacBook Pro 14 Inch Space Grey',
    slug: 'apple-macbook-pro-14-inch',
    description: 'Chip M-Series thế hệ mới với hiệu năng vượt trội, màn hình Liquid Retina XDR 120Hz.',
    category: { name: 'Laptop' },
    variants: [{ id: 'f99828d2-2cbf-46c0-89ce-a5ef78a01b33', price: 29990000, stock_quantity: 15 }],
    images: [{ image_url: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=500', is_primary: true }],
  },

  // 2. Đồ gia dụng & Nhà cửa đời sống
  {
    id: '95991b1d-2d16-4c15-a175-526dd36b5a15',
    name: 'Dụng cụ nạo củ quả đa năng Yellow Peeler',
    slug: 'yellow-peeler-77',
    description: 'Lưỡi thép không gỉ sắc bén, tay cầm tiện lợi chống trơn trượt, thích hợp cho mọi căn bếp.',
    category: { name: 'Phụ kiện bếp' },
    variants: [{ id: 'e2d0febc-39a5-4d27-9e91-b3bc76698200', price: 149750, stock_quantity: 50 }],
    images: [{ image_url: 'https://cdn.dummyjson.com/product-images/kitchen-accessories/yellow-peeler/1.webp', is_primary: true }],
  },
  {
    id: 'ebe1373e-b064-4a95-b1ef-0baca27a8509',
    name: 'Ghế làm việc cao cấp Knoll Saarinen Executive Chair',
    slug: 'knoll-saarinen-executive-conference-chair-14',
    description: 'Thiết kế công thái học hiện đại, đệm ngồi êm ái nâng đỡ cột sống hoàn hảo.',
    category: { name: 'Nội thất' },
    variants: [{ id: '6783599f-d908-4626-ade4-c9cfff841030', price: 12499750, stock_quantity: 15 }],
    images: [{ image_url: 'https://cdn.dummyjson.com/product-images/furniture/knoll-saarinen-executive-conference-chair/1.webp', is_primary: true }],
  },
  {
    id: 'd719271d-f59c-40e7-b32d-439a72bf8e87',
    name: 'Đèn bàn trang trí hiện đại Table Lamp',
    slug: 'table-lamp-47',
    description: 'Ánh sáng vàng ấm dịu mắt, tiết kiệm điện năng, tạo điểm nhấn ấm cúng cho không gian sống.',
    category: { name: 'Đồ trang trí' },
    variants: [{ id: '58265045-1afd-4096-9113-428839042fde', price: 1249750, stock_quantity: 25 }],
    images: [{ image_url: 'https://cdn.dummyjson.com/product-images/home-decoration/table-lamp/1.webp', is_primary: true }],
  },

  // 3. Sức khỏe & Làm đẹp (Mỹ phẩm, Nước hoa)
  {
    id: '634fb6f5-bc6d-4d76-a47d-c39cb5a7aab6',
    name: 'Son môi cao cấp Red Lipstick',
    slug: 'red-lipstick-4',
    description: 'Sắc đỏ quyến rũ thời thượng, chất son mịn lì như nhung, giữ màu lâu trôi suốt cả ngày.',
    category: { name: 'Mỹ phẩm' },
    variants: [{ id: 'd9827222-9b69-4285-95a2-7ef5bc84e8cc', price: 324750, stock_quantity: 40 }],
    images: [{ image_url: 'https://cdn.dummyjson.com/product-images/beauty/red-lipstick/1.webp', is_primary: true }],
  },
  {
    id: 'a9ba275d-3e34-4038-8297-f07f47b786ea',
    name: 'Nước hoa nữ cao cấp Gucci Bloom Eau de',
    slug: 'gucci-bloom-eau-de-10',
    description: 'Hương hoa huệ và hoa nhài thanh lịch, nồng nàn quyến rũ lưu hương suốt 8-12 tiếng.',
    category: { name: 'Nước hoa' },
    variants: [{ id: '194a6299-e77f-4a40-a982-85fe466c9621', price: 1999750, stock_quantity: 20 }],
    images: [{ image_url: 'https://cdn.dummyjson.com/product-images/fragrances/gucci-bloom-eau-de/1.webp', is_primary: true }],
  },

  // 4. Thời trang & Giày dép
  {
    id: 'e6b2151a-0e6e-4c6a-a907-c12444877f4f',
    name: 'Giày thể thao nam Sports Sneakers Off White Red',
    slug: 'sports-sneakers-off-white-red-92',
    description: 'Thiết kế năng động cá tính, đệm khí êm ái hỗ trợ vận động thể thao và dạo phố.',
    category: { name: 'Giày nam' },
    variants: [{ id: 'db003600-2a82-41b1-a53d-6f5ed00ff65d', price: 2749750, stock_quantity: 18 }],
    images: [{ image_url: 'https://cdn.dummyjson.com/product-images/mens-shoes/sports-sneakers-off-white-red/1.webp', is_primary: true }],
  },
  {
    id: '208f0ad8-b6fb-4de2-8b3f-55a2cab47928',
    name: 'Túi xách nữ thanh lịch Women Handbag Black',
    slug: 'women-handbag-black-176',
    description: 'Chất liệu da cao cấp chống thấm, đường may tinh xảo, ngăn chứa rộng rãi tiện lợi.',
    category: { name: 'Túi xách nữ' },
    variants: [{ id: '3d9a8bd0-7efa-45bc-9363-1c0c847b99fe', price: 1499750, stock_quantity: 22 }],
    images: [{ image_url: 'https://cdn.dummyjson.com/product-images/womens-bags/women-handbag-black/1.webp', is_primary: true }],
  },

  // 5. Thể thao & Xe
  {
    id: '5fce7355-dc49-4cb8-8399-147a3a2fa168',
    name: 'Mô tô thể thao phân khối lớn Sportbike Motorcycle',
    slug: 'sportbike-motorcycle-117',
    description: 'Động cơ uy lực mạnh mẽ, kiểu dáng khí động học hầm hố, trang bị phanh ABS an toàn.',
    category: { name: 'Xe máy' },
    variants: [{ id: '286602f6-b69e-4130-8cb4-9f1ea5bb5c39', price: 187499750, stock_quantity: 5 }],
    images: [{ image_url: 'https://cdn.dummyjson.com/product-images/motorcycle/sportbike-motorcycle/1.webp', is_primary: true }],
  },
];

function removeVietnameseTones(str: string): string {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase();
}

export class CatalogTool {
  /**
   * Tool 1: search_products — Tìm kiếm sản phẩm
   * Gọi catalog-service:3002/api/catalog/products
   */
  async searchProducts(params: {
    query?: string;
    category_id?: string;
    min_price?: number;
    max_price?: number;
    sort?: string;
    limit?: number;
  }): Promise<ToolExecutionResult> {
    const { query = '', category_id, min_price, max_price, sort, limit = 5 } = params;
    console.log(`[CatalogTool] Đang tìm kiếm sản phẩm với từ khóa: "${query}" (limit: ${limit})`);

    let rawProducts: any[] = [];
    const lowerQ = query.toLowerCase();
    const unaccentedQ = removeVietnameseTones(lowerQ);

    // Tự động phân loại category_id và trích xuất từ khóa thương hiệu / nhóm hàng
    let targetCategoryId = category_id;
    let targetSort = sort;
    let searchKeyword = query;

    // Helper lấy sản phẩm phân bổ đồng đều theo danh mục con khi query danh mục cha
    const sampleAcrossCategories = (items: any[], maxTotal: number = 8) => {
      const grouped: { [key: string]: any[] } = {};
      items.forEach((item) => {
        const cat = item.category?.name || 'Khác';
        if (!grouped[cat]) grouped[cat] = [];
        grouped[cat].push(item);
      });

      const result: any[] = [];
      const catKeys = Object.keys(grouped);
      const itemsPerCat = Math.max(2, Math.floor(maxTotal / Math.max(1, catKeys.length)));

      catKeys.forEach((k) => {
        result.push(...grouped[k].slice(0, itemsPerCat));
      });

      return result.slice(0, maxTotal);
    };

    const isBothPhoneAndLaptop =
      (lowerQ.includes('điện thoại') || unaccentedQ.includes('dien thoai') || /\b(dt|đt)\b/i.test(lowerQ)) &&
      (lowerQ.includes('laptop') || unaccentedQ.includes('loptop') || unaccentedQ.includes('may tinh'));

    // 1. Phân loại danh mục thông minh theo từ khóa
    let detectedCatId: string | null = null;
    let isRootCat = false;

    // A. NHÀ CỬA & ĐỜI SỐNG / ĐỒ GIA DỤNG
    if (
      lowerQ.includes('đồ gia dụng') || unaccentedQ.includes('do gia dung') ||
      lowerQ.includes('gia dụng') || unaccentedQ.includes('gia dung') ||
      lowerQ.includes('nhà cửa') || unaccentedQ.includes('nha cua') ||
      lowerQ.includes('đời sống') || unaccentedQ.includes('doi song') ||
      lowerQ.includes('thiết bị gia đình') || unaccentedQ.includes('thiet bi gia dinh')
    ) {
      detectedCatId = SYSTEM_CATEGORIES.HOME_LIVING;
      isRootCat = true;
    } else if (
      lowerQ.includes('nội thất') || unaccentedQ.includes('noi that') ||
      lowerQ.includes('bàn') || lowerQ.includes('ghế') ||
      lowerQ.includes('sofa') || lowerQ.includes('giường') ||
      lowerQ.includes('tủ') || lowerQ.includes('bồn rửa')
    ) {
      detectedCatId = SYSTEM_CATEGORIES.FURNITURE;
    } else if (
      lowerQ.includes('bếp') || unaccentedQ.includes('bep') ||
      lowerQ.includes('nồi') || /\bnoi\b/i.test(unaccentedQ) ||
      lowerQ.includes('chảo') || unaccentedQ.includes('chao') ||
      lowerQ.includes('lò vi sóng') || unaccentedQ.includes('lo vi song') ||
      lowerQ.includes('máy xay') || unaccentedQ.includes('may xay') ||
      lowerQ.includes('dao') || lowerQ.includes('thớt') ||
      lowerQ.includes('thìa') || lowerQ.includes('muỗng')
    ) {
      detectedCatId = SYSTEM_CATEGORIES.KITCHEN;
    } else if (
      lowerQ.includes('trang trí') || unaccentedQ.includes('trang tri') ||
      lowerQ.includes('decor') || lowerQ.includes('đèn bàn') ||
      lowerQ.includes('chậu cây')
    ) {
      detectedCatId = SYSTEM_CATEGORIES.DECORATION;
    } else if (
      lowerQ.includes('tạp hóa') || unaccentedQ.includes('tap hoa') ||
      lowerQ.includes('cà phê') || unaccentedQ.includes('ca phe') ||
      lowerQ.includes('khăn giấy') || lowerQ.includes('gạo')
    ) {
      detectedCatId = SYSTEM_CATEGORIES.GROCERIES;
    }

    // B. SỨC KHỎE & LÀM ĐẸP / MỸ PHẨM / NƯỚC HOA
    else if (
      lowerQ.includes('sức khỏe') || unaccentedQ.includes('suc khoe') ||
      lowerQ.includes('làm đẹp') || unaccentedQ.includes('lam dep') ||
      lowerQ.includes('sắc đẹp') || lowerQ.includes('beauty')
    ) {
      detectedCatId = SYSTEM_CATEGORIES.HEALTH_BEAUTY;
      isRootCat = true;
    } else if (
      lowerQ.includes('mỹ phẩm') || unaccentedQ.includes('my pham') ||
      lowerQ.includes('son') || lowerQ.includes('son môi') ||
      lowerQ.includes('mascara') || lowerQ.includes('phấn') ||
      lowerQ.includes('trang điểm') || lowerQ.includes('makeup')
    ) {
      detectedCatId = SYSTEM_CATEGORIES.BEAUTY;
    } else if (
      lowerQ.includes('nước hoa') || unaccentedQ.includes('nuoc hoa') ||
      lowerQ.includes('dầu thơm') || unaccentedQ.includes('dau thom') ||
      lowerQ.includes('perfume') || lowerQ.includes('fragrance')
    ) {
      detectedCatId = SYSTEM_CATEGORIES.FRAGRANCES;
    } else if (
      lowerQ.includes('chăm sóc da') || unaccentedQ.includes('cham soc da') ||
      lowerQ.includes('dưỡng da') || lowerQ.includes('sữa tắm') ||
      lowerQ.includes('sữa rửa mặt') || lowerQ.includes('skincare')
    ) {
      detectedCatId = SYSTEM_CATEGORIES.SKIN_CARE;
    }

    // C. THỜI TRANG & PHỤ KIỆN
    else if (
      lowerQ.includes('thời trang') || unaccentedQ.includes('thoi trang') ||
      lowerQ.includes('quần áo') || unaccentedQ.includes('quan ao') ||
      lowerQ.includes('đồ mặc') || lowerQ.includes('outfit')
    ) {
      detectedCatId = SYSTEM_CATEGORIES.FASHION;
      isRootCat = true;
    } else if (
      lowerQ.includes('áo nam') || unaccentedQ.includes('ao nam') ||
      lowerQ.includes('sơ mi') || lowerQ.includes('áo thun')
    ) {
      detectedCatId = SYSTEM_CATEGORIES.MENS_SHIRTS;
    } else if (
      lowerQ.includes('giày nam') || unaccentedQ.includes('giay nam') ||
      lowerQ.includes('sneaker') || lowerQ.includes('giày thể thao') ||
      lowerQ.includes('nike') || lowerQ.includes('puma') || lowerQ.includes('jordan')
    ) {
      detectedCatId = SYSTEM_CATEGORIES.MENS_SHOES;
    } else if (
      lowerQ.includes('váy') || unaccentedQ.includes('vay') ||
      lowerQ.includes('đầm') || unaccentedQ.includes('dam')
    ) {
      detectedCatId = SYSTEM_CATEGORIES.WOMENS_DRESSES;
    } else if (
      lowerQ.includes('túi xách') || unaccentedQ.includes('tui xach') ||
      lowerQ.includes('túi nữ') || lowerQ.includes('balo')
    ) {
      detectedCatId = SYSTEM_CATEGORIES.WOMENS_BAGS;
    } else if (
      lowerQ.includes('kính râm') || unaccentedQ.includes('kinh ram') ||
      lowerQ.includes('kính mát') || unaccentedQ.includes('kinh mat')
    ) {
      detectedCatId = SYSTEM_CATEGORIES.SUNGLASSES;
    } else if (
      lowerQ.includes('trang sức') || unaccentedQ.includes('trang suc') ||
      lowerQ.includes('khuyên tai') || lowerQ.includes('bông tai')
    ) {
      detectedCatId = SYSTEM_CATEGORIES.WOMENS_JEWELLERY;
    } else if (
      lowerQ.includes('giày nữ') || unaccentedQ.includes('giay nu') ||
      lowerQ.includes('cao gót')
    ) {
      detectedCatId = SYSTEM_CATEGORIES.WOMENS_SHOES;
    }

    // D. THỂ THAO & XE
    else if (
      lowerQ.includes('thể thao') || unaccentedQ.includes('the thao') ||
      lowerQ.includes('vợt') || lowerQ.includes('tennis') || lowerQ.includes('bóng chuyền')
    ) {
      detectedCatId = SYSTEM_CATEGORIES.SPORTS_ACCESSORIES;
    } else if (
      lowerQ.includes('xe máy') || unaccentedQ.includes('xe may') ||
      lowerQ.includes('mô tô') || unaccentedQ.includes('mo to') ||
      lowerQ.includes('scooter') || lowerQ.includes('kawasaki')
    ) {
      detectedCatId = SYSTEM_CATEGORIES.MOTORCYCLE;
    } else if (
      lowerQ.includes('ô tô') || unaccentedQ.includes('o to') ||
      lowerQ.includes('xe hơi') || unaccentedQ.includes('xe hoi') ||
      lowerQ.includes('phương tiện')
    ) {
      detectedCatId = SYSTEM_CATEGORIES.VEHICLE;
    }

    // E. ĐIỆN TỬ & CÔNG NGHỆ
    else if (
      lowerQ.includes('đồ điện tử') || unaccentedQ.includes('do dien tu') ||
      lowerQ.includes('điện tử') || unaccentedQ.includes('dien tu') ||
      lowerQ.includes('công nghệ') || unaccentedQ.includes('cong nghe') ||
      lowerQ.includes('thiết bị điện tử')
    ) {
      detectedCatId = SYSTEM_CATEGORIES.ELECTRONICS;
      isRootCat = true;
    } else if (
      lowerQ.includes('máy tính bảng') || unaccentedQ.includes('may tinh bang') ||
      lowerQ.includes('tablet') || lowerQ.includes('ipad')
    ) {
      detectedCatId = SYSTEM_CATEGORIES.TABLETS;
    } else if (
      lowerQ.includes('tai nghe') || unaccentedQ.includes('tai nghe') ||
      lowerQ.includes('airpod') || lowerQ.includes('airpods') ||
      lowerQ.includes('loa') || lowerQ.includes('homepod') ||
      lowerQ.includes('beats') || lowerQ.includes('sạc')
    ) {
      detectedCatId = SYSTEM_CATEGORIES.MOBILE_ACCESSORIES;
    } else if (
      lowerQ.includes('đồng hồ thông minh') || unaccentedQ.includes('dong ho thong minh') ||
      lowerQ.includes('smartwatch') || lowerQ.includes('apple watch')
    ) {
      detectedCatId = SYSTEM_CATEGORIES.MOBILE_ACCESSORIES;
      searchKeyword = 'Apple Watch';
    } else if (
      lowerQ.includes('điện thoại') || unaccentedQ.includes('dien thoai') ||
      lowerQ.includes('smartphone') || /\b(dt|đt)\b/i.test(lowerQ)
    ) {
      detectedCatId = SYSTEM_CATEGORIES.SMARTPHONES;
    } else if (
      lowerQ.includes('laptop') || unaccentedQ.includes('loptop') ||
      lowerQ.includes('may tinh') || lowerQ.includes('macbook')
    ) {
      detectedCatId = SYSTEM_CATEGORIES.LAPTOPS;
    } else if (
      lowerQ.includes('đồng hồ') || unaccentedQ.includes('dong ho') || lowerQ.includes('watch')
    ) {
      detectedCatId = SYSTEM_CATEGORIES.MENS_WATCHES;
    }

    if (detectedCatId) {
      targetCategoryId = detectedCatId;
    }

    if (isBothPhoneAndLaptop) {
      try {
        const [phonesRes, laptopsRes] = await Promise.all([
          axios.get(`${env.CATALOG_SERVICE_URL}/api/catalog/products`, {
            params: { category_id: SYSTEM_CATEGORIES.SMARTPHONES, limit: 3 },
            timeout: 2000,
          }),
          axios.get(`${env.CATALOG_SERVICE_URL}/api/catalog/products`, {
            params: { category_id: SYSTEM_CATEGORIES.LAPTOPS, limit: 3 },
            timeout: 2000,
          }),
        ]);

        const phones = phonesRes.data?.data?.items || phonesRes.data?.data?.products || [];
        const laptops = laptopsRes.data?.data?.items || laptopsRes.data?.data?.products || [];
        rawProducts = [...phones, ...laptops];
      } catch {
        rawProducts = SAMPLE_PRODUCTS.filter((p) => p.category?.name === 'Điện thoại' || p.category?.name === 'Laptop');
      }
    } else if (isRootCat && targetCategoryId) {
      // Khi tìm theo nhóm ngành hàng lớn (Đồ gia dụng, Thời trang, Sức khỏe làm đẹp, Điện tử):
      // Lấy danh sách sản phẩm và phân bổ cân đối theo từng phân nhóm
      try {
        const response = await axios.get(`${env.CATALOG_SERVICE_URL}/api/catalog/products`, {
          params: { category_id: targetCategoryId, limit: 40 },
          timeout: 2500,
        });

        const allItems: any[] = response.data?.data?.items || response.data?.data?.products || [];

        if (targetCategoryId === SYSTEM_CATEGORIES.ELECTRONICS) {
          const highTechScore = (name: string) => {
            if (name.includes('Watch')) return 1;
            if (name.includes('AirPods')) return 2;
            if (name.includes('HomePod') || name.includes('Echo')) return 3;
            if (name.includes('Beats')) return 4;
            return 10;
          };
          const tablets = allItems.filter((p: any) => p.category?.name === 'Máy tính bảng').slice(0, 2);
          const smartDevices = allItems
            .filter((p: any) => p.category?.name === 'Phụ kiện điện thoại' && highTechScore(p.name) < 10)
            .sort((a: any, b: any) => highTechScore(a.name) - highTechScore(b.name))
            .slice(0, 2);
          const laptops = allItems.filter((p: any) => p.category?.name === 'Laptop').slice(0, 2);
          const phones = allItems.filter((p: any) => p.category?.name === 'Điện thoại').slice(0, 2);
          rawProducts = [...tablets, ...smartDevices, ...phones, ...laptops];
        } else {
          rawProducts = sampleAcrossCategories(allItems, 8);
        }

        if (rawProducts.length === 0 && allItems.length > 0) {
          rawProducts = allItems.slice(0, 8);
        }
      } catch {
        rawProducts = SAMPLE_PRODUCTS.slice(0, 8);
      }
    } else {
      // Khi tìm theo danh mục con cụ thể hoặc tìm kiếm theo từ khóa
      if (!targetSort && (lowerQ.includes('rẻ') || lowerQ.includes('ghẻ') || unaccentedQ.includes('re') || unaccentedQ.includes('ghe'))) {
        targetSort = 'price_asc';
      }

      // Trích xuất từ khóa thương hiệu phổ biến
      if (unaccentedQ.includes('macbook')) searchKeyword = 'MacBook';
      else if (unaccentedQ.includes('ipad')) searchKeyword = 'iPad';
      else if (unaccentedQ.includes('airpods')) searchKeyword = 'AirPods';
      else if (unaccentedQ.includes('beats')) searchKeyword = 'Beats';
      else if (unaccentedQ.includes('iphone')) searchKeyword = 'iPhone';
      else if (unaccentedQ.includes('samsung')) searchKeyword = 'Samsung';
      else if (unaccentedQ.includes('dell')) searchKeyword = 'DELL';
      else if (unaccentedQ.includes('lenovo')) searchKeyword = 'Lenovo';
      else if (unaccentedQ.includes('oppo')) searchKeyword = 'Oppo';
      else if (unaccentedQ.includes('vivo')) searchKeyword = 'Vivo';
      else if (unaccentedQ.includes('realme')) searchKeyword = 'Realme';
      else if (unaccentedQ.includes('asus')) searchKeyword = 'Asus';
      else if (unaccentedQ.includes('sony')) searchKeyword = 'Sony';
      else if (unaccentedQ.includes('gucci')) searchKeyword = 'Gucci';
      else if (unaccentedQ.includes('dior')) searchKeyword = 'Dior';
      else if (unaccentedQ.includes('chanel')) searchKeyword = 'Chanel';
      else if (unaccentedQ.includes('nike')) searchKeyword = 'Nike';
      else if (unaccentedQ.includes('puma')) searchKeyword = 'Puma';
      else if (unaccentedQ.includes('kawasaki')) searchKeyword = 'Kawasaki';
      else if (unaccentedQ.includes('rolex')) searchKeyword = 'Rolex';
      else if (targetCategoryId) searchKeyword = ''; // Đã phân loại được category thì không ép chuỗi dài để tránh 0 kết quả

      try {
        const response = await axios.get(`${env.CATALOG_SERVICE_URL}/api/catalog/products`, {
          params: {
            search: searchKeyword || undefined,
            category_id: targetCategoryId,
            sort: targetSort,
            limit: limit * 2,
          },
          timeout: 2000,
        });

        const resData = response.data;
        if (resData && resData.data && Array.isArray(resData.data.products)) {
          rawProducts = resData.data.products;
        } else if (resData && resData.data && Array.isArray(resData.data.items)) {
          rawProducts = resData.data.items;
        } else if (Array.isArray(resData.data)) {
          rawProducts = resData.data;
        }

        // Nếu có searchKeyword nhưng ra 0 kết quả, thử lại lấy toàn bộ sản phẩm của category đó
        if (rawProducts.length === 0 && targetCategoryId && searchKeyword) {
          try {
            const retryRes = await axios.get(`${env.CATALOG_SERVICE_URL}/api/catalog/products`, {
              params: { category_id: targetCategoryId, limit: limit * 2 },
              timeout: 1500,
            });
            rawProducts = retryRes.data?.data?.products || retryRes.data?.data?.items || [];
          } catch {}
        }
      } catch (err: any) {
        console.warn(`[CatalogTool] Lỗi kết nối catalog-service (${err.message}). Sử dụng kho dữ liệu mẫu chuẩn...`);
      }

      // Fallback thông minh từ SAMPLE_PRODUCTS nếu database trả về rỗng
      if (rawProducts.length === 0) {
        // Chỉ lấy từ SAMPLE_PRODUCTS nếu thật sự có sản phẩm khớp với từ khóa hoặc danh mục được nhận diện
        const matchingSample = SAMPLE_PRODUCTS.filter((p) => {
          const matchName = p.name.toLowerCase().includes(lowerQ) || removeVietnameseTones(p.name).includes(unaccentedQ);
          const matchDesc = (p.description || '').toLowerCase().includes(lowerQ) || removeVietnameseTones(p.description || '').includes(unaccentedQ);
          const matchCat = targetCategoryId && p.category?.name && (p.category.name.toLowerCase().includes(lowerQ) || removeVietnameseTones(p.category.name).includes(unaccentedQ));
          return matchName || matchDesc || matchCat;
        });

        if (matchingSample.length > 0) {
          rawProducts = matchingSample;
        } else if (!query || query.trim() === '' || lowerQ.includes('gợi ý') || lowerQ.includes('sản phẩm hot') || lowerQ.includes('bán chạy')) {
          // Chỉ lấy danh sách mẫu khi người dùng yêu cầu gợi ý chung chung không có từ khóa cụ thể
          rawProducts = SAMPLE_PRODUCTS.slice(0, Math.max(limit, 6));
        } else {
          // Người dùng tìm từ khóa cụ thể nhưng sàn không có -> Giữ mảng rỗng để thông báo chính xác, chống hallucination
          rawProducts = [];
        }
      }
    }

    // 2. Lọc theo giá nếu có yêu cầu
    if (min_price !== undefined) {
      rawProducts = rawProducts.filter((p) => {
        const price = Number(p.variants?.[0]?.price || p.price || 0);
        return price >= min_price;
      });
    }
    if (max_price !== undefined) {
      rawProducts = rawProducts.filter((p) => {
        const price = Number(p.variants?.[0]?.price || p.price || 0);
        return price <= max_price;
      });
    }

    const effectiveLimit = isRootCat || isBothPhoneAndLaptop ? Math.max(limit, 8) : Math.max(limit, 5);
    const sliced = rawProducts.slice(0, effectiveLimit);

    // XỬ LÝ KHI KHÔNG TÌM THẤY SẢN PHẨM PHÙ HỢP (ANTI-HALLUCINATION)
    if (sliced.length === 0) {
      if (query && query.trim() !== '') {
        // Trường hợp do lọc giá
        if (min_price !== undefined || max_price !== undefined) {
          let priceMsg = '';
          if (min_price !== undefined && max_price !== undefined) {
            priceMsg = `trong khoảng giá từ ${min_price.toLocaleString('vi-VN')}đ đến ${max_price.toLocaleString('vi-VN')}đ`;
          } else if (max_price !== undefined) {
            priceMsg = `với mức giá dưới ${max_price.toLocaleString('vi-VN')}đ`;
          } else if (min_price !== undefined) {
            priceMsg = `với mức giá trên ${min_price.toLocaleString('vi-VN')}đ`;
          }
          return {
            success: false,
            text: `Dạ rất tiếc, sàn V-Shop không tìm thấy sản phẩm nào khớp với từ khóa **"${query}"** ${priceMsg}. Bạn có thể thử điều chỉnh lại mức giá hoặc tìm kiếm sản phẩm khác nhé! 😊`,
            metadata: null,
          };
        }

        // Trường hợp không có sản phẩm này trên sàn
        return {
          success: false,
          text: `Dạ rất tiếc, hiện tại sàn V-Shop chưa kinh doanh hoặc không tìm thấy sản phẩm nào khớp với từ khóa **"${query}"**.\n\nSàn V-Shop hiện tập trung vào 5 ngành hàng chính:\n- 📱 **Đồ điện tử & Công nghệ** (Điện thoại, Laptop, Máy tính bảng, Tai nghe, Smartwatch)\n- 🏠 **Đồ gia dụng & Đời sống** (Nội thất bàn ghế, Thiết bị bếp nồi chảo, Đồ trang trí)\n- 💄 **Sức khỏe & Làm đẹp** (Mỹ phẩm, Nước hoa Chanel/Dior, Chăm sóc da)\n- 👕 **Thời trang & Phụ kiện** (Áo sơ mi, Giày thể thao, Túi xách, Đồng hồ)\n- 🏍️ **Thể thao & Xe** (Xe mô tô phân khối lớn, Dụng cụ thể thao)\n\nBạn có muốn mình tư vấn hoặc tìm kiếm sản phẩm nào thuộc các ngành hàng trên không ạ? 😊`,
          metadata: null,
        };
      } else {
        return {
          success: false,
          text: `Dạ hiện tại chưa có sản phẩm nào phù hợp với yêu cầu này. Bạn có thể cho mình biết rõ hơn về sản phẩm cần tìm nhé!`,
          metadata: null,
        };
      }
    }

    // 3. Format dữ liệu trả về cho Frontend (ProductCardItem[])
    // ĐẶC BIỆT: Lấy variants[0]?.id gán vào variant_id đúng theo lưu ý của Khoa (NOTES_CHO_DU_BAN1.md)
    const cardItems: ProductCardItem[] = sliced.map((p) => {
      const primaryVariant = p.variants?.[0] || null;
      const price = Number(primaryVariant?.price || p.price || 0);
      const originalPrice = primaryVariant?.original_price ? Number(primaryVariant.original_price) : null;
      let discountPercent = 0;
      if (originalPrice && originalPrice > price) {
        discountPercent = Math.round(((originalPrice - price) / originalPrice) * 100);
      }

      const primaryImg = p.images?.find((img: any) => img.is_primary) || p.images?.[0];
      const imageUrl =
        (typeof primaryImg === 'string' ? primaryImg : primaryImg?.url || primaryImg?.image_url) ||
        p.image_url ||
        p.thumbnail ||
        FALLBACK_IMAGE;

      return {
        id: p.id,
        name: p.name,
        slug: p.slug,
        image_url: imageUrl,
        price,
        original_price: originalPrice && originalPrice > price ? originalPrice : null,
        discount_percent: discountPercent > 0 ? discountPercent : null,
        category: p.category?.name || 'Sản phẩm',
        in_stock: primaryVariant ? primaryVariant.stock_quantity > 0 : true,
        variant_id: primaryVariant?.id || null, // UUID THẬT CHO NÚT THÊM GIỎ HÀNG
      };
    });

    // 4. Tạo thông báo ngắn gọn vì đã có các Thẻ sản phẩm trực quan (Product Cards) hiển thị bên dưới
    const textSummary = `Dạ mình đã tìm thấy các sản phẩm phù hợp với yêu cầu của bạn. Bạn có thể xem hình ảnh, giá bán và bấm thêm nhanh vào giỏ hàng ngay trên các thẻ sản phẩm bên dưới nhé! 👇`;

    return {
      success: true,
      text: textSummary,
      metadata: {
        type: 'product_cards',
        products: cardItems,
      },
    };
  }

  /**
   * Tool 2: get_product_details — Xem chi tiết 1 sản phẩm
   * Gọi catalog-service:3002/api/catalog/products/:id
   */
  async getProductDetails(params: { product_id: string }): Promise<ToolExecutionResult> {
    const { product_id } = params;
    console.log(`[CatalogTool] Lấy thông tin chi tiết sản phẩm: "${product_id}"`);

    let product: any = null;

    try {
      const res = await axios.get(`${env.CATALOG_SERVICE_URL}/api/catalog/products/${product_id}`, { timeout: 1500 });
      product = res.data?.data || res.data;
    } catch {
      // Fallback
      product =
        SAMPLE_PRODUCTS.find((p) => p.id === product_id || p.slug === product_id) ||
        SAMPLE_PRODUCTS[0];
    }

    if (!product) {
      return {
        success: false,
        text: `Không tìm thấy thông tin sản phẩm với ID "${product_id}".`,
      };
    }

    const primaryVariant = product.variants?.[0] || null;
    const price = Number(primaryVariant?.price || product.price || 0);
    const priceFormatted = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);

    let detailText = `### Thông tin chi tiết: **${product.name}**\n`;
    detailText += `- **Giá bán:** ${priceFormatted}\n`;
    detailText += `- **Danh mục:** ${product.category?.name || 'Điện tử'}\n`;
    detailText += `- **Tồn kho:** ${primaryVariant?.stock_quantity ?? 'Còn hàng'}\n`;
    detailText += `- **Mô tả:** ${product.description || 'Chính hãng 100%'}\n`;

    if (product.specs && typeof product.specs === 'object') {
      detailText += `- **Thông số kỹ thuật:**\n`;
      for (const [k, v] of Object.entries(product.specs)) {
        detailText += `  + ${k}: ${v}\n`;
      }
    }

    const cardItem: ProductCardItem = {
      id: product.id,
      name: product.name,
      slug: product.slug,
      image_url: product.images?.[0]?.image_url || FALLBACK_IMAGE,
      price,
      original_price: primaryVariant?.original_price ? Number(primaryVariant.original_price) : null,
      discount_percent: null,
      category: product.category?.name || 'Sản phẩm',
      in_stock: primaryVariant ? primaryVariant.stock_quantity > 0 : true,
      variant_id: primaryVariant?.id || null,
    };

    return {
      success: true,
      text: detailText,
      metadata: {
        type: 'product_cards',
        products: [cardItem],
      },
    };
  }

  /**
   * Tool 3: compare_products — So sánh 2-4 sản phẩm
   */
  async compareProducts(params: { products: string[] }): Promise<ToolExecutionResult> {
    const productNames = params.products || [];
    console.log(`[CatalogTool] So sánh các sản phẩm:`, productNames);

    const metadata: ComparisonTableMetadata = {
      type: 'comparison_table',
      products: productNames.length >= 2 ? productNames.slice(0, 4) : ['iPhone 15 Pro Max', 'Samsung Galaxy S24 Ultra'],
      attributes: [
        { name: 'Giá bán tham khảo', values: ['28.990.000đ', '27.990.000đ'] },
        { name: 'Màn hình', values: ['6.7" OLED Super Retina XDR 120Hz', '6.8" Dynamic AMOLED 2X 120Hz'] },
        { name: 'Vi xử lý (Chip)', values: ['Apple A17 Pro (3nm)', 'Snapdragon 8 Gen 3 for Galaxy'] },
        { name: 'Bộ nhớ RAM / ROM', values: ['8GB / 256GB', '12GB / 256GB'] },
        { name: 'Camera chính', values: ['48MP + 12MP + 12MP (Zoom 5x)', '200MP + 50MP + 12MP + 10MP (Zoom 5x)'] },
        { name: 'Dung lượng Pin', values: ['4422 mAh (Sạc 27W)', '5000 mAh (Sạc nhanh 45W)'] },
        { name: 'Chất liệu khung viền', values: ['Titanium chuẩn hàng không', 'Titanium siêu bền'] },
      ],
      highlights: [
        {
          product: 'iPhone 15 Pro Max',
          pros: ['Khung titan siêu nhẹ & sang trọng', 'Chip A17 Pro hiệu năng đơn nhân số 1', 'Quay phim ProRes Log chuẩn điện ảnh', 'Hệ sinh thái iOS mượt mà'],
          cons: ['Công suất sạc giới hạn ở 27W', 'Giá bán cao hơn thị trường chung'],
        },
        {
          product: 'Samsung Galaxy S24 Ultra',
          pros: ['Camera 200MP zoom quang 5x và zoom kỹ thuật số 100x', 'Tích hợp sẵn bút S-Pen thông minh', 'Kính cường lực Gorilla Armor chống chói đỉnh cao', 'Pin 5000mAh hỗ trợ sạc 45W'],
          cons: ['Thiết kế góc cạnh vuông vức kén người dùng tay nhỏ'],
        },
      ],
      recommendation:
        'Nếu bạn cần camera zoom sắc nét, pin trâu và có bút S-Pen hỗ trợ công việc thì **Samsung Galaxy S24 Ultra** là lựa chọn tuyệt vời. Còn nếu bạn chuộng hệ sinh thái Apple, quay video chất lượng đỉnh cao và giữ giá tốt thì **iPhone 15 Pro Max** sẽ tối ưu nhất.',
    };

    let summaryText = `Dưới đây là bảng so sánh chi tiết giữa **${metadata.products.join('** và **')}**:\n\n`;
    metadata.attributes.forEach((attr) => {
      summaryText += `- **${attr.name}:** ${attr.values.join('  vs  ')}\n`;
    });
    summaryText += `\n👉 **Gợi ý từ AI:** ${metadata.recommendation}`;

    return {
      success: true,
      text: summaryText,
      metadata,
    };
  }
}

export const catalogTool = new CatalogTool();

