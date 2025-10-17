/**
 * Legacy Cache Service (WebSQL)
 * Provides caching functionality using WebSQL database
 */

interface CacheConfig {
    name: string;
    version: string;
    desc: string;
    size: number;
    tables: string[];
}

interface Database {
    version: string;
    changeVersion(
        oldVersion: string,
        newVersion: string,
        callback: (tx: SQLTransaction) => void
    ): void;
    transaction(callback: (tx: SQLTransaction) => void): void;
}

interface SQLTransaction {
    executeSql(
        sql: string,
        args?: any[],
        successCallback?: (tx: SQLTransaction, results: SQLResultSet) => void,
        errorCallback?: (tx: SQLTransaction, error: SQLError) => void
    ): void;
}

interface SQLResultSet {
    rows: {
        length: number;
        item(index: number): any;
    };
}

interface SQLError {
    message: string;
    code: number;
}

interface CachedRow {
    id: string;
    data: string;
    ttl: number;
    date_saved: number;
}

type CachedData = Record<string, any>;

declare const openDatabase: (
    name: string,
    version: string,
    description: string,
    size: number
) => Database;

const cache: CacheConfig = (window as any).App.Config.cache;
const db = openDatabase(cache.name, '', cache.desc, cache.size);

const tableStruct = 'id TEXT, data TEXT, ttl INTEGER, date_saved INTEGER';

// Update db
if (db.version !== cache.version) {
    db.changeVersion(db.version, cache.version, (tx: SQLTransaction) => {
        (window as any).debug('New database version');

        const _: any = (window as any)._;
        _.each(cache.tables, (table: string) => {
            tx.executeSql(
                'DROP TABLE IF EXISTS ' + table,
                [],
                () => {
                    (window as any).debug('Create table ' + table);
                    tx.executeSql('CREATE TABLE ' + table + ' (' + tableStruct + ')');
                },
                (tx: SQLTransaction, err: SQLError) => {
                    (window as any).error('Creating db table', err);
                }
            );
        });
    });
}

/**
 * Build WHERE IN clause for SQL queries
 */
const buildWhereIn = (ids: string[]): string => {
    const _: any = (window as any)._;
    return (
        'id IN (' +
        _.map(ids, () => {
            return '?';
        }).join(',') +
        ')'
    );
};

/**
 * Cache class for table-based caching
 */
class Cache {
    table: string;
    db: Database;

    constructor(table: string) {
        this.table = table;
        this.db = db;
    }

    /**
     * Get items from cache by IDs
     */
    getItems(ids: string | string[]): Promise<CachedData> {
        const self = this;
        const $: any = (window as any).$;
        const Q: any = (window as any).Q;
        const _: any = (window as any)._;

        // getItems can be used with scalar id - normalize to array
        const idsArray: string[] = $.makeArray(ids);

        const deferred = Q.defer();
        db.transaction((tx: SQLTransaction) => {
            // Select item in db
            const query = 'SELECT * FROM ' + self.table + ' WHERE ' + buildWhereIn(idsArray);
            tx.executeSql(
                query,
                idsArray,
                (tx: SQLTransaction, results: SQLResultSet) => {
                    const cachedData: CachedData = {};
                    const expiredData: string[] = [];
                    const now = +new Date();

                    // Filter expired items
                    for (let i = 0; i < results.rows.length; i++) {
                        const row: CachedRow = results.rows.item(i);
                        const data = JSON.parse(row.data);

                        if (row.ttl !== 0 && row.ttl < now - row.date_saved) {
                            expiredData.push(row.id);
                        } else {
                            cachedData[row.id] = data;
                        }
                    }

                    // Delete expired data
                    if (!_.isEmpty(expiredData)) {
                        self.deleteItems(expiredData);
                    }

                    deferred.resolve(cachedData);
                },
                (tx: SQLTransaction, err: SQLError) => {
                    (window as any).error('Expired data cleaning', err);
                    deferred.resolve([]);
                }
            );
        });
        return deferred.promise;
    }

    /**
     * Set a single item in cache
     */
    setItem(id: string, item: any, ttl?: number): void {
        const items: Record<string, any> = {};
        items[id] = item;
        this.setItems(items, ttl);
    }

    /**
     * Set multiple items in cache
     */
    setItems(items: Record<string, any>, ttl?: number): void {
        const self = this;
        const _: any = (window as any)._;
        ttl = +(ttl || 0);
        const now = +new Date();

        self.getItems(_.keys(items)).then((cachedData: CachedData) => {
            (db as any).transaction((tx: SQLTransaction) => {
                _.each(cachedData, (item: any, id: string) => {
                    const data = JSON.stringify(item);
                    tx.executeSql(
                        'UPDATE ' + self.table + ' SET data = ?, ttl = ?, date_saved = ? WHERE id = ?',
                        [data, ttl, now, id]
                    );
                });

                const missedData = _.difference(_.keys(items), _.keys(cachedData));
                _.each(missedData, (id: string) => {
                    const data = JSON.stringify(items[id]);
                    const query = 'INSERT INTO ' + self.table + ' VALUES (?, ?, ?, ?)';
                    tx.executeSql(query, [id, data, ttl, now]);
                });
            }, (err: any) => {
                (window as any).error('db.transaction()', err);
            });
        });
    }

    /**
     * Delete items from cache by IDs
     */
    deleteItems(ids: string[]): void {
        const self = this;
        db.transaction((tx: SQLTransaction) => {
            const query = 'DELETE FROM ' + self.table + ' WHERE ' + buildWhereIn(ids);
            tx.executeSql(query, ids, () => {});
        });
    }

    /**
     * Flush entire table
     */
    flushTable(): Promise<void> {
        const self = this;
        const Q: any = (window as any).Q;

        return Q.Promise((resolve: () => void, reject: (err: any) => void) => {
            db.transaction((tx: SQLTransaction) => {
                const query = 'DELETE FROM ' + self.table;
                tx.executeSql(query, []);
                resolve();
            });
        });
    }
}

// Export for ES modules
export { Cache };
export default Cache;

// Export to window
if (typeof window !== 'undefined') {
    const App = (window as any).App || {};
    App.Cache = Cache;
    (window as any).App = App;
}
