import { facilitiesRepository } from './facilities.repository.js';
import { Facility } from './facilities.schema.js';

export class FacilitiesService {
  async getAllFacilities(): Promise<Facility[]> {
    return facilitiesRepository.getAll();
  }

  async getFacilityById(id: string): Promise<Facility | null> {
    return facilitiesRepository.getById(id);
  }
}

export const facilitiesService = new FacilitiesService();
