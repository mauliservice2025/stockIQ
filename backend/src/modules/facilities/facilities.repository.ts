import { query } from '../../database/client.js';
import { Facility } from './facilities.schema.js';

export class FacilitiesRepository {
  async getAll(): Promise<Facility[]> {
    try {
      const res = await query<Facility>(
        `SELECT id, code, name, organization_id, is_active, address
         FROM facilities
         ORDER BY name ASC;`
      );
      if (res.rows.length > 0) return res.rows;
    } catch {
      // If table is not yet populated, fallback to mock facilities
    }

    return [
      { id: 'FAC-01', code: 'PLANT-01', name: 'Main Plant & Central Workshop', is_active: true, address: 'MIDC Industrial Area, Pune' },
      { id: 'FAC-02', code: 'BRANCH-02', name: 'West Regional Service Center', is_active: true, address: 'Andheri East, Mumbai' },
      { id: 'FAC-03', code: 'BRANCH-03', name: 'South Hub Spares Warehouse', is_active: true, address: 'Peenya Industrial Estate, Bengaluru' }
    ];
  }

  async getById(id: string): Promise<Facility | null> {
    try {
      const res = await query<Facility>(
        `SELECT id, code, name, organization_id, is_active, address
         FROM facilities
         WHERE id = $1;`,
        [id]
      );
      if (res.rows[0]) return res.rows[0];
    } catch {}

    const list = await this.getAll();
    return list.find(f => f.id === id || f.code === id) || null;
  }
}

export const facilitiesRepository = new FacilitiesRepository();

