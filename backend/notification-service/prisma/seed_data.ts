import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding notification templates...');

  await prisma.notificationTemplate.upsert({
    where: { code: 'ORDER_CONFIRM' },
    update: {},
    create: {
      code: 'ORDER_CONFIRM',
      subject_template: 'Xác nhận đơn hàng #{{orderId}}',
      body_template: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
        <h2 style="color: #2c3e50; text-align: center;">Cảm ơn bạn đã đặt hàng!</h2>
        <p>Xin chào <strong>{{customerName}}</strong>,</p>
        <p>Đơn hàng <strong>#{{orderId}}</strong> của bạn đã được xác nhận thành công.</p>
        <p>Tổng thanh toán: <strong style="color: #e74c3c;">{{totalAmount}} VNĐ</strong></p>
        <p>Chúng tôi sẽ sớm giao hàng đến bạn. Cảm ơn bạn đã mua sắm tại cửa hàng!</p>
        <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
        <p style="font-size: 12px; color: #888; text-align: center;">Đây là email tự động, vui lòng không trả lời email này.</p>
      </div>
      `
    }
  });

  await prisma.notificationTemplate.upsert({
    where: { code: 'ORDER_SHIPPING' },
    update: {},
    create: {
      code: 'ORDER_SHIPPING',
      subject_template: 'Đơn hàng #{{orderId}} đang được giao',
      body_template: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
        <h2 style="color: #f39c12; text-align: center;">Đơn hàng đang trên đường đến!</h2>
        <p>Xin chào <strong>{{customerName}}</strong>,</p>
        <p>Tin vui! Đơn hàng <strong>#{{orderId}}</strong> của bạn đã được bàn giao cho đơn vị vận chuyển.</p>
        <p>Tổng thanh toán: <strong style="color: #e74c3c;">{{totalAmount}} VNĐ</strong></p>
        <p>Vui lòng chú ý điện thoại để nhận hàng từ shipper.</p>
        <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
        <p style="font-size: 12px; color: #888; text-align: center;">Đây là email tự động, vui lòng không trả lời email này.</p>
      </div>
      `
    }
  });

  await prisma.notificationTemplate.upsert({
    where: { code: 'ORDER_DELIVERED' },
    update: {},
    create: {
      code: 'ORDER_DELIVERED',
      subject_template: 'Giao hàng thành công #{{orderId}}',
      body_template: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
        <h2 style="color: #27ae60; text-align: center;">Giao hàng thành công!</h2>
        <p>Xin chào <strong>{{customerName}}</strong>,</p>
        <p>Đơn hàng <strong>#{{orderId}}</strong> của bạn đã được giao thành công.</p>
        <p>Tổng thanh toán: <strong style="color: #e74c3c;">{{totalAmount}} VNĐ</strong></p>
        <p>Hy vọng bạn hài lòng với sản phẩm. Đừng quên để lại đánh giá nhé!</p>
        <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
        <p style="font-size: 12px; color: #888; text-align: center;">Đây là email tự động, vui lòng không trả lời email này.</p>
      </div>
      `
    }
  });

  await prisma.notificationTemplate.upsert({
    where: { code: 'ORDER_CANCELLED' },
    update: {},
    create: {
      code: 'ORDER_CANCELLED',
      subject_template: 'Đơn hàng #{{orderId}} đã bị hủy',
      body_template: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
        <h2 style="color: #c0392b; text-align: center;">Đơn hàng đã bị hủy</h2>
        <p>Xin chào <strong>{{customerName}}</strong>,</p>
        <p>Rất tiếc phải thông báo đơn hàng <strong>#{{orderId}}</strong> của bạn đã bị hủy.</p>
        <p>Tổng thanh toán: <strong style="color: #e74c3c;">{{totalAmount}} VNĐ</strong></p>
        <p>Nếu bạn đã thanh toán, tiền sẽ được hoàn lại theo quy định của cửa hàng.</p>
        <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
        <p style="font-size: 12px; color: #888; text-align: center;">Đây là email tự động, vui lòng không trả lời email này.</p>
      </div>
      `
    }
  });

  console.log('Seeding completed.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
