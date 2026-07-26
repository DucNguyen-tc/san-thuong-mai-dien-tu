import amqp from 'amqplib';

let channel: amqp.Channel;

export async function connectRabbitMQ() {
  const url = process.env.RABBITMQ_URL || 'amqp://guest:guest@localhost:5672';
  try {
    const connection = await amqp.connect(url);
    channel = await connection.createChannel();
    await channel.assertExchange('product.events', 'topic', { durable: true });
    console.log('[RabbitMQ] Publisher connected to exchange: product.events');
  } catch (error) {
    console.error('[RabbitMQ] Publisher connection failed:', error);
    setTimeout(connectRabbitMQ, 5000);
  }
}

export function publishProductEvent(routingKey: string, payload: any) {
  if (!channel) {
    console.warn('[RabbitMQ] Channel not ready, cannot publish message');
    return;
  }
  const serializedPayload = JSON.stringify(payload, (_, v) => typeof v === 'bigint' ? v.toString() : v);
  channel.publish(
    'product.events',
    routingKey,
    Buffer.from(serializedPayload),
    { persistent: true }
  );
  console.log(`[RabbitMQ] Published event: ${routingKey}`);
}
