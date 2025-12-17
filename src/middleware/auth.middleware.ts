import { NextFunction, Request, Response } from "express"
import { ApiError } from "../utils/ApiError"
import jwt from 'jsonwebtoken'
import {env} from '../config/env'


export interface AuthUserPayload {
    id:number
    role: 'admin' | 'customer'
}

declare global {
    namespace Express {
        interface Request {
            user?: AuthUserPayload
        }
    }
}

function isAuthUserPayload(decoded: unknown): decoded is AuthUserPayload {
    if (!decoded || typeof decoded !== "object"){
        return false
    }

    const d= decoded as Record<string, unknown>;
    const role = d.role;

    return(
        typeof d.id === "number" && (role === "admin" || role === "customer")
    )
}

export function requireAuth(req: Request, _res: Response, next: NextFunction) {
    const header = req.headers.authorization
    if (!header || !header.startsWith('Bearer ')) {
        return next(new ApiError(401, "Authentication token is missing"))
    }

    const token = header.slice("Bearer ".length).trim();

    try{
        const JWT_SECRET = env.JWT_SECRET ?? "";
        const decoded = jwt.verify(token, JWT_SECRET)

        if(!isAuthUserPayload(decoded)) {
            return next(new ApiError(401, "Invalid token payload"))
        }

        req.user = decoded
        next()
    } catch {
        next(new ApiError(401, "Invalid or expired token"))
    }
}

export function requireRole(...roles:Array<'admin' | 'customer'>) {
    return (req:Request, _res:Response, next: NextFunction) => {
        if(!req.user) {
            return next(new ApiError(401, "Unauthorized"))
        }
        if(!roles.includes(req.user.role)){
            return next(new ApiError(403, "Forbidden: insufficient permissions"))
        }
        next()
    }
}