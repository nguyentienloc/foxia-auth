import { identityConnection } from 'core/constants/database-connection.constant';
import * as dotenv from 'dotenv';
import { DataSource, DataSourceOptions } from 'typeorm';

dotenv.config({
  path: 'apps/identity-service/.env',
});

export const dataSourceOptions: DataSourceOptions = {
  name: identityConnection,
  type: 'postgres',
  host: process.env.DATABASE_HOST,
  port: +process.env.DATABASE_PORT,
  extra:
    process.env.DATABASE_SSL === 'prefer'
      ? {
          max: 100,
          ssl: {
            rejectUnauthorized: false,
          },
        }
      : { max: 100 },
  username: process.env.DATABASE_USERNAME,
  password: process.env.DATABASE_PASSWORD,
  database: process.env.DATABASE_NAME,
  entities: [__dirname + '/entities/*.entity{.ts,.js}'],
  migrations: [__dirname + '/migrations/*{.js,.ts}'],
  logging: true,
  synchronize: false,
  useUTC: true,
};

const dataSource = new DataSource(dataSourceOptions);

export default dataSource;
