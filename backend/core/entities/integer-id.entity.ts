import { Expose } from 'class-transformer';
import { PrimaryGeneratedColumn } from 'typeorm';
import { BaseEntity } from './base.entity';

export abstract class IntegerIdEntity extends BaseEntity {
  @PrimaryGeneratedColumn({
    name: 'id',
  })
  @Expose()
  id?: number;
}
