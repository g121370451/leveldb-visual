import { ipcMain, IpcMainInvokeEvent } from 'electron';
import { LevelDBService } from '../services/app.service'; // 假设 LevelDBService 已定义

export class AppController {
    // 使用 Map 保存多个 LevelDBService 实例
    private dbServices: Map<string, LevelDBService> = new Map();

    constructor() {
        this.initialize();
    }

    private initialize() {
        // 注册 IPC 处理程序
        ipcMain.handle('open-db', this.openDB.bind(this));
        ipcMain.handle('parse-db', this.parseDB.bind(this));
        ipcMain.handle('put-key', this.putKey.bind(this));
        ipcMain.handle('delete-key', this.deleteKey.bind(this));
        ipcMain.handle('delete-sublevel', this.deleteSubLevel.bind(this));
    }

    /**
     * 打开数据库并保存 service
     * @param event IPC 事件
     * @param path 数据库路径
     * @returns 成功返回 true，失败抛出错误
     */
    public async openDB(_event: IpcMainInvokeEvent, path: string): Promise<boolean> {
        try {
            // 如果已经存在对应的 service，直接返回
            if (this.dbServices.has(path)) {
                return true;
            }

            // 创建新的 service 并打开数据库
            const dbService = new LevelDBService();
            await dbService.open(path);

            // 保存到 Map 中
            this.dbServices.set(path, dbService);
            return true;
        } catch (error: any) {
            throw new Error(`Failed to open database at ${path}: ${error.message}`);
        }
    }

    /**
     * 获取对应的 LevelDBService
     * @param path 数据库路径
     * @returns LevelDBService 实例
     * @throws 如果 service 不存在，抛出错误
     */
    private getDBService(path: string): LevelDBService {
        const dbService = this.dbServices.get(path);
        if (!dbService) {
            throw new Error(`Database service for path ${path} not found. Call openDB first.`);
        }
        return dbService;
    }

    /**
     * 解析数据库
     * @param event IPC 事件
     * @param path 数据库路径
     * @returns 解析后的数据（Record<string, any>）
     */
    public async parseDB(_event: IpcMainInvokeEvent, path: string): Promise<Record<string, any>> {
        const dbService = this.getDBService(path);
        try {
            return await dbService.parseDB();
        } catch (error: any) {
            throw new Error(`Failed to parse database: ${error.message}`);
        }
    }

    /**
     * 插入键值对
     * @param event IPC 事件
     * @param path 数据库路径
     * @param key 键
     * @param value 值
     * @returns 成功返回 true，失败抛出错误
     */
    public async putKey(_event: IpcMainInvokeEvent, path: string, key: string, value: any): Promise<boolean> {
        const dbService = this.getDBService(path);
        try {
            await dbService.put(key, value);
            return true;
        } catch (error: any) {
            throw new Error(`Failed to put key ${key}: ${error.message}`);
        }
    }

    /**
     * 删除键值对
     * @param event IPC 事件
     * @param path 数据库路径
     * @param key 键
     * @returns 成功返回 true，失败抛出错误
     */
    public async deleteKey(_event: IpcMainInvokeEvent, path: string, key: string): Promise<boolean> {
        const dbService = this.getDBService(path);
        try {
            await dbService.del(key);
            return true;
        } catch (error: any) {
            throw new Error(`Failed to delete key ${key}: ${error.message}`);
        }
    }

    /**
     * 删除子层级
     * @param event IPC 事件
     * @param path 数据库路径
     * @param prefix 子层级前缀
     * @returns 成功返回 true，失败抛出错误
     */
    public async deleteSubLevel(_event: IpcMainInvokeEvent, path: string, prefix: string): Promise<boolean> {
        const dbService = this.getDBService(path);
        try {
            await dbService.deleteSubLevel(prefix);
            return true;
        } catch (error: any) {
            throw new Error(`Failed to delete sublevel ${prefix}: ${error.message}`);
        }
    }
}