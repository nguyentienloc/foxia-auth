import { BadRequestException } from '@nestjs/common';
import { DataSource, QueryRunner } from 'typeorm';

export async function withTransaction<T>(
  dataSource: DataSource,
  callback: (queryRunner: QueryRunner) => Promise<T>,
): Promise<T> {
  const queryRunner = dataSource.createQueryRunner();
  await queryRunner.connect();
  await queryRunner.startTransaction();

  try {
    const result = await callback(queryRunner);
    await queryRunner.commitTransaction();
    return result;
  } catch (error) {
    await queryRunner.rollbackTransaction();
    if (error?.driverError) {
      throw new BadRequestException(error?.driverError?.detail);
    }
    throw error;
  } finally {
    await queryRunner.release();
  }
}
