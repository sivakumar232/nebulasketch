import { Router } from "express";
import authRouter from "./auth/auth.routes";
import roomRouter from "./room/room.routes";


const router: Router = Router();
//route for auth 
router.use('/auth', authRouter)
//route for room 
router.use('/room', roomRouter)
export default router;