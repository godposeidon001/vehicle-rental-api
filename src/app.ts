import express, { Request, Response } from "express";
import { errorHandler } from "./middleware/error.middleware";
import { authRoutes } from "./modules/auth/auth.routes";
import { userRoutes } from "./modules/users/user.routes";
import { vehicleRoutes } from "./modules/vehicles/vehicle.routes";



const app = express();


app.use(express.json());

app.get("/", (req:Request, res:Response) =>{
    res.send("Hello World love");
})

app.use('/api/v1/auth', authRoutes)

app.use('/api/v1/users', userRoutes)

app.use('/api/v1/vehicles', vehicleRoutes)


app.use(errorHandler);

export default app;
