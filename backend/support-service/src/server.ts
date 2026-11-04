import dotenv from "dotenv";
dotenv.config();

import { app } from "./app";

const PORT = process.env.PORT || 3009;

app.listen(PORT, () => {
  console.log(`===============================================`);
  console.log(`🚀 Support Service is running on port ${PORT}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/api/support/health`);
  console.log(`===============================================`);
});

