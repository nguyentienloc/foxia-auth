import { Expose } from 'class-transformer';
import { DateTransform } from 'core/decorators/date-transform/date-transform.decorator';
import { Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export abstract class BaseEntity {
  @CreateDateColumn({
    name: 'created_time',
    type: 'timestamp with time zone',
  })
  @Expose()
  @DateTransform()
  created_time?: Date;

  @UpdateDateColumn({
    name: 'updated_time',
    type: 'timestamp with time zone',
  })
  @Expose()
  @DateTransform()
  updated_time?: Date;

  @Column({
    name: 'created_by',
    type: 'int',
    nullable: true,
  })
  @Expose()
  created_by?: number;

  @Column({
    name: 'updated_by',
    type: 'int',
    nullable: true,
  })
  @Expose()
  updated_by?: number;
}
