import { Injectable, signal } from '@angular/core';

export interface FacilityInfo {
  id: string;
  code: string;
  name: string;
  organization_id: string;
}

@Injectable({
  providedIn: 'root'
})
export class FacilityService {
  public facilities = signal<FacilityInfo[]>([
    { id: 'PLANT-001', code: 'P01', name: 'Pune Central Manufacturing', organization_id: 'ORG-001' },
    { id: 'PLANT-002', code: 'P02', name: 'Chakan Assembly Facility', organization_id: 'ORG-001' }
  ]);

  public currentFacility = signal<FacilityInfo>({
    id: 'PLANT-001',
    code: 'P01',
    name: 'Pune Central Manufacturing',
    organization_id: 'ORG-001'
  });

  public selectFacility(id: string): void {
    const found = this.facilities().find(f => f.id === id);
    if (found) {
      this.currentFacility.set(found);
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('APEX_ACTIVE_FACILITY_ID', id);
      }
    }
  }
}

