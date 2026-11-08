import * as amqplib from "amqplib";
import { TicketAnalyzerPipeline } from "../services/ticket-analyzer.pipeline";

class RabbitMQService {
  private connection: amqplib.ChannelModel | null = null;
  private channel: amqplib.Channel | null = null;

  private readonly exchange = "support_events";
  private readonly queue = "support.ticket.analyze.queue";
  private readonly routingKey = "ticket.created";

  async connect() {
    const rabbitUrl =
      process.env.RABBITMQ_URL || "amqp://guest:guest@localhost:5672";

    try {
      this.connection = await amqplib.connect(rabbitUrl);
      this.channel = await this.connection.createChannel();

      // Khai báo Exchange dạng topic
      await this.channel.assertExchange(this.exchange, "topic", {
        durable: true
      });

      // Khai báo Queue nhận nhiệm vụ phân tích ticket
      await this.channel.assertQueue(this.queue, {
        durable: true
      });

      // Bind Queue vào Exchange
      await this.channel.bindQueue(this.queue, this.exchange, this.routingKey);

      console.log(`[RabbitMQ] Kết nối thành công tới ${rabbitUrl}`);
      console.log(
        `[RabbitMQ] Đã cấu hình Queue: ${this.queue} bound to ${this.exchange} (${this.routingKey})`
      );

      // Lắng nghe và xử lý message
      await this.setupConsumers();
    } catch (error: any) {
      console.error(
        "[RabbitMQ] Không thể kết nối tới RabbitMQ:",
        error?.message || error
      );
      console.log("[RabbitMQ] Sẽ thử kết nối lại sau 5 giây...");
      setTimeout(() => this.connect(), 5000);
    }
  }

  /**
   * Bắt đầu consume các ticket cần phân tích
   */
  private async setupConsumers() {
    if (!this.channel) return;

    this.channel.prefetch(2); // Xử lý tối đa 2 ticket song song

    this.channel.consume(
      this.queue,
      async (msg) => {
        if (!msg) return;

        try {
          const content = JSON.parse(msg.content.toString());
          const ticketId = content.ticketId;

          if (ticketId) {
            console.log(
              `[RabbitMQ Consumer] Nhận sự kiện phân tích ticket: ${ticketId}`
            );
            await TicketAnalyzerPipeline.processTicketAnalysis(ticketId);
          }

          this.channel?.ack(msg);
        } catch (err: any) {
          console.error(
            "[RabbitMQ Consumer] Lỗi khi xử lý message:",
            err?.message || err
          );
          // Acknowledge để không bị lặp vô tận, pipeline đã tự có fallback DB
          this.channel?.ack(msg);
        }
      },
      { noAck: false }
    );
  }

  /**
   * Đẩy sự kiện ticket được tạo lên RabbitMQ
   */
  async publishTicketCreated(ticketId: string) {
    const payload = {
      ticketId,
      createdAt: new Date().toISOString()
    };

    if (!this.channel) {
      console.warn(
        `[RabbitMQ] Channel chưa sẵn sàng. Kích hoạt fallback xử lý trực tiếp cho ticket ${ticketId}`
      );
      setImmediate(() => {
        TicketAnalyzerPipeline.processTicketAnalysis(ticketId).catch((err) => {
          console.error(
            `[Fallback Pipeline] Lỗi khi xử lý ticket ${ticketId}:`,
            err
          );
        });
      });
      return;
    }

    try {
      const messageBuffer = Buffer.from(JSON.stringify(payload));
      this.channel.publish(this.exchange, this.routingKey, messageBuffer, {
        persistent: true
      });
      console.log(
        `[RabbitMQ] Đã publish sự kiện ${this.routingKey} cho ticket ${ticketId}`
      );
    } catch (error: any) {
      console.error(
        `[RabbitMQ] Lỗi khi publish ${this.routingKey}:`,
        error?.message || error
      );
      // Fallback in-process
      setImmediate(() => {
        TicketAnalyzerPipeline.processTicketAnalysis(ticketId).catch((err) => {
          console.error(
            `[Fallback Pipeline] Lỗi khi xử lý ticket ${ticketId}:`,
            err
          );
        });
      });
    }
  }
}

export const rabbitMQService = new RabbitMQService();

