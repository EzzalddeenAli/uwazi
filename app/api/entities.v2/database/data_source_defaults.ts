import { getConnection } from 'api/common.v2/database/getConnectionForCurrentTenant';
import { MongoTransactionManager } from 'api/common.v2/database/MongoTransactionManager';
import { DefaultRelationshipDataSource } from 'api/relationships.v2/database/data_source_defaults';
import { DefaultSettingsDataSource } from 'api/settings.v2/database/data_source_defaults';
import { DefaultTemplatesDataSource } from 'api/templates.v2/database/data_source_defaults';
import { MongoEntitiesDataSource } from './MongoEntitiesDataSource';

const DefaultEntitiesDataSource = (transactionManager: MongoTransactionManager) => {
  const db = getConnection();
  return new MongoEntitiesDataSource(
    db,
    DefaultTemplatesDataSource(transactionManager),
    DefaultRelationshipDataSource(transactionManager),
    DefaultSettingsDataSource(transactionManager),
    transactionManager
  );
};

export { DefaultEntitiesDataSource };
