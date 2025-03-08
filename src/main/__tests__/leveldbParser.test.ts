// // __tests__/leveldbClear.test.ts
// import { Level } from 'level';
// import {LevelDBService} from '../services/app.service'
// import {AppController} from '../controller/AppController'

// describe('LevelDB Clear Functionality', () => {
//     const testDBPath = './testdb-clear';
//     let db: Level<string, string>;
//     let subDb: any;
//     let subAndSub: any;
//     beforeAll(async () => {
//         db = new Level<string, string>(testDBPath, { valueEncoding: 'utf8' });
//         subDb = db.sublevel('sub', { valueEncoding: 'utf8' })
//         subAndSub = subDb.sublevel('sub3',{valueEncoding: 'utf8'})
//         await subDb.put('key1', 'value1');
//         await subDb.put('key2', 'value2');
//         await subAndSub.put('key2', 'value2');
//     });

//     afterAll(async () => {
//         await db.clear();
//         await db.close();
//     });

//     test('should clear the database', async () => {
//         // Clear the database
//         // Verify the database is empty
//         const keys: string[] = [];
//         for await (const [key, value] of db.iterator()) {
//             keys.push(key);
//             log.debug(`${key} : ${value}`)
//         }
//         expect(keys).toHaveLength(3);
//     });
// });

// describe('analyse l111 db', () => {
//     const testDBPath = 'D:/project/nodejs/leveldb-reader/testdb-l112';
//     const service:LevelDBService = new LevelDBService();
//     beforeAll(async () => {
//         await service.open(testDBPath)
//     });

//     afterAll(async () => {
//         await service.close();
//     });

//     test('should clear the database', async () => {
//         // Clear the database
//         // Verify the database is empty
//         const keys: string[] = [];

//         const res = await service.parseDB()        
//         log.debug(res)
//         expect(res);
//     });
// });