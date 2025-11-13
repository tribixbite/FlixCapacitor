/**
 * Cache V2 Service (IndexedDB)
 * Modern caching using IndexedDB for better performance and storage
 */

interface CacheV2Config {
    name: string;
    version: number;
    tables: string[];
}

interface CacheOptions {
    ttl?: number;
}

interface CacheData {
    _id?: string;
    _ttl?: number;
    _lastModified?: number;
    [key: string]: any;
}

interface IDBRequestWithResult<T = any> extends IDBRequest<T> {
    result: T;
    error: DOMException | null;
}

/**
 * Wrap IndexedDB Request in a promise
 */
function WrapRequest(
    deferredOrRequest: any,
    request?: IDBRequest
): { promise: Promise<any>; resolve: (value: any) => void; reject: (error: any) => void } {
    const Q: any = (window as any).Q;
    let deferred: any;
    let req: IDBRequest;

    if (request === undefined) {
        req = deferredOrRequest;
        deferred = Q.defer();
    } else {
        req = request;
        deferred = deferredOrRequest;
    }

    const existingSuccess = req.onsuccess;
    req.onsuccess = function (this: IDBRequestWithResult, ev: Event) {
        deferred.resolve(this.result);
        if (existingSuccess !== null) {
            existingSuccess.call(req, ev);
        }
    };

    const existingError = req.onerror;
    req.onerror = function (this: IDBRequestWithResult, ev: Event) {
        deferred.reject(this.error);
        if (existingError !== null) {
            existingError.call(req, ev);
        }
    };

    return deferred;
}

/**
 * Cache V2 class using IndexedDB
 */
class CacheV2 {
    table: string;
    db!: IDBDatabase;
    _openPromise: Promise<IDBDatabase>;

    constructor(table: string) {
        const self = this;
        const App = (window as any).App;

        this.table = table;

        const db = indexedDB.open(App.Config.cachev2.name, App.Config.cachev2.version);
        db.onsuccess = function (this: IDBRequestWithResult<IDBDatabase>) {
            self.db = this.result;
        };
        db.onupgradeneeded = function (this: IDBOpenDBRequest) {
            const _: any = (window as any)._;
            const config: CacheV2Config = App.Config.cachev2;

            config.tables.forEach((tableName: string) => {
                if (_.contains(this.result.objectStoreNames, tableName)) {
                    return;
                }
                this.result.createObjectStore(tableName, {
                    keyPath: '_id'
                });
            });
        };
        this._openPromise = WrapRequest(db).promise;
    }

    /**
     * Set item in cache
     */
    set(key: string, value: any, options?: CacheOptions): Promise<IDBValidKey> {
        const _: any = (window as any)._;
        options = options || {};
        const data: CacheData = _.extend(value, {
            _id: key,
            _ttl: options.ttl || 14400000,
            _lastModified: +new Date()
        });
        return WrapRequest(
            this.db.transaction(this.table, 'readwrite').objectStore(this.table).put(data)
        ).promise;
    }

    /**
     * Get item from cache
     */
    get(key: string): Promise<any> {
        const Q: any = (window as any).Q;
        const deferred = Q.defer();
        const request = this.db.transaction(this.table, 'readonly').objectStore(this.table).get(key);

        request.onsuccess = function (this: IDBRequestWithResult<CacheData>) {
            if (this.result) {
                delete this.result._id;
                delete this.result._ttl;
                delete this.result._lastModified;
            }
            deferred.resolve(this.result);
        };
        request.onerror = function (this: IDBRequestWithResult) {
            deferred.reject(this.error);
        };
        return deferred.promise;
    }

    /**
     * Get multiple items from cache
     */
    getMultiple(keys: string[]): Promise<any[]> {
        const Q: any = (window as any).Q;
        const _: any = (window as any)._;
        const deferred = Q.defer();
        const request = this.db.transaction(this.table, 'readonly').objectStore(this.table).openCursor();
        const results: any[] = [];

        request.onsuccess = function (this: IDBRequestWithResult<IDBCursorWithValue | null>) {
            const cursor = this.result;
            if (cursor) {
                if (_.contains(keys, cursor.key)) {
                    results.push(cursor.value);
                }
                cursor.continue();
            } else {
                deferred.resolve(results);
            }
        };
        request.onerror = function (this: IDBRequestWithResult) {
            deferred.reject(this.error);
        };
        return deferred.promise;
    }

    /**
     * Update item in cache
     */
    update(key: string, value: any, options?: CacheOptions): Promise<IDBValidKey> {
        const self = this;
        const Q: any = (window as any).Q;
        const _: any = (window as any)._;
        options = options || {};
        const deferred = Q.defer();
        const request = this.db.transaction(this.table, 'readonly').objectStore(this.table).get(key);

        request.onsuccess = function (this: IDBRequestWithResult<CacheData>) {
            const data: CacheData = _.extend(this.result, value);
            data._id = key;
            data._ttl = options!.ttl || 14400000;
            data._lastModified = +new Date();
            WrapRequest(
                deferred,
                self.db.transaction(self.table, 'readwrite').objectStore(self.table).put(data)
            );
        };
        request.onerror = function (this: IDBRequestWithResult) {
            deferred.reject(this.error);
        };
        return deferred.promise;
    }

    /**
     * Garbage collection - remove expired items
     */
    gc(): void {
        const request = this.db.transaction(this.table, 'readwrite').objectStore(this.table).openCursor();

        request.onsuccess = function (this: IDBRequestWithResult<IDBCursorWithValue | null>) {
            const cursor = this.result;
            if (cursor) {
                const ttl = cursor.value._ttl;
                const lastModified = cursor.value._lastModified;
                if (new Date().getTime() - lastModified > ttl) {
                    cursor.delete();
                }
                cursor.continue();
            }
        };
    }
}

// Export for ES modules
export { CacheV2 };
export default CacheV2;

// Export to window
if (typeof window !== 'undefined') {
    const App = (window as any).App || {};
    App.CacheV2 = CacheV2;
    (window as any).App = App;
}
