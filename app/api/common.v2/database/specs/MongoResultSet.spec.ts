import { ObjectId } from 'mongodb';

import { testingEnvironment } from 'api/utils/testingEnvironment';
import testingDB from 'api/utils/testing_db';

import { MongoResultSet } from '../MongoResultSet';

const testDocuments = [
  { _id: new ObjectId(), name: 'doc1' },
  { _id: new ObjectId(), name: 'doc2' },
  { _id: new ObjectId(), name: 'doc3' },
  { _id: new ObjectId(), name: 'doc4' },
  { _id: new ObjectId(), name: 'doc5' },
  { _id: new ObjectId(), name: 'doc6' },
];

const buildCursor = (query?: any) =>
  testingDB.mongodb?.collection<typeof testDocuments[number]>('testDocuments').find(query || {});

const buildAggregationCursor = () =>
  testingDB.mongodb
    ?.collection<typeof testDocuments[number]>('testDocuments')
    .aggregate([{ $match: {} }]);

beforeEach(async () => {
  await testingEnvironment.setUp({ testDocuments });
});

afterAll(async () => {
  await testingEnvironment.tearDown();
});

describe('when built from a $type cursor', () => {
  describe('next()', () => {
    it('should provide the next item as a normal mongo cursor', async () => {
      const cursor = buildCursor();
      const resultSet = new MongoResultSet(cursor!, MongoResultSet.NoOpMapper);
      let index = 0;
      // eslint-disable-next-line no-await-in-loop
      while (await resultSet.hasNext()) {
        // eslint-disable-next-line no-await-in-loop
        const item = await resultSet.next();
        expect(item).toEqual(testDocuments[index]);
        index += 1;
      }
    });
  });

  describe('all()', () => {
    it('should return all the results and close the cursor', async () => {
      const cursor = buildCursor();
      const resultSet = new MongoResultSet(cursor!, MongoResultSet.NoOpMapper);
      expect(await resultSet.all()).toEqual(testDocuments);
      expect(cursor?.closed).toBe(true);
    });
  });

  it('should use the mapper function', async () => {
    const cursor = buildCursor();
    const resultSet = new MongoResultSet(cursor!, elem => elem.name);
    expect(await resultSet.all()).toEqual(testDocuments.map(elem => elem.name));
  });

  it.each([
    { page: 1, start: 0, end: 4 },
    { page: 2, start: 4, end: 6 },
  ])('should return results page $page and close the cursor', async ({ page, start, end }) => {
    const cursor = buildCursor();
    const resultSet = new MongoResultSet(cursor!, elem => elem.name);
    const result = await resultSet.page(page, 4);
    expect(result).toEqual(testDocuments.slice(start, end).map(elem => elem.name));
    expect(cursor?.closed).toBe(true);
  });

  describe('using every(...) to check a predicate against every item', () => {
    it('should return true if it is true for every item', async () => {
      const cursor = buildCursor();
      const resultSet = new MongoResultSet(cursor!, elem => elem.name);
      expect(await resultSet.every(item => item.startsWith('doc'))).toBe(true);
      expect(cursor?.closed).toBe(true);
    });

    it('should return true if it is true for every item', async () => {
      const cursor = buildCursor();
      const resultSet = new MongoResultSet(cursor!, elem => elem.name);
      expect(await resultSet.every(item => item.startsWith('doc1'))).toBe(false);
      expect(cursor?.closed).toBe(true);
    });

    it('should return false if there are no items', async () => {
      const cursor = buildCursor({ name: 'non-existing' });
      const resultSet = new MongoResultSet(cursor!, elem => elem.name);
      expect(await resultSet.every(item => item.startsWith('doc'))).toBe(false);
      expect(cursor?.closed).toBe(true);
    });
  });

  describe('using some(...) to check a predicate against every item', () => {
    it('should return true if it is true for at least one item', async () => {
      const cursor = buildCursor();
      const resultSet = new MongoResultSet(cursor!, elem => elem.name);
      expect(await resultSet.some(item => item === 'doc3')).toBe(true);
      expect(cursor?.closed).toBe(true);
    });

    it('should return false if it is false for every item', async () => {
      const cursor = buildCursor();
      const resultSet = new MongoResultSet(cursor!, elem => elem.name);
      expect(await resultSet.some(item => item.startsWith('notDoc'))).toBe(false);
      expect(cursor?.closed).toBe(true);
    });

    it('should return false if there are no items', async () => {
      const cursor = buildCursor({ name: 'non-existing' });
      const resultSet = new MongoResultSet(cursor!, elem => elem.name);
      expect(await resultSet.some(item => item.startsWith('doc'))).toBe(false);
      expect(cursor?.closed).toBe(true);
    });
  });

  describe('using forEach(...)', () => {
    it('should execute the sync callback for every item', async () => {
      const cursor = buildCursor();
      const resultSet = new MongoResultSet(cursor!, elem => elem.name);
      const visited: string[] = [];
      await resultSet.forEach(item => {
        visited.push(item);
      });
      expect(visited).toEqual(['doc1', 'doc2', 'doc3', 'doc4', 'doc5', 'doc6']);
      expect(cursor?.closed).toBe(true);
    });

    it('should execute the async callback for every item', async () => {
      const cursor = buildCursor();
      const resultSet = new MongoResultSet(cursor!, elem => elem.name);
      const visited: string[] = [];
      await resultSet.forEach(async item => {
        visited.push(item);
        await new Promise(resolve => {
          setTimeout(resolve, 2);
        });
        visited.push(item);
      });
      expect(visited).toEqual([
        'doc1',
        'doc1',
        'doc2',
        'doc2',
        'doc3',
        'doc3',
        'doc4',
        'doc4',
        'doc5',
        'doc5',
        'doc6',
        'doc6',
      ]);
      expect(cursor?.closed).toBe(true);
    });
  });

  describe('when calling first()', () => {
    it('should return the first result and close the cursors', async () => {
      const cursor = buildCursor();
      const result = new MongoResultSet(cursor!, elem => elem.name);
      expect(await result.first()).toEqual('doc1');
      expect(cursor?.closed).toBe(true);
    });
  });
});

describe('when built from an aggregation cursor', () => {
  it('should correctly count the result and use the mapper', async () => {
    const cursor = buildAggregationCursor();
    const resultSet = new MongoResultSet(cursor!, elem => elem.name);
    const result = await resultSet.page(1, 4);
    expect(result).toEqual(testDocuments.slice(0, 4).map(elem => elem.name));
    expect(cursor?.closed).toBe(true);
  });
});
