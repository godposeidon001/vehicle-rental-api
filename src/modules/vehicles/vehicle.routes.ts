import { Router } from "express";
import { requireAuth, requireRole } from "../../middleware/auth.middleware";
import { VehicleController } from "./vehicle.controller";

const router = Router();

router.post("/", requireAuth, requireRole("admin"), VehicleController.create);

router.get("/", VehicleController.findAll);

router.get("/:vehicleId", VehicleController.findById);

router.put("/:vehicleId", requireAuth, requireRole("admin"), VehicleController.update);

export const vehicleRoutes = router;
