import { Router } from 'express';
import { getFacilitiesController } from './facilities.controller.js';

export const facilitiesRouter = Router();

facilitiesRouter.get('/', getFacilitiesController);
