const amqp = require('amqplib');

async function testPublish() {
  try {
    const connection = await amqp.connect('amqp://guest:guest@localhost:5672');
    const channel = await connection.createChannel();
    
    const exchange = 'order_events';
    await channel.assertExchange(exchange, 'topic', { durable: true });
    
    const payload = {
      orderId: 'TEST-12345',
      customerName: 'Nguyễn Văn Test',
      email: 'test@example.com',
      totalAmount: '500,000',
      items: [
        { name: 'Sản phẩm 1', quantity: 2, price: 250000 }
      ]
    };
    
    const message = Buffer.from(JSON.stringify(payload));
    channel.publish(exchange, 'order.completed', message);
    
    console.log(" [x] Sent order.completed event:", payload);
    
    setTimeout(() => {
      connection.close();
      process.exit(0);
    }, 500);
  } catch (error) {
    console.error("Error:", error);
  }
}

testPublish();
