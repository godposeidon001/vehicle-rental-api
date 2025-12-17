import { Router } from "express";
import { requireAuth } from "../../middleware/auth.middleware";
import { BookingController } from "./booking.controller";

const router = Router();

router.post("/", requireAuth, BookingController.create);

router.get("/", requireAuth, BookingController.findAll);

export const bookingRoutes = router;
