import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { Shift } from '../types/types';

interface ShiftDB extends DBSchema {
  shifts: {
    key: string;
    value: Shift;
    indexes: {
      'by-status': string;
      'by-startTime': Date;
    };
  };
}

class DatabaseService {
  private db: IDBPDatabase<ShiftDB> | null = null;
  private initPromise: Promise<void> | null = null;

  constructor() {
    this.initPromise = this.initializeDB();
  }

  private async initializeDB(): Promise<void> {
    try {
      this.db = await openDB<ShiftDB>('shift-scheduler', 1, {
        upgrade(db) {
          const store = db.createObjectStore('shifts', { keyPath: 'id' });
          store.createIndex('by-status', 'status');
          store.createIndex('by-startTime', 'startTime');
        },
      });
    } catch (error) {
      console.error('Error initializing database:', error);
      throw error;
    }
  }

  private async ensureDB(): Promise<IDBPDatabase<ShiftDB>> {
    if (!this.initPromise) {
      this.initPromise = this.initializeDB();
    }
    await this.initPromise;
    if (!this.db) {
      throw new Error('Database initialization failed');
    }
    return this.db;
  }

  async getAllShifts(): Promise<Shift[]> {
    const db = await this.ensureDB();
    return db.getAll('shifts');
  }

  async createShift(shift: Shift): Promise<void> {
    const db = await this.ensureDB();
    await db.add('shifts', shift);
  }

  async updateShift(shift: Shift): Promise<void> {
    const db = await this.ensureDB();
    await db.put('shifts', shift);
  }

  async deleteShift(id: string): Promise<void> {
    const db = await this.ensureDB();
    await db.delete('shifts', id);
  }

  async getShiftById(id: string): Promise<Shift | undefined> {
    const db = await this.ensureDB();
    return db.get('shifts', id);
  }

  async getShiftsByStatus(status: Shift['status']): Promise<Shift[]> {
    const db = await this.ensureDB();
    const index = db.transaction('shifts').store.index('by-status');
    return index.getAll(status);
  }

  async getShiftsByDateRange(startDate: Date, endDate: Date): Promise<Shift[]> {
    const db = await this.ensureDB();
    const index = db.transaction('shifts').store.index('by-startTime');
    return index.getAll(IDBKeyRange.bound(startDate, endDate));
  }
}

export const dbService = new DatabaseService(); 