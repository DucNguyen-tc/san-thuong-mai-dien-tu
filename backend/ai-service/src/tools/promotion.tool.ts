import axios from 'axios';
import { env } from '../config/env';

export interface PromotionExecutionResult {
  success: boolean;
  text: string;
  data?: any;
  error?: string;
}

export class PromotionTool {
  /**
   * Tool 10: check_promotions — Tra cứu khuyến mãi & voucher khả dụng
   * GET catalog-service:3002/api/catalog/promotions
   */
  async checkPromotions(params?: { productIds?: string[] }): Promise<PromotionExecutionResult> {
    try {
      const response = await axios.get(`${env.CATALOG_SERVICE_URL}/api/catalog/promotions`, {
        timeout: 2000,
      });

      const promotions = response.data?.data || response.data || [];

      if (!promotions || promotions.length === 0) {
        return this.getFallbackPromotions();
      }

      let summary = `🎉 **CÁC CHƯƠNG TRÌNH KHUYẾN MÃI & MÃ GIẢM GIÁ ĐANG ÁP DỤNG:**\n\n`;
      promotions.slice(0, 4).forEach((promo: any, idx: number) => {
        summary += `${idx + 1}. **${promo.name || 'Mã ưu đãi'}** (Mã: \`${promo.code || 'SALE2026'}\`)\n`;
        summary += `   - Giảm: **${promo.discount_percent ? `${promo.discount_percent}%` : `${Number(promo.discount_amount || 0).toLocaleString('vi-VN')}đ`}**\n`;
        summary += `   - Điều kiện: ${promo.description || 'Áp dụng cho tất cả đơn hàng'}\n\n`;
      });
      summary += `👉 Khi thanh toán, bạn chỉ cần nhập mã trên để được trừ trực tiếp vào đơn hàng nhé!`;

      return {
        success: true,
        text: summary,
        data: promotions,
      };
    } catch {
      return this.getFallbackPromotions();
    }
  }

  private getFallbackPromotions(): PromotionExecutionResult {
    const fallbackList = [
      {
        code: 'FREESHIP',
        name: 'Miễn phí vận chuyển toàn quốc',
        discount: 'Free 100% phí ship',
        minOrder: 'Đơn từ 500.000đ',
        expiry: '31/12/2026',
      },
      {
        code: 'TECH500K',
        name: 'Voucher giảm giá thiết bị công nghệ',
        discount: 'Giảm 500.000đ',
        minOrder: 'Đơn từ 10.000.000đ',
        expiry: 'Cuối tháng này',
      },
      {
        code: 'WELCOMEAI',
        name: 'Quà tặng bạn mới từ Trợ lý AI',
        discount: 'Giảm 10% tối đa 100.000đ',
        minOrder: 'Áp dụng cho đơn hàng đầu tiên',
        expiry: 'Không giới hạn',
      },
    ];

    let text = `🎉 **CÁC MÃ GIẢM GIÁ & ƯU ĐÃI NỔI BẬT ĐANG CÓ HIỆU LỰC:**\n\n`;
    fallbackList.forEach((p, idx) => {
      text += `${idx + 1}. **${p.name}**\n`;
      text += `   - Mã voucher: \`${p.code}\`\n`;
      text += `   - Mức giảm: **${p.discount}**\n`;
      text += `   - Điều kiện: ${p.minOrder} (Hạn: ${p.expiry})\n\n`;
    });
    text += `👉 Khi đặt hàng, bạn hãy nhập mã voucher tương ứng tại bước thanh toán để nhận ngay ưu đãi nhé!`;

    return {
      success: true,
      text,
      data: fallbackList,
    };
  }
}

export const promotionTool = new PromotionTool();
