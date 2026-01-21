import { Router } from "express";
import { validate } from "../middlewares/validate.middleware";  
import { loginschema ,registerschema} from "./auth.schema" 
import { register }  from "./auth.controller"

const router:Router = Router();

router.post("/register",validate(registerschema),register)
export default router;