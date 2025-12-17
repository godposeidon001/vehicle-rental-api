import { ApiError } from "../../utils/ApiError";
import bcrypt from "bcryptjs";
import { env } from "../../config/env";
import { db } from "../../config/db";
import jwt from "jsonwebtoken";
import type ms from "ms";

interface SignupInput {
  name: string;
  email: string;
  password: string;
  phone: string;
  role?: "admin" | "customer";
}

interface SigninInput {
  email: string;
  password: string;
}

export class AuthService {
  static async signup(input: SignupInput) {
    const { name, email, password, phone, role = "customer" } = input;

    if (!name || !email || !password || !phone) {
      throw new ApiError(400, "name, email, password, phone are required");
    }

    if (password.length < 6) {
      throw new ApiError(400, "Password must be at least 6 characters long");
    }

    const existing = await db.query("SELECT id FROM users WHERE email = $1", [
      email.toLowerCase(),
    ]);

    if (existing.rows.length > 0) {
      throw new ApiError(400, "Email already registered");
    }

    const saltRounds = Number(env.BCRYPT_SALT_ROUNDS) || 10;
    const hashed = await bcrypt.hash(password, saltRounds);

    const result = await db.query(
      `INSERT INTO users (name, email, password, phone, role)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING id, name, email, phone, role`,
      [name, email.toLowerCase(), hashed, phone, role]
    );

    return result.rows[0];
  }

  static async signin(input: SigninInput) {
    const { email, password } = input;

    if (!email || !password) {
      throw new ApiError(400, "email and password are required");
    }

    const result = await db.query(
      `SELECT id, name, email, phone, role, password 
            FROM users WHERE email = $1`,
      [email.toLowerCase()]
    );

    const user = result.rows[0];

    if (!user) {
      throw new ApiError(401, "Invalid credentials");
    }

    const match = await bcrypt.compare(password, user.password);

    if (!match) {
      throw new ApiError(401, "Invalid credentials");
    }

    const JWT_SECRET = env.JWT_SECRET ?? "";
    const expiresIn = (env.JWT_EXPIRES_IN ?? "") as ms.StringValue;
    const payload = { id: user.id, role: user.role };
    const token = jwt.sign(payload, JWT_SECRET, {
      expiresIn,
    });

    return {
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
      },
    };
  }
}
