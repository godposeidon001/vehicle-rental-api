import { NextFunction, Request, Response } from "express";
import { VehicleService } from "./vehicle.service";
import { successResponse } from "../../utils/ApiResponse";

export class VehicleController {
    
    static async create(req:Request, res:Response, next:NextFunction) {
        try{
            const vehicle = await VehicleService.createVehicle(req.body)
            res.status(201).json(successResponse("Vehicle created Successfully", vehicle))
        } catch(err){
            next(err)
        }
    }

    static async findAll(_req:Request, res:Response, next:NextFunction) {
        try{
            const vehicles = await VehicleService.getAllVehicles()
            const message = vehicles.length ===0 ? 'No vehicles found' : 'Vehicles retrieved successfully'
            res.status(200).json(successResponse(message, vehicles))
        } catch(err) {
            next(err)
        }
    }

    static async findById(req: Request, res: Response, next: NextFunction) {
        try {
            const id = Number(req.params.vehicleId)
            const vehicle = await VehicleService.getVehicleById(id)
            res.status(200).json(successResponse('Vehicle retrieved successfully', vehicle))
        } catch (err) {
            next(err)
        }
    }

  static async update(req: Request, res: Response, next: NextFunction) {
        try {
            const id = Number(req.params.vehicleId)
            const vehicle = await VehicleService.updateVehicle(id, req.body)
            res.status(200).json(successResponse('Vehicle updated successfully', vehicle))
        } catch (err) {
            next(err)
        }
    }

}