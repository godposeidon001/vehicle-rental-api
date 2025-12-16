import { NextFunction, Request, Response } from "express";
import { AuthService } from "./auth.service";
import { successResponse } from "../../utils/ApiResponse";


export class AuthController {
    static async signup(req: Request, res:Response, next: NextFunction) {
        try {
            const user = await AuthService.signup(req.body)
            res.status(201).json(
                successResponse("User registered successfully", user)
            )
        } catch(err) {
            next(err)
        }
    }

    static async signin(req:Request, res:Response, next:NextFunction) {
        try {
            const result = await AuthService.signin(req.body)
            res.status(200).json(
                successResponse("Login Successful", result)
            )
        } catch (err) {
            next(err)
        }
    }
}