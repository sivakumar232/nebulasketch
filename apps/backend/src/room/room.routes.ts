import { Router } from "express";
import { createroom } from "./room.controller";
import { authMiddleware } from "../middlewares/auth.middleware";
const router: Router = Router();

router.post("/create",authMiddleware,createroom)