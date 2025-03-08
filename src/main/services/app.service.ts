import { Level, DatabaseOptions } from 'level';

export class LevelDBService {
    private db: Level | null = null;
    private isOpen = false;

    // 检查数据库是否已打开
    private checkConnection() {
        if (!this.isOpen || !this.db) {
            throw new Error('Database is not open. Call open() first.');
        }
    }

    // 打开数据库连接
    async open(path: string, options: DatabaseOptions<any, any> = {}) {
        this.db = new Level(path, {
            valueEncoding: options.valueEncoding || 'utf8',
            ...options
        });

        // 显式打开数据库连接
        await this.db.open();
        this.isOpen = true;
    }

    // 关闭数据库连接
    async close() {
        this.checkConnection();
        await this.db!.close();
        this.isOpen = false;
        this.db = null;
    }

    // 添加键值对
    async put(key: string, value: any) {
        this.checkConnection();
        await this.db!.put(key, value);
    }

    // 删除键
    async del(key: string) {
        this.checkConnection();
        await this.db!.del(key);
    }

    async parseDB(): Promise<Record<string, any>> {
        this.checkConnection();
        const result: Record<string, any> = {};
    
        for await (const [key, value] of this.db!.iterator()) {
            // 使用正则表达式分割多个!号，并保留空字符串以区分层级
            const parts = key.split(/!+/).filter(Boolean);
            let current = result;
    
            for (let i = 0; i < parts.length; i++) {
                const part = parts[i];
    
                if (i<parts.length-1) {
                    const subKey = `!${part}`; // 去掉开头的 !
                    current[subKey] = current[subKey] || {};
                    current = current[subKey];
                }
                // 否则，它是一个普通键
                else {
                    current[part] = value;
                }
            }
        }
    
        return result;
    }

    // 删除子层级
    async deleteSubLevel(prefix: string) {
        this.checkConnection();
        try {
            const subPrefix = `^${prefix}`; // 添加分隔符确保精确匹配
            const delKey:string[] =[];
            const reg = new RegExp(subPrefix);
            for await (const [key] of this.db!.iterator()) {
                if (key.match(reg)) {
                    delKey.push(key)
                }
            }
            for await (const del_key of delKey) {
                await this.del(del_key);
            }
            return true;
        } catch (e: any) {
            throw new Error(`delete any sublevel error cause ${e}`);
        }
    }
}