// MUST be first import to load .env
import { PORT, NODE_ENV } from "@repo/backend-common/config";
import express from "express";
import routes from "./routes";

const app = express();

app.use(express.json());
app.use('/api', routes);

app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📦 Environment: ${NODE_ENV}`);
});