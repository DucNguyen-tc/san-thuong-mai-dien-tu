export const orderConfirmationTemplate = (orderId: string, customerName: string, totalAmount: string) => {
  return `
    <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
      <h2 style="color: #4f46e5;">Xác nhận đơn hàng #${orderId}</h2>
      <p>Xin chào <strong>${customerName}</strong>,</p>
      <p>Cảm ơn bạn đã mua sắm tại V-Shop. Đơn hàng của bạn đã được xác nhận và đang trong quá trình xử lý.</p>
      
      <div style="background-color: #f9fafb; padding: 15px; border-radius: 8px; margin: 20px 0;">
        <h3 style="margin-top: 0;">Thông tin đơn hàng</h3>
        <p><strong>Mã đơn hàng:</strong> ${orderId}</p>
        <p><strong>Tổng tiền:</strong> ${totalAmount} VNĐ</p>
      </div>
      
      <p>Bạn có thể theo dõi trạng thái đơn hàng trong phần "Đơn hàng của tôi" trên website.</p>
      <p>Trân trọng,<br>Đội ngũ V-Shop</p>
    </div>
  `;
};

export const orderShippingTemplate = (orderId: string, customerName: string, totalAmount: string) => {
  return `
    <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
      <h2 style="color: #f59e0b;">Đơn hàng #${orderId} đang được giao</h2>
      <p>Xin chào <strong>${customerName}</strong>,</p>
      <p>Tin vui! Đơn hàng của bạn đã được bàn giao cho đơn vị vận chuyển và đang trên đường đến tay bạn.</p>
      
      <div style="background-color: #f9fafb; padding: 15px; border-radius: 8px; margin: 20px 0;">
        <h3 style="margin-top: 0;">Thông tin đơn hàng</h3>
        <p><strong>Mã đơn hàng:</strong> ${orderId}</p>
        <p><strong>Tổng tiền:</strong> ${totalAmount} VNĐ</p>
      </div>
      
      <p>Vui lòng chú ý điện thoại để shipper có thể liên lạc với bạn khi giao hàng.</p>
      <p>Trân trọng,<br>Đội ngũ V-Shop</p>
    </div>
  `;
};

export const orderDeliveredTemplate = (orderId: string, customerName: string, totalAmount: string) => {
  return `
    <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
      <h2 style="color: #10b981;">Giao hàng thành công #${orderId}</h2>
      <p>Xin chào <strong>${customerName}</strong>,</p>
      <p>Đơn hàng của bạn đã được giao thành công. Hy vọng bạn hài lòng với các sản phẩm từ V-Shop!</p>
      
      <div style="background-color: #f9fafb; padding: 15px; border-radius: 8px; margin: 20px 0;">
        <h3 style="margin-top: 0;">Thông tin đơn hàng</h3>
        <p><strong>Mã đơn hàng:</strong> ${orderId}</p>
        <p><strong>Tổng tiền:</strong> ${totalAmount} VNĐ</p>
      </div>
      
      <p>Nếu có bất kỳ vấn đề gì về sản phẩm, vui lòng liên hệ với bộ phận chăm sóc khách hàng của chúng tôi.</p>
      <p>Trân trọng,<br>Đội ngũ V-Shop</p>
    </div>
  `;
};

export const orderCancelledTemplate = (orderId: string, customerName: string, totalAmount: string) => {
  return `
    <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
      <h2 style="color: #ef4444;">Đơn hàng #${orderId} đã bị hủy</h2>
      <p>Xin chào <strong>${customerName}</strong>,</p>
      <p>Đơn hàng của bạn đã được hủy thành công theo yêu cầu hoặc do một số lý do khách quan.</p>
      
      <div style="background-color: #f9fafb; padding: 15px; border-radius: 8px; margin: 20px 0;">
        <h3 style="margin-top: 0;">Thông tin đơn hàng</h3>
        <p><strong>Mã đơn hàng:</strong> ${orderId}</p>
        <p><strong>Tổng tiền:</strong> ${totalAmount} VNĐ</p>
      </div>
      
      <p>Nếu bạn đã thanh toán, tiền sẽ được hoàn lại vào tài khoản của bạn trong thời gian sớm nhất.</p>
      <p>Trân trọng,<br>Đội ngũ V-Shop</p>
    </div>
  `;
};

export const welcomeEmailTemplate = (customerName: string) => {
  return `
    <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
      <h2 style="color: #4f46e5;">Chào mừng đến với V-Shop!</h2>
      <p>Xin chào <strong>${customerName}</strong>,</p>
      <p>Tài khoản của bạn đã được tạo thành công. Bây giờ bạn có thể trải nghiệm mua sắm và nhận những gợi ý sản phẩm phù hợp nhất với sở thích của mình.</p>
      <p>Trân trọng,<br>Đội ngũ V-Shop</p>
    </div>
  `;
};
