import { db } from "../../config/db";
import { AuthUserPayload } from "../../middleware/auth.middleware";
import { ApiError } from "../../utils/ApiError";

interface CreateBookingInput {
  customer_id?: number;
  vehicle_id: number;
  rent_start_date: string;
  rent_end_date: string;
}

interface UpdateBookingInput {
  status: "cancelled" | "returned";
}

function differenceInDays(start: Date, end: Date): number {
  const ms = end.getTime() - start.getTime();
  return Math.ceil(ms / (1000 * 60 * 60 * 24));
}

export class BookingService {
  static async createBooking(
    currentUser: AuthUserPayload,
    input: CreateBookingInput
  ) {
    const { vehicle_id, rent_start_date, rent_end_date } = input;
    let customerId = input.customer_id;

    if (!vehicle_id || !rent_start_date || !rent_end_date) {
      throw new ApiError(
        400,
        "vehicle_id, rent_start_date, rent_end_date are required"
      );
    }

    if (currentUser.role === "customer") {
      customerId = currentUser.id;
    } else if (!customerId) {
      throw new ApiError(
        400,
        "customer_id is required when creating booking as admin"
      );
    }

    const start = new Date(rent_start_date);
    const end = new Date(rent_end_date);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      throw new ApiError(400, "Invalid date format");
    }

    if (end <= start) {
      throw new ApiError(
        400,
        "rent_end_date must be later than rent_start_date"
      );
    }

    const days = differenceInDays(start, end);

    if (days <= 0) {
      throw new ApiError(400, "Booking must be at least 1 day");
    }

    const vehicleResult = await db.query(
      `SELECT id, daily_rent_price, availability_status
            FROM vehicles WHERE id = $1`,
      [vehicle_id]
    );

    const vehicle = vehicleResult.rows[0];

    if (!vehicle) {
      throw new ApiError(404, "Vehicle not found");
    }

    if (vehicle.availability_status !== "available") {
      throw new ApiError(400, "Vehicle is not available for booking");
    }

    const overlap = await db.query(
      `SELECT id FROM bookings
            WHERE vehicle_id = $1
            AND status = 'active'
            AND NOT($3 < rent_start_date OR $2 > rent_end_date)`,
      [vehicle_id, rent_start_date, rent_end_date]
    );

    if (overlap.rows.length > 0) {
      throw new ApiError(400, "Vehicle already booked for the selected dates");
    }

    const total_price = Number(vehicle.daily_rent_price) * days;

    const client = await db.connect();
    try {
      await client.query("BEGIN");

      const bookingInsert = await client.query(
        `INSERT INTO bookings
                    (customer_id, vehicle_id, rent_start_date, rent_end_date, 
                    total_price, status)
                    VALUES ($1, $2, $3::date, $4::date, $5, 'active')
                    RETURNING id`,
        [customerId, vehicle_id, rent_start_date, rent_end_date, total_price]
      );

      const bookingId = bookingInsert.rows[0].id;

      const bookingResult = await client.query(
        `SELECT
        b.id,
        b.customer_id,
        b.vehicle_id,
        b.rent_start_date::text AS rent_start_date,
        b.rent_end_date::text AS rent_end_date,
        b.total_price::float8 AS total_price,
        b.status,
        json_build_object(
        'vehicle_name', v.vehicle_name,
        'daily_rent_price', v.daily_rent_price
        ) AS vehicle
        FROM bookings b
        JOIN vehicles v ON v.id = b.vehicle_id
        WHERE b.id = $1`,
        [bookingId]
      );

      await client.query(
        `UPDATE vehicles
                    SET availability_status = 'booked'
                    WHERE id = $1`,
        [vehicle_id]
      );

      await client.query("COMMIT");
      return bookingResult.rows[0];
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  }

  static async getBookings(currentUser: AuthUserPayload) {
    if (currentUser.role === "admin") {
      const result = await db.query(`
                SELECT
                b.id,
                b.customer_id,
                b.vehicle_id,
                b.rent_start_date::text AS rent_start_date,
                b.rent_end_date::text   AS rent_end_date,
                b.total_price::float8   AS total_price,
                b.status,
                json_build_object(
                'name', u.name,
                'email', u.email
                ) AS customer,
                json_build_object(
                'vehicle_name', v.vehicle_name,
                'registration_number', v.registration_number
                ) AS vehicle
                FROM bookings b
                JOIN users u    ON u.id = b.customer_id
                JOIN vehicles v ON v.id = b.vehicle_id
                ORDER BY b.id ASC
                `);
      return result.rows;
    } else {
      const result = await db.query(
        `SELECT
        b.id,
        b.vehicle_id,
        b.rent_start_date::text AS rent_start_date,
        b.rent_end_date::text   AS rent_end_date,
        b.total_price::float8   AS total_price,
        b.status,
        json_build_object(
        'vehicle_name', v.vehicle_name,
        'registration_number', v.registration_number,
        'type', v.type
        ) AS vehicle
        FROM bookings b
        JOIN vehicles v ON v.id = b.vehicle_id
        WHERE b.customer_id = $1
        ORDER BY b.id ASC
        `,
        [currentUser.id]
      );
      return result.rows;
    }
  }

  static async updateBookingStatus(
    currentUser: AuthUserPayload,
    bookingId: number,
    input: UpdateBookingInput
  ) {
    const { status } = input;

    const { rows } = await db.query(`SELECT * FROM bookings WHERE id = $1`, [
      bookingId,
    ]);
    const booking = rows[0];
    if (!booking) {
      throw new ApiError(404, "Booking not found");
    }

    if (booking.status !== "active") {
      throw new ApiError(400, "Only active bookings can be updated");
    }

    const today = new Date();
    const todayDateOnly = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate()
    );

    if (currentUser.role === "customer") {
      if (booking.customer_id !== currentUser.id) {
        throw new ApiError(403, "You can only modify your own bookings");
      }

      if (status !== "cancelled") {
        throw new ApiError(400, "Customers can only cancel their bookings");
      }

      const startDateOnly = new Date(booking.rent_start_date);
      if (startDateOnly <= todayDateOnly) {
        throw new ApiError(
          400,
          "Cannot cancel booking that has already started"
        );
      }
    }

    if (currentUser.role === "admin") {
      if (status !== "returned") {
        throw new ApiError(400, "Admins can only mark bookings as returned");
      }
    }

    const client = await db.connect();
    try {
      await client.query("BEGIN");

      const updatedResult = await client.query(
        `UPDATE bookings
       SET status = $1,
           updated_at = NOW()
       WHERE id = $2
       RETURNING
         id,
         customer_id,
         vehicle_id,
         rent_start_date::text AS rent_start_date,
         rent_end_date::text   AS rent_end_date,
         total_price::float8   AS total_price,
         status`,
        [status, bookingId]
      );

      const updatedBooking = updatedResult.rows[0];

      await client.query(
        `UPDATE vehicles
       SET availability_status = 'available',
           updated_at = NOW()
       WHERE id = $1`,
        [booking.vehicle_id]
      );

      await client.query("COMMIT");
      
      if (status === "returned") {
        return {
          ...updatedBooking,
          vehicle: {
            availability_status: "available",
          },
        };
      }
      return updatedBooking;
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  }
}
