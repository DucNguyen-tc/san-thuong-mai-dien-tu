import { requireStaffOrAdmin } from "../middlewares/auth.middleware";
import { rejectDraftSchema, updateDraftSchema } from "../schemas/admin-ticket.schema";

async function runTests() {
  console.log("=== Testing Staff Schemas ===");
  const validReject = rejectDraftSchema.safeParse({ revision_instruction: "Nhấn mạnh hoàn tiền 100%" });
  if (!validReject.success) throw new Error("rejectDraftSchema failed valid input");

  const invalidReject = rejectDraftSchema.safeParse({ revision_instruction: "123" });
  if (invalidReject.success) throw new Error("rejectDraftSchema accepted too short instruction");

  const validDraft = updateDraftSchema.safeParse({ final_response: "Phản hồi chuẩn", staff_notes: "Ghi chú" });
  if (!validDraft.success) throw new Error("updateDraftSchema failed valid input");

  console.log("=== Testing requireStaffOrAdmin middleware logic ===");
  let nextCalled = false;
  const mockReqUserStaff: any = { user: { id: "1", role: "STAFF" } };
  const mockReqCustomer: any = { user: { id: "2", role: "CUSTOMER" } };
  const mockRes: any = {
    status: (code: number) => ({
      json: (data: any) => ({ code, data })
    })
  };

  requireStaffOrAdmin(mockReqUserStaff, mockRes, () => { nextCalled = true; });
  if (!nextCalled) throw new Error("requireStaffOrAdmin blocked STAFF role");

  let blocked = false;
  const mockResBlocked: any = {
    status: (code: number) => {
      if (code === 403) blocked = true;
      return { json: () => {} };
    }
  };
  requireStaffOrAdmin(mockReqCustomer, mockResBlocked, () => {});
  if (!blocked) throw new Error("requireStaffOrAdmin did not block CUSTOMER role");

  console.log("✅ Task 1 tests passed successfully!");
}

runTests().catch((err) => {
  console.error("❌ Test failed:", err);
  process.exit(1);
});

