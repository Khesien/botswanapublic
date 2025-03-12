import { openDB, IDBPDatabase } from 'idb';
import type { Trip, Booking, User } from '../types';

interface OfflineDB {
  trips: Trip[];
  bookings: Booking[];
  userData: User;
}

class OfflineStorage {
  private db: IDBPDatabase | null = null;
  private static instance: OfflineStorage;

  private constructor() {}

  static getInstance(): OfflineStorage {
    if (!OfflineStorage.instance) {
      OfflineStorage.instance = new OfflineStorage();
    }
    return OfflineStorage.instance;
  }

  async initialize() {
    this.db = await openDB<OfflineDB>('smart-transport', 1, {
      upgrade(db) {
        // Create object stores
        db.createObjectStore('trips', { keyPath: 'id' });
        db.createObjectStore('bookings', { keyPath: 'id' });
        db.createObjectStore('userData', { keyPath: 'id' });
        
        // Create indexes
        const tripsStore = db.createObjectStore('trips', { keyPath: 'id' });
        tripsStore.createIndex('route', 'route_id');
        tripsStore.createIndex('date', 'departure_time');
        
        const bookingsStore = db.createObjectStore('bookings', { keyPath: 'id' });
        bookingsStore.createIndex('user', 'user_id');
        bookingsStore.createIndex('trip', 'trip_id');
      }
    });
  }

  async saveTrips(trips: Trip[]) {
    if (!this.db) await this.initialize();
    const tx = this.db!.transaction('trips', 'readwrite');
    await Promise.all(trips.map(trip => tx.store.put(trip)));
    await tx.done;
  }

  async getTrips(): Promise<Trip[]> {
    if (!this.db) await this.initialize();
    return this.db!.getAll('trips');
  }

  async saveBookings(bookings: Booking[]) {
    if (!this.db) await this.initialize();
    const tx = this.db!.transaction('bookings', 'readwrite');
    await Promise.all(bookings.map(booking => tx.store.put(booking)));
    await tx.done;
  }

  async getBookings(): Promise<Booking[]> {
    if (!this.db) await this.initialize();
    return this.db!.getAll('bookings');
  }

  async saveUserData(userData: User) {
    if (!this.db) await this.initialize();
    await this.db!.put('userData', userData);
  }

  async getUserData(): Promise<User | undefined> {
    if (!this.db) await this.initialize();
    return this.db!.get('userData', 'current');
  }

  async syncWithServer() {
    try {
      const offlineBookings = await this.getBookings();
      // Implement sync logic with server
      // Send offline bookings to server when online
      
      const offlineTrips = await this.getTrips();
      // Sync trips with server
      
      // Clear offline data after successful sync
      await this.clearOfflineData();
    } catch (error) {
      console.error('Error syncing with server:', error);
    }
  }

  async clearOfflineData() {
    if (!this.db) await this.initialize();
    const tx = this.db!.transaction(['trips', 'bookings'], 'readwrite');
    await tx.objectStore('trips').clear();
    await tx.objectStore('bookings').clear();
    await tx.done;
  }
}

export const offlineStorage = OfflineStorage.getInstance();