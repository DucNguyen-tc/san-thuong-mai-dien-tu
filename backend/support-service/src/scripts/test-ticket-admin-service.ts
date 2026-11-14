import { TicketService } from "../services/ticket.service";

async function testAdminMethods() {
  console.log("Checking TicketService admin methods exist...");
  if (typeof (TicketService as any).getAdminTickets !== "function") {
    throw new Error("getAdminTickets method missing");
  }
  if (typeof (TicketService as any).getAdminTicketDetail !== "function") {
    throw new Error("getAdminTicketDetail method missing");
  }
  if (typeof (TicketService as any).updateDraft !== "function") {
    throw new Error("updateDraft method missing");
  }
  if (typeof (TicketService as any).rejectDraft !== "function") {
    throw new Error("rejectDraft method missing");
  }
  console.log("✅ Admin methods signatures verified.");
}

testAdminMethods().catch((e) => {
  console.error("Test failed:", e);
  process.exit(1);
});

