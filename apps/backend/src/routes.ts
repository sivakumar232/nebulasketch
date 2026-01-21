import { Router } from "express";
import authRouter from "./auth/auth.routes";
import roomRouter from "./room/room.routes";


const router: Router = Router();

router.use('auth',authRouter)
router.use('room',roomRouter)
export default router;