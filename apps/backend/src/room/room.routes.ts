import { Router } from "express";
import { createroom, getchat, joinRoom } from "./room.controller";
import { validate } from "../middlewares/validate.middleware";
import { CreateRoomSchema } from "@repo/common/types";

const router: Router = Router();
// api/room/create
router.post("/create", validate(CreateRoomSchema), createroom);
router.post("/chat/:roomId", getchat);
router.get("/join/:slug", joinRoom);
export default router;