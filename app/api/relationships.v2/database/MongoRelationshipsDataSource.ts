import { ResultSet } from 'api/common.v2/contracts/ResultSet';
import { MongoDataSource } from 'api/common.v2/database/MongoDataSource';
import { MongoResultSet } from 'api/common.v2/database/MongoResultSet';
import { MongoIdHandler } from 'api/common.v2/database/MongoIdGenerator';
import { Relationship } from '../model/Relationship';
import { TraversalResult, RelationshipMappers } from './RelationshipMappers';
import { RelationshipDBOType } from './schemas/relationshipTypes';
import { RelationshipsDataSource } from '../contracts/RelationshipsDataSource';
import { compileQuery } from './MongoGraphQueryCompiler';
import { MatchQueryNode } from '../model/MatchQueryNode';

const idsToDb = (ids: string[]) => ids.map(id => MongoIdHandler.mapToDb(id));

export class MongoRelationshipsDataSource
  extends MongoDataSource<RelationshipDBOType>
  implements RelationshipsDataSource
{ //eslint-disable-line
  protected collectionName = 'relationships';

  async insert(relationships: Relationship[]): Promise<Relationship[]> {
    const items = relationships.map(RelationshipMappers.toDBO);
    await this.getCollection().insertMany(items, {
      session: this.getSession(),
    });

    return relationships;
  }

  async exists(ids: string[]) {
    const existingCount = await this.getCollection().countDocuments(
      { _id: { $in: idsToDb(ids) } },
      { session: this.getSession() }
    );
    return existingCount === ids.length;
  }

  async countByType(type: string) {
    const total = await this.getCollection().countDocuments(
      { type: MongoIdHandler.mapToDb(type) },
      { session: this.getSession() }
    );
    return total;
  }

  getById(_ids: string[]) {
    const ids = idsToDb(_ids);
    const cursor = this.getCollection().find({ _id: { $in: ids } }, { session: this.getSession() });
    return new MongoResultSet<RelationshipDBOType, Relationship>(
      cursor,
      RelationshipMappers.toModel
    );
  }

  async delete(_ids: string[]) {
    const ids = idsToDb(_ids);
    await this.getCollection().deleteMany({ _id: { $in: ids } }, { session: this.getSession() });
  }

  getByFiles(fileIds: string[]) {
    const files = idsToDb(fileIds);
    const cursor = this.getCollection().find({
      $or: [{ 'from.file': { $in: files } }, { 'to.file': { $in: files } }],
    });
    return new MongoResultSet(cursor, RelationshipMappers.toModel);
  }

  getByEntities(sharedIds: string[]): ResultSet<Relationship> {
    const cursor = this.getCollection().find({
      $or: [{ 'from.entity': { $in: sharedIds } }, { 'to.entity': { $in: sharedIds } }],
    });
    return new MongoResultSet(cursor, RelationshipMappers.toModel);
  }

  getByQuery(query: MatchQueryNode, language: string) {
    const pipeline = compileQuery(query, language);
    const cursor = this.db
      .collection('entities')
      .aggregate<TraversalResult>(pipeline, { session: this.getSession() });
    return new MongoResultSet(cursor, RelationshipMappers.toGraphQueryResult);
  }

  async deleteByEntities(sharedIds: string[]) {
    await this.getCollection().deleteMany(
      { $or: [{ 'from.entity': { $in: sharedIds } }, { 'to.entity': { $in: sharedIds } }] },
      { session: this.getSession() }
    );
  }

  async deleteByReferencedFiles(fileIds: string[]): Promise<void> {
    const files = idsToDb(fileIds);
    await this.getCollection().deleteMany(
      { $or: [{ 'from.file': { $in: files } }, { 'to.file': { $in: files } }] },
      { session: this.getSession() }
    );
  }
}
