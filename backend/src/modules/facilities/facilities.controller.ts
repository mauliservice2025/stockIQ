import { Request, Response, NextFunction } from 'express';
import { facilitiesService } from './facilities.service.js';

export async function getFacilitiesController(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const facilities = await facilitiesService.getAllFacilities();
    res.status(200).json({
      success: true,
      data: facilities
    });
  } catch (error) {
    next(error);
  }
}

