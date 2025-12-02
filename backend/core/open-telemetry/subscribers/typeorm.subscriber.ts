import { Injectable } from '@nestjs/common';
import { Span, trace } from '@opentelemetry/api';
import {
  EntitySubscriberInterface,
  EventSubscriber,
  InsertEvent,
  RemoveEvent,
  UpdateEvent,
} from 'typeorm';
import { AfterQueryEvent } from 'typeorm/subscriber/event/QueryEvent';

@Injectable()
@EventSubscriber()
export class TypeOrmSubscriber implements EntitySubscriberInterface {
  private tracer = trace.getTracer('typeorm');
  private querySpan: Span;
  private insertSpan: Span;
  private updateSpan: Span;
  private deleteSpan: Span;

  beforeQuery(event: AfterQueryEvent<any>) {
    this.querySpan = this.tracer.startSpan('TypeORM Query');
  }

  afterQuery(event: AfterQueryEvent<any>) {
    try {
      this.querySpan.setAttribute('db.system', 'postgresql');
      this.querySpan.setAttribute('db.statement', event.query);
      if (event.parameters?.length) {
        this.querySpan.setAttribute(
          'db.parameters',
          JSON.stringify(event.parameters),
        );
      }
    } finally {
      this.querySpan.end();
    }
  }

  beforeInsert(event: InsertEvent<any>) {
    this.insertSpan = this.tracer.startSpan('TypeORM Insert');
  }

  afterInsert(event: InsertEvent<any>) {
    try {
      this.insertSpan.setAttribute('db.system', 'postgresql');
      this.insertSpan.setAttribute('db.operation', 'INSERT');
      this.insertSpan.setAttribute('db.table', event.metadata.tableName);
      this.insertSpan.setAttribute('db.entity', event.metadata.targetName);
      this.insertSpan.setAttribute('db.data', JSON.stringify(event.entity));
    } finally {
      this.insertSpan.end();
    }
  }

  beforeUpdate(event: UpdateEvent<any>) {
    this.updateSpan = this.tracer.startSpan('TypeORM Update');
  }

  afterUpdate(event: UpdateEvent<any>) {
    try {
      this.updateSpan.setAttribute('db.system', 'postgresql');
      this.updateSpan.setAttribute('db.operation', 'UPDATE');
      this.updateSpan.setAttribute('db.table', event.metadata.tableName);
      this.updateSpan.setAttribute('db.entity', event.metadata.targetName);
      this.updateSpan.setAttribute(
        'db.databaseEntity',
        JSON.stringify(event.databaseEntity),
      );
      this.updateSpan.setAttribute(
        'db.updatedColumns',
        JSON.stringify(event.updatedColumns.map((col) => col.propertyName)),
      );
    } finally {
      this.updateSpan.end();
    }
  }

  beforeRemove(event: RemoveEvent<any>) {
    this.deleteSpan = this.tracer.startSpan('TypeORM Delete');
  }

  afterRemove(event: RemoveEvent<any>) {
    try {
      this.deleteSpan.setAttribute('db.system', 'postgresql');
      this.deleteSpan.setAttribute('db.operation', 'DELETE');
      this.deleteSpan.setAttribute('db.table', event.metadata.tableName);
      this.deleteSpan.setAttribute('db.entity', event.metadata.targetName);
      this.deleteSpan.setAttribute(
        'db.databaseEntity',
        JSON.stringify(event.databaseEntity),
      );
    } finally {
      this.deleteSpan.end();
    }
  }
}
