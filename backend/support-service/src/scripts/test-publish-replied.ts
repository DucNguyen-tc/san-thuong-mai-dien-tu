import { rabbitMQService } from "../rabbitmq/rabbitmq.service";

async function testPublish() {
  console.log("Testing rabbitMQService.publishTicketReplied function...");
  if (typeof (rabbitMQService as any).publishTicketReplied !== "function") {
    throw new Error("publishTicketReplied is missing on rabbitMQService");
  }
  console.log("✅ publishTicketReplied signature confirmed.");
}

testPublish().catch((e) => {
  console.error("Test failed:", e);
  process.exit(1);
});

