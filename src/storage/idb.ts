import { Task, TimeBlock, DailyNote } from '../types';

const DB_NAME = 'FocusFlowDB';
const DB_VERSION = 1;

export type StoreName = 'tasks' | 'timeBlocks' | 'dailyNotes';

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
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
    request.onerror = () => reject(request.error);
  });
}

function withStore<T>(
  storeName: StoreName,
  mode: IDBTransactionMode,
  callback: (store: IDBObjectStore) => IDBRequest<T>
): Promise<T> {
  return openDB().then((db) => {
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
  });
}

export const idb = {
  getAll<T>(storeName: StoreName): Promise<T[]> {
    return withStore(storeName, 'readonly', (store) => store.getAll() as IDBRequest<T[]>);
  },

  get<T>(storeName: StoreName, key: IDBValidKey): Promise<T | undefined> {
    return withStore(storeName, 'readonly', (store) => store.get(key) as IDBRequest<T | undefined>);
  },

  put<T>(storeName: StoreName, value: T): Promise<IDBValidKey> {
    return withStore(storeName, 'readwrite', (store) => store.put(value));
  },

  delete(storeName: StoreName, key: IDBValidKey): Promise<undefined> {
    return withStore(storeName, 'readwrite', (store) => store.delete(key) as IDBRequest<undefined>);
  },

  async getBlocksByDate(date: string): Promise<TimeBlock[]> {
    const db = await openDB();
    return new Promise<TimeBlock[]>((resolve, reject) => {
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
  },

  async exportAll(): Promise<{ tasks: Task[]; timeBlocks: TimeBlock[]; dailyNotes: DailyNote[] }> {
    const tasks = await this.getAll<Task>('tasks');
    const timeBlocks = await this.getAll<TimeBlock>('timeBlocks');
    const dailyNotes = await this.getAll<DailyNote>('dailyNotes');
    return { tasks, timeBlocks, dailyNotes };
  },

  async importAll(data: { tasks?: Task[]; timeBlocks?: TimeBlock[]; dailyNotes?: DailyNote[] }): Promise<void> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
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
  },
};
