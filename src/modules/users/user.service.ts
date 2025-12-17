import {db} from '../../config/db'
import { AuthUserPayload } from '../../middleware/auth.middleware'
import { ApiError } from '../../utils/ApiError'


interface UpdateUserInput {
    name?: string
    phone?: string
    email?: string
    role?: 'admin' | 'customer'
}

export class UserService {
    
    static async getAllUsers() {
        const result = await db.query(
            `SELECT id, name, email, phone, role, created_at
            FROM users
            ORDER BY id ASC`
        )
        return result.rows
    }

    static async getUserById(id: number) {
        const result = await db.query(
            `SELECT id, name, email, phone, role, created_at
            FROM users WHERE id=$1`,
            [id]
        )
        const user = result.rows[0]

        if(!user){
            throw new ApiError(404, "User not found")
        }
        return user
    }

    static async updateUser (currentUser:AuthUserPayload, userId:number, input:UpdateUserInput) {
        const existing = await this.getUserById(userId)

        if(currentUser.role === 'customer' && currentUser.id !== userId) {
            throw new ApiError(403, "You can only update your own profile")
        }

        let newRole = existing.role

        if(currentUser.role === 'admin' && input.role) {
            newRole = input.role
        }

        if(currentUser.role === 'customer' && input.role) {
            delete input.role
        }

        const name = input.name ?? existing.name
        const phone = input.phone ?? existing.phone
        const email = input.email !== undefined && input.email !== null ? input.email.trim().toLowerCase() : existing.email;

        const result = await db.query(
            `UPDATE users
            SET name=$1, email=$2, phone=$3, role=$4, updated_at=NOW()
            WHERE id=$5
            RETURNING id, name, email, phone, role, created_at`,
            [name, email, phone, newRole, userId]
        )
        return result.rows[0];
    }
}