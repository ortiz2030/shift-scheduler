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

// Fallback storage using localStorage
class LocalStorageFallback {
  private storageKey = 'shift-scheduler-data';

  async getAllShifts(): Promise<Shift[]> {
    try {
      const data = localStorage.getItem(this.storageKey);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error reading from localStorage:', error);
      return [];
    }
  }

  async createShift(shift: Shift): Promise<void> {
    try {
      const shifts = await this.getAllShifts();
      shifts.push(shift);
      localStorage.setItem(this.storageKey, JSON.stringify(shifts));
    } catch (error) {
      console.error('Error saving to localStorage:', error);
      throw error;
    }
  }

  async updateShift(shift: Shift): Promise<void> {
    try {
      const shifts = await this.getAllShifts();
      const index = shifts.findIndex(s => s.id === shift.id);
      if (index !== -1) {
        shifts[index] = shift;
        localStorage.setItem(this.storageKey, JSON.stringify(shifts));
      }
    } catch (error) {
      console.error('Error updating localStorage:', error);
      throw error;
    }
  }

  async deleteShift(id: string): Promise<void> {
    try {
      const shifts = await this.getAllShifts();
      const filteredShifts = shifts.filter(s => s.id !== id);
      localStorage.setItem(this.storageKey, JSON.stringify(filteredShifts));
    } catch (error) {
      console.error('Error deleting from localStorage:', error);
      throw error;
    }
  }

  async getShiftById(id: string): Promise<Shift | undefined> {
    try {
      const shifts = await this.getAllShifts();
      return shifts.find(s => s.id === id);
    } catch (error) {
      console.error('Error reading from localStorage:', error);
      return undefined;
    }
  }

  async getShiftsByStatus(status: Shift['status']): Promise<Shift[]> {
    try {
      const shifts = await this.getAllShifts();
      return shifts.filter(s => s.status === status);
    } catch (error) {
      console.error('Error reading from localStorage:', error);
      return [];
    }
  }

  async getShiftsByDateRange(startDate: Date, endDate: Date): Promise<Shift[]> {
    try {
      const shifts = await this.getAllShifts();
      return shifts.filter(s => {
        const startTime = new Date(s.startTime);
        return startTime >= startDate && startTime <= endDate;
      });
    } catch (error) {
      console.error('Error reading from localStorage:', error);
      return [];
    }
  }
}

class DatabaseService {
  private db: IDBPDatabase<ShiftDB> | null = null;
  private initPromise: Promise<void> | null = null;
  private fallback: LocalStorageFallback;
  private useFallback = false;

  constructor() {
    this.fallback = new LocalStorageFallback();
    this.initPromise = this.initializeDB();
  }

  private async initializeDB(): Promise<void> {
    try {
      // Check if IndexedDB is available
      if (!window.indexedDB) {
        console.warn('IndexedDB not available, using localStorage fallback');
        this.useFallback = true;
        return;
      }

      this.db = await openDB<ShiftDB>('shift-scheduler', 1, {
        upgrade(db) {
          const store = db.createObjectStore('shifts', { keyPath: 'id' });
          store.createIndex('by-status', 'status');
          store.createIndex('by-startTime', 'startTime');
        },
      });
    } catch (error) {
      console.error('Error initializing IndexedDB, falling back to localStorage:', error);
      this.useFallback = true;
    }
  }

  private async ensureDB(): Promise<IDBPDatabase<ShiftDB>> {
    if (this.useFallback) {
      throw new Error('Using fallback storage');
    }
    
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
    if (this.useFallback) {
      return this.fallback.getAllShifts();
    }
    
    try {
      const db = await this.ensureDB();
      return db.getAll('shifts');
    } catch (error) {
      console.error('IndexedDB failed, using fallback:', error);
      this.useFallback = true;
      return this.fallback.getAllShifts();
    }
  }

  async createShift(shift: Shift): Promise<void> {
    if (this.useFallback) {
      return this.fallback.createShift(shift);
    }
    
    try {
      const db = await this.ensureDB();
      await db.add('shifts', shift);
    } catch (error) {
      console.error('IndexedDB failed, using fallback:', error);
      this.useFallback = true;
      return this.fallback.createShift(shift);
    }
  }

  async updateShift(shift: Shift): Promise<void> {
    if (this.useFallback) {
      return this.fallback.updateShift(shift);
    }
    
    try {
      const db = await this.ensureDB();
      await db.put('shifts', shift);
    } catch (error) {
      console.error('IndexedDB failed, using fallback:', error);
      this.useFallback = true;
      return this.fallback.updateShift(shift);
    }
  }

  async deleteShift(id: string): Promise<void> {
    if (this.useFallback) {
      return this.fallback.deleteShift(id);
    }
    
    try {
      const db = await this.ensureDB();
      await db.delete('shifts', id);
    } catch (error) {
      console.error('IndexedDB failed, using fallback:', error);
      this.useFallback = true;
      return this.fallback.deleteShift(id);
    }
  }

  async getShiftById(id: string): Promise<Shift | undefined> {
    if (this.useFallback) {
      return this.fallback.getShiftById(id);
    }
    
    try {
      const db = await this.ensureDB();
      return db.get('shifts', id);
    } catch (error) {
      console.error('IndexedDB failed, using fallback:', error);
      this.useFallback = true;
      return this.fallback.getShiftById(id);
    }
  }

  async getShiftsByStatus(status: Shift['status']): Promise<Shift[]> {
    if (this.useFallback) {
      return this.fallback.getShiftsByStatus(status);
    }
    
    try {
      const db = await this.ensureDB();
      const index = db.transaction('shifts').store.index('by-status');
      return index.getAll(status);
    } catch (error) {
      console.error('IndexedDB failed, using fallback:', error);
      this.useFallback = true;
      return this.fallback.getShiftsByStatus(status);
    }
  }

  async getShiftsByDateRange(startDate: Date, endDate: Date): Promise<Shift[]> {
    if (this.useFallback) {
      return this.fallback.getShiftsByDateRange(startDate, endDate);
    }
    
    try {
      const db = await this.ensureDB();
      const index = db.transaction('shifts').store.index('by-startTime');
      return index.getAll(IDBKeyRange.bound(startDate, endDate));
    } catch (error) {
      console.error('IndexedDB failed, using fallback:', error);
      this.useFallback = true;
      return this.fallback.getShiftsByDateRange(startDate, endDate);
    }
  }
}

export const dbService = new DatabaseService(); 