import { Router } from "express";
import roomRouter from "./room/room.routes";


const router: Router = Router();
//route for room 
router.use('/room', roomRouter)
export default router;