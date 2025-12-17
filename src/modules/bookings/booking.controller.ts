import { NextFunction, Request, Response } from "express";
import { BookingService } from "./booking.service";
import { successResponse } from "../../utils/ApiResponse";

export class BookingController {
  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const currentUser = req.user!;
      const booking = await BookingService.createBooking(currentUser, req.body);
      res
        .status(201)
        .json(successResponse("Booking created successfully", booking));
    } catch (err) {
      next(err);
    }
  }

  static async findAll(req: Request, res: Response, next: NextFunction) {
    try {
      const currentUser = req.user!;
      const bookings = await BookingService.getBookings(currentUser);
      const message =
        bookings.length === 0
          ? "No bookings found"
          : "Bookings retrieved successfully";
      res.status(200).json(successResponse(message, bookings));
    } catch (err) {
      next(err);
    }
  }

  static async updateStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const currentUser = req.user!;
      const bookingId = Number(req.params.bookingId);
      const updated = await BookingService.updateBookingStatus(
        currentUser,
        bookingId,
        req.body
      );

      const status = req.body?.status as string | undefined;

      const message = status === "cancelled" ? "Booking cancelled successfully" : status === "returned" ? "Booking marked as returned. Vehicle is now available." : "Booking updated successfully";

      res
        .status(200)
        .json(successResponse(message, updated));
    } catch (err) {
      next(err);
    }
  }
}
