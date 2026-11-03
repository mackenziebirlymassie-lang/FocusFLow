import { Task, TimeBlock, DailyNote } from '../types';

const DB_NAME = 'FocusFlowDB';
const DB_VERSION = 1;

export type StoreName = 'tasks' | 'timeBlocks' | 'dailyNotes';

// In-memory fallback if IndexedDB is blocked or unavailable
const memoryStores: {
  tasks: Map<string, Task>;
  timeBlocks: Map<string, TimeBlock>;
  dailyNotes: Map<string, DailyNote>;
} = {
  tasks: new Map(),
  timeBlocks: new Map(),
  dailyNotes: new Map(),
};

let useMemoryFallback = typeof indexedDB === 'undefined';

function openDB(): Promise<IDBDatabase> {
  if (useMemoryFallback) {
    return Promise.reject(new Error('IndexedDB unavailable, using memory fallback'));
  }

  return new Promise((resolve, reject) => {
    try {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains('tasks')) {
          const taskStore = db.createObjectStore('tasks', { keyPath: 'id' });
          taskStore.createIndex('status', 'status', { unique: false });
        }
        if (!db.objectStoreNames.contains('timeBlocks')) {
          const blockStore = db.createObjectStore('timeBlocks', { keyPath: 'id' });
          blockStore.createIndex('date', 'date', { unique: false });
        }
        if (!db.objectStoreNames.contains('dailyNotes')) {
          db.createObjectStore('dailyNotes', { keyPath: 'date' });
        }
      };

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => {
        console.warn('IndexedDB failed to open, falling back to memory store', request.error);
        useMemoryFallback = true;
        reject(request.error);
      };
    } catch (err) {
      console.warn('IndexedDB exception, falling back to memory store', err);
      useMemoryFallback = true;
      reject(err);
    }
  });
}

function withStore<T>(
  storeName: StoreName,
  mode: IDBTransactionMode,
  callback: (store: IDBObjectStore) => IDBRequest<T>
): Promise<T> {
  return openDB()
    .then((db) => {
      return new Promise<T>((resolve, reject) => {
        const tx = db.transaction(storeName, mode);
        const store = tx.objectStore(storeName);
        const request = callback(store);

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
        tx.oncomplete = () => db.close();
        tx.onerror = () => {
          db.close();
          reject(tx.error);
        };
      });
    })
    .catch((err) => {
      // Fallback to in-memory store
      console.warn(`Fallback triggered for store ${storeName}`, err);
      const memMap = memoryStores[storeName] as Map<string, any>;
      if (mode === 'readonly') {
        return Array.from(memMap.values()) as unknown as T;
      }
      return undefined as unknown as T;
    });
}

export const idb = {
  async getAll<T>(storeName: StoreName): Promise<T[]> {
    if (useMemoryFallback) {
      return Array.from((memoryStores[storeName] as Map<string, any>).values()) as T[];
    }
    try {
      const res = await withStore(storeName, 'readonly', (store) => store.getAll() as IDBRequest<T[]>);
      return res || [];
    } catch {
      return Array.from((memoryStores[storeName] as Map<string, any>).values()) as T[];
    }
  },

  async get<T>(storeName: StoreName, key: IDBValidKey): Promise<T | undefined> {
    if (useMemoryFallback) {
      return (memoryStores[storeName] as Map<string, any>).get(String(key)) as T | undefined;
    }
    try {
      return await withStore(storeName, 'readonly', (store) => store.get(key) as IDBRequest<T | undefined>);
    } catch {
      return (memoryStores[storeName] as Map<string, any>).get(String(key)) as T | undefined;
    }
  },

  async put<T extends { id?: string; date?: string }>(storeName: StoreName, value: T): Promise<IDBValidKey> {
    const key = value.id || value.date || String(Date.now());
    (memoryStores[storeName] as Map<string, any>).set(key, value);

    if (useMemoryFallback) {
      return key;
    }

    try {
      return await withStore(storeName, 'readwrite', (store) => store.put(value));
    } catch {
      return key;
    }
  },

  async delete(storeName: StoreName, key: IDBValidKey): Promise<undefined> {
    (memoryStores[storeName] as Map<string, any>).delete(String(key));
    if (useMemoryFallback) return undefined;

    try {
      return await withStore(storeName, 'readwrite', (store) => store.delete(key) as IDBRequest<undefined>);
    } catch {
      return undefined;
    }
  },

  async getBlocksByDate(date: string): Promise<TimeBlock[]> {
    if (useMemoryFallback) {
      return Array.from(memoryStores.timeBlocks.values()).filter((b) => b.date === date);
    }
    try {
      const db = await openDB();
      return await new Promise<TimeBlock[]>((resolve, reject) => {
        const tx = db.transaction('timeBlocks', 'readonly');
        const store = tx.objectStore('timeBlocks');
        const index = store.index('date');
        const request = index.getAll(IDBKeyRange.only(date));

        request.onsuccess = () => {
          db.close();
          resolve(request.result as TimeBlock[]);
        };
        request.onerror = () => {
          db.close();
          reject(request.error);
        };
      });
    } catch {
      return Array.from(memoryStores.timeBlocks.values()).filter((b) => b.date === date);
    }
  },

  async exportAll(): Promise<{ tasks: Task[]; timeBlocks: TimeBlock[]; dailyNotes: DailyNote[] }> {
    const tasks = await this.getAll<Task>('tasks');
    const timeBlocks = await this.getAll<TimeBlock>('timeBlocks');
    const dailyNotes = await this.getAll<DailyNote>('dailyNotes');
    return { tasks, timeBlocks, dailyNotes };
  },

  async importAll(data: { tasks?: Task[]; timeBlocks?: TimeBlock[]; dailyNotes?: DailyNote[] }): Promise<void> {
    if (data.tasks) {
      memoryStores.tasks.clear();
      data.tasks.forEach((item) => memoryStores.tasks.set(item.id, item));
    }
    if (data.timeBlocks) {
      memoryStores.timeBlocks.clear();
      data.timeBlocks.forEach((item) => memoryStores.timeBlocks.set(item.id, item));
    }
    if (data.dailyNotes) {
      memoryStores.dailyNotes.clear();
      data.dailyNotes.forEach((item) => memoryStores.dailyNotes.set(item.date, item));
    }

    if (useMemoryFallback) return;

    try {
      const db = await openDB();
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction(['tasks', 'timeBlocks', 'dailyNotes'], 'readwrite');
        tx.onerror = () => {
          db.close();
          reject(tx.error);
        };
        tx.oncomplete = () => {
          db.close();
          resolve();
        };

        if (data.tasks) {
          const store = tx.objectStore('tasks');
          store.clear();
          data.tasks.forEach((item) => store.put(item));
        }
        if (data.timeBlocks) {
          const store = tx.objectStore('timeBlocks');
          store.clear();
          data.timeBlocks.forEach((item) => store.put(item));
        }
        if (data.dailyNotes) {
          const store = tx.objectStore('dailyNotes');
          store.clear();
          data.dailyNotes.forEach((item) => store.put(item));
        }
      });
    } catch (err) {
      console.warn('Importing directly to memory due to IDB write failure', err);
    }
  },
};
