import { Router } from "express";
import { createroom } from "./room.controller";
import { authMiddleware } from "../middlewares/auth.middleware";
import { validate } from "../middlewares/validate.middleware";
import { CreateRoomSchema } from "@repo/common/types";

const router: Router = Router();

router.post("/create",authMiddleware,validate(CreateRoomSchema),createroom);

export default router;