import { db } from "../../config/db";
import { ApiError } from "../../utils/ApiError";

export class VehicleService {
  static async createVehicle(input: {
    vehicle_name: string;
    type: "car" | "bike" | "van" | "SUV";
    registration_number: string;
    daily_rent_price: number;
    availability_status?: "available" | "booked";
  }) {
    const {
      vehicle_name,
      type,
      registration_number,
      daily_rent_price,
      availability_status = "available",
    } = input;

    if (daily_rent_price <= 0) {
      throw new ApiError(400, "daily_rent_price must be positive");
    }

    const exists = await db.query(
      `SELECT id FROM vehicles WHERE registration_number = $1`,
      [registration_number]
    );
    if (exists.rows.length > 0) {
      throw new ApiError(400, "Vehicle with this registration already exists");
    }

    const result = await db.query(
      `INSERT INTO vehicles
       (vehicle_name, type, registration_number, daily_rent_price, availability_status)
        VALUES($1, $2, $3, $4, $5)
        RETURNING id, vehicle_name, type, registration_number, daily_rent_price, availability_status`,
      [
        vehicle_name,
        type,
        registration_number,
        daily_rent_price,
        availability_status,
      ]
    );
    return result.rows[0];
  }

  static async getAllVehicles() {
    const result = await db.query(
      `SELECT id, vehicle_name, type, registration_number, daily_rent_price, availability_status
       FROM vehicles`
    );
    if (result.rows.length === 0) {
      return [];
    }
    return result.rows;
  }

  static async getVehicleById(id: number) {
    const result = await db.query(
      `SELECT id, vehicle_name, type, registration_number, daily_rent_price, availability_status
       FROM vehicles WHERE id = $1`,
      [id]
    );
    if (result.rows.length === 0) {
      throw new ApiError(404, "Vehicle not found");
    }
    return result.rows[0];
  }

  static async updateVehicle(id: number, payload: any) {
    const existing = await this.getVehicleById(id);

    const updated = {
      vehicle_name: payload.vehicle_name ?? existing.vehicle_name,
      type: payload.type ?? existing.type,
      registration_number:
        payload.registration_number ?? existing.registration_number,
      daily_rent_price: payload.daily_rent_price ?? existing.daily_rent_price,
      availability_status:
        payload.availability_status ?? existing.availability_status,
    };

    const result = await db.query(
      `UPDATE vehicles
        SET vehicle_name = $1,
        type = $2,
        registration_number = $3,
        daily_rent_price = $4,
        availability_status = $5
        WHERE id = $6
        RETURNING id, vehicle_name, type, registration_number, daily_rent_price, availability_status`,
      [
        updated.vehicle_name,
        updated.type,
        updated.registration_number,
        updated.daily_rent_price,
        updated.availability_status,
        id,
      ]
    );
    return result.rows[0];
  }
}
