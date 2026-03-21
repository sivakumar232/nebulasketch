import { Router } from "express";
import { createroom, getchat } from "./room.controller";
import { authMiddleware } from "../middlewares/auth.middleware";
import { validate } from "../middlewares/validate.middleware";
import { CreateRoomSchema } from "@repo/common/types";

const router: Router = Router();
// api/room/create
router.post("/create", validate(CreateRoomSchema), createroom);
router.post("/chat/:roomId", getchat)
export default router;