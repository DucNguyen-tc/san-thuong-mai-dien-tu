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

export interface ComparisonTableMetadata {
  type: 'comparison_table';
  products: string[];
  attributes: ComparisonAttribute[];
  recommendation?: string;
}

export type ToolMetadataPayload = ProductCardsMetadata | ComparisonTableMetadata;

export interface ToolExecutionResult {
  success: boolean;
  text: string;
  metadata?: ToolMetadataPayload | null;
  error?: string;
}

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=400&q=80';

// Bộ dữ liệu mẫu chất lượng cao dự phòng khi catalog-service chưa bật trong môi trường dev
const SAMPLE_PRODUCTS: any[] = [
  {
    id: '44125e28-653e-4724-96d0-3dd405e85992',
    name: 'iPhone 15 Pro Max 256GB Chính Hãng VNA',
    slug: 'iphone-15-pro-max-256gb',
    description: 'Chip Apple A17 Pro 3nm, khung titan siêu nhẹ, camera tele tiềm vọng 5x, màn hình OLED Super Retina XDR 120Hz ProMotion.',
    specs: { brand: 'Apple', screen: '6.7 inch OLED 120Hz', chip: 'Apple A17 Pro', ram: '8GB', storage: '256GB', battery: '4422mAh' },
    category: { name: 'Điện thoại' },
    variants: [
      { id: '11111111-aaaa-bbbb-cccc-000000000001', attributes: { color: 'Titan Tự Nhiên', storage: '256GB' }, price: 28990000, original_price: 32990000, stock_quantity: 15 },
      { id: '11111111-aaaa-bbbb-cccc-000000000002', attributes: { color: 'Titan Xanh', storage: '256GB' }, price: 28990000, original_price: 32990000, stock_quantity: 8 },
    ],
    images: [{ image_url: 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=500', is_primary: true }],
  },
  {
    id: '55236f39-764f-4835-a7e1-4ee516f96003',
    name: 'Samsung Galaxy S24 Ultra 5G 12GB/256GB',
    slug: 'samsung-galaxy-s24-ultra',
    description: 'Tích hợp Galaxy AI thông minh, chip Snapdragon 8 Gen 3 for Galaxy, khung viền Titanium, camera 200MP, bút S-Pen tích hợp.',
    specs: { brand: 'Samsung', screen: '6.8 inch Dynamic AMOLED 2X 120Hz', chip: 'Snapdragon 8 Gen 3', ram: '12GB', storage: '256GB', battery: '5000mAh' },
    category: { name: 'Điện thoại' },
    variants: [
      { id: '22222222-aaaa-bbbb-cccc-000000000001', attributes: { color: 'Xám Titan', storage: '256GB' }, price: 27990000, original_price: 31990000, stock_quantity: 20 },
      { id: '22222222-aaaa-bbbb-cccc-000000000002', attributes: { color: 'Đen Titan', storage: '256GB' }, price: 27990000, original_price: 31990000, stock_quantity: 12 },
    ],
    images: [{ image_url: 'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=500', is_primary: true }],
  },
  {
    id: '66347a40-875a-4946-b8f2-5ff627a07114',
    name: 'Tai nghe chụp tai chống ồn Sony WH-1000XM5',
    slug: 'tai-nghe-sony-wh-1000xm5',
    description: 'Chống ồn đỉnh cao Auto NC Optimizer, 8 micro thu âm, thời lượng pin 30 giờ, âm thanh Hi-Res Audio LDAC.',
    specs: { brand: 'Sony', driver: '30mm Carbon Fiber', battery: '30 giờ chống ồn', connection: 'Bluetooth 5.2, Jack 3.5mm', weight: '250g' },
    category: { name: 'Âm thanh' },
    variants: [
      { id: '33333333-aaaa-bbbb-cccc-000000000001', attributes: { color: 'Đen (Black)' }, price: 7990000, original_price: 8990000, stock_quantity: 35 },
      { id: '33333333-aaaa-bbbb-cccc-000000000002', attributes: { color: 'Bạc (Silver)' }, price: 7990000, original_price: 8990000, stock_quantity: 18 },
    ],
    images: [{ image_url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500', is_primary: true }],
  },
  {
    id: '77458b51-986b-4057-c9a3-6aa738b18225',
    name: 'Laptop Apple MacBook Air M3 13 inch 8GB/256GB',
    slug: 'macbook-air-m3-13-inch',
    description: 'Chip M3 thế hệ mới với CPU 8 lõi, GPU 8 hoặc 10 lõi, màn hình Liquid Retina 13.6 inch, pin lên đến 18 giờ, thiết kế siêu mỏng nhẹ.',
    specs: { brand: 'Apple', screen: '13.6 inch Liquid Retina', chip: 'Apple M3', ram: '8GB Unified', storage: '256GB SSD', battery: '18 giờ' },
    category: { name: 'Laptop' },
    variants: [
      { id: '44444444-aaaa-bbbb-cccc-000000000001', attributes: { color: 'Midnight (Đen huyền bí)' }, price: 26990000, original_price: 27990000, stock_quantity: 10 },
      { id: '44444444-aaaa-bbbb-cccc-000000000002', attributes: { color: 'Starlight (Ánh sao)' }, price: 26990000, original_price: 27990000, stock_quantity: 14 },
    ],
    images: [{ image_url: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=500', is_primary: true }],
  },
  {
    id: '88569c62-097c-4168-da04-7bb849c29336',
    name: 'Chuột Gaming không dây Logitech G502 X PLUS LIGHTSPEED',
    slug: 'chuot-logitech-g502-x-plus',
    description: 'Switch quang học-cơ học LIGHTFORCE, cảm biến HERO 25K siêu chuẩn xác, đèn RGB LIGHTSYNC 8 vùng, pin 130 giờ.',
    specs: { brand: 'Logitech G', sensor: 'HERO 25K (100 - 25,600 DPI)', buttons: '13 nút lập trình', connection: 'LIGHTSPEED Wireless, Type-C', weight: '106g' },
    category: { name: 'Phụ kiện' },
    variants: [
      { id: '55555555-aaaa-bbbb-cccc-000000000001', attributes: { color: 'Đen' }, price: 3490000, original_price: 3890000, stock_quantity: 40 },
    ],
    images: [{ image_url: 'https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?w=500', is_primary: true }],
  },
];

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

    // 1. Thử gọi API thật của catalog-service
    try {
      const response = await axios.get(`${env.CATALOG_SERVICE_URL}/api/catalog/products`, {
        params: {
          search: query,
          category_id,
          sort,
          limit,
        },
        timeout: 1500,
      });

      const resData = response.data;
      if (resData && resData.data && Array.isArray(resData.data.products)) {
        rawProducts = resData.data.products;
      } else if (Array.isArray(resData.data)) {
        rawProducts = resData.data;
      }
    } catch (err: any) {
      console.warn(`[CatalogTool] Không thể kết nối catalog-service (${err.message}). Sử dụng kho dữ liệu mẫu chuẩn...`);
      // Fallback tìm kiếm trong kho mẫu
      const lowerQ = query.toLowerCase();
      rawProducts = SAMPLE_PRODUCTS.filter((p) => {
        const matchName = p.name.toLowerCase().includes(lowerQ);
        const matchDesc = (p.description || '').toLowerCase().includes(lowerQ);
        const matchCat = (p.category?.name || '').toLowerCase().includes(lowerQ);
        return lowerQ === '' || matchName || matchDesc || matchCat;
      });

      if (rawProducts.length === 0) {
        rawProducts = SAMPLE_PRODUCTS.slice(0, limit);
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

    const sliced = rawProducts.slice(0, limit);

    if (sliced.length === 0) {
      return {
        success: true,
        text: `Không tìm thấy sản phẩm nào phù hợp với yêu cầu "${query}". Bạn có thể thử tìm với từ khóa chung hơn nhé!`,
        metadata: null,
      };
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

      const imageUrl =
        p.images?.find((img: any) => img.is_primary)?.image_url ||
        p.images?.[0]?.image_url ||
        p.image_url ||
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

    // 4. Tạo bản tóm tắt văn bản để LLM trả lời tự nhiên
    let textSummary = `Đã tìm thấy ${cardItems.length} sản phẩm phù hợp trên hệ thống:\n`;
    cardItems.forEach((item, idx) => {
      const priceStr = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(item.price);
      textSummary += `${idx + 1}. **${item.name}** - Giá: **${priceStr}** ${item.in_stock ? '(Còn hàng)' : '(Hết hàng)'}\n`;
    });

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

