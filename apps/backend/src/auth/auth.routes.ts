import { Router } from "express";
import { validate } from "../middlewares/validate.middleware";
import { CreateUserSchema, SigninSchema } from "@repo/common/types";
import { signup, signin } from "./auth.controller";

const router: Router = Router();

router.post("/signup", validate(CreateUserSchema), signup);
router.post("/signin", validate(SigninSchema), signin);

export default router;