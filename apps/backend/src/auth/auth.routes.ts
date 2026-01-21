import { Router } from "express";
import { validate } from "../middlewares/validate.middleware";
import { CreateUserSchema, SigninSchema } from "@repo/common/types";
import { register, login } from "./auth.controller";

const router: Router = Router();

router.post("/register", validate(CreateUserSchema), register);
router.post("/login", validate(SigninSchema), login);

export default router;