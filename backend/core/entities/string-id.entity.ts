import { Expose } from 'class-transformer';
import { PrimaryGeneratedColumn } from 'typeorm';
import { BaseEntity } from './base.entity';

export abstract class StringIdEntity extends BaseEntity {
  @PrimaryGeneratedColumn('uuid', { name: 'id' })
  @Expose()
  id?: string;
}
