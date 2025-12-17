import { Router } from "express";
import { requireAuth, requireRole } from "../../middleware/auth.middleware";
import { UserController } from "./user.controller";

const router = Router();

router.get("/", requireAuth, requireRole("admin"), UserController.getAll);

router.get("/:userId", requireAuth, UserController.getById);

router.put("/:userId", requireAuth, UserController.update);

export const userRoutes = router;
