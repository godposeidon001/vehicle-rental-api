import { NextFunction, Request, Response } from "express";
import { UserService } from "./user.service";
import { successResponse } from "../../utils/ApiResponse";

export class UserController {
  static async getAll(_req: Request, res: Response, next: NextFunction) {
    try {
      const users = await UserService.getAllUsers();
      const message =
        users.length === 0 ? "No users found" : "Users retrieved successfully";
      res.status(200).json(successResponse(message, users));
    } catch (err) {
      next(err);
    }
  }

  static async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const id = Number(req.params.userId);
      const user = await UserService.getUserById(id);
      res
        .status(200)
        .json(successResponse("User retrieved successfully", user));
    } catch (err) {
      next(err);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const id = Number(req.params.userId);
      const currentUser = req.user!;
      const updated = await UserService.updateUser(currentUser, id, req.body);
      res
        .status(200)
        .json(successResponse("User updated successfully", updated));
    } catch (err) {
      next(err);
    }
  }

  static async remove(req: Request, res: Response, next: NextFunction) {
    try {
      const id = Number(req.params.userId);
      await UserService.deleteUser(id);
      res.status(200).json({
        success: true,
        message: "User deleted successfully",
      });
    } catch (err) {
      next(err);
    }
  }
}
