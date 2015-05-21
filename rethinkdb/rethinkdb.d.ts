// Type definitions for Rethinkdb 2.0.0
// Project: http://rethinkdb.com/
// Definitions by: Sean Hess <https://seanhess.github.io/> and Benjamin Pannell <https://github.com/spartan563>
// Definitions: https://github.com/borisyankov/DefinitelyTyped
// Reference: http://www.rethinkdb.com/api/#js
// TODO: Document manipulation and below

/// <reference path="../es6-promise/es6-promise.d.ts" />
/// <reference path="../node/node.d.ts" />

declare module "rethinkdb" {
  import events = require('events');

  export function connect(host:string, cb:(err:Error, conn:Connection)=>void);
  export function connect(host:string): Promise<Connection>;
  export function connect(options:ConnectionOptions, cb:(err:Error, conn:Connection)=>void);
  export function connect(options:ConnectionOptions): Promise<Connection>;

  export function dbCreate(name:string):Operation<CreateResult>;
  export function dbDrop(name:string):Operation<DropResult>;
  export function dbList():Operation<string[]>;

  export function changes(options: { squash?: boolean, includeStates?: boolean }): Operation<any>;
  export function changes<T>(options: { squash?: boolean, includeStates?: boolean }): Operation<T>;

  export function db(name:string):Db;
  export function table(name:string, options?:{useOutdated:boolean}):Table<any>;
  export function table<T>(name:string, options?:{useOutdated:boolean}):Table<T>;

  export function asc(property:string):Sort;
  export function desc(property:string):Sort;

  export var count:Aggregator;
  export function sum(prop:string):Aggregator;
  export function avg(prop:string):Aggregator;

  export function row(name:string):Expression<any>;
  export function expr(stuff:any):Expression<any>;

  export function now():Time;

  // Control Structures
  export function branch(test:Expression<boolean>, trueBranch:Expression<any>, falseBranch:Expression<any>):Expression<any>;


  export class Cursor<T> extends events.EventEmitter {
    each(cb:(err:Error, row:T)=>void, done?:()=>void);
    each(cb:(err:Error, row:T)=>boolean, done?:()=>void); // returning false stops iteration

    next(callback: (err:Error, row:T) => void);
    next(): Promise<T>;

    toArray(callback: (err:Error, rows:T[]) => void);
    toArray(): Promise<T[]>;

    close();
  }

  interface ConnectionOptions {
    host:string;
    port:number;
    db?:string;
    authKey?:string;
  }

  interface Connection extends events.EventEmitter {
    close(options?: { noreplyWait: boolean }): Promise<any>;
    close(callback: (err: Error) => void);
    close(options: { noreplyWait: boolean }, callback: (err: Error) => void);
    reconnect(options?: { noreplyWait: boolean }): Promise<Connection>;
    reconnect(callback: (err: Error, conn: Connection) => void);
    reconnect(options: { noreplyWait: boolean }, callback: (err: Error, conn: Connection) => void);
    use(dbName:string);
    noreplyWait(callback: (err: Error) => void);
    noreplyWait(): Promise<any>;
  }

  interface Db {
    tableCreate(name:string, options?:TableOptions):Operation<CreateResult>;
    tableDrop(name:string):Operation<DropResult>;
    tableList():Operation<string[]>;
    table(name:string, options?:GetTableOptions):Table<any>;
    table<T>(name:string, options?:GetTableOptions):Table<T>;
  }

  interface TableOptions {
    primary_key?:string; // 'id'
    durability?:string; // 'soft'
    cache_size?:number;
    datacenter?:string;
  }

  interface GetTableOptions {
    useOutdated: boolean;
  }

  interface Writeable {
    update(obj:Object, options?:UpdateOptions):Operation<WriteResult>;
    replace(obj:Object, options?:UpdateOptions):Operation<WriteResult>;
    replace(expr:ExpressionFunction<any>):Operation<WriteResult>;
    delete(options?:UpdateOptions):Operation<WriteResult>;
  }

  interface Table<T> extends Sequence<T> {
    indexCreate(name:string, index?:ExpressionFunction<any>):Operation<CreateResult>;
    indexDrop(name:string):Operation<DropResult>;
    indexList():Operation<string[]>;

    insert(obj:T[], options?:InsertOptions):Operation<WriteResult>;
    insert(obj:T, options?:InsertOptions):Operation<WriteResult>;

    get(key:string):Sequence<T>; // primary key
    getAll(key:string, index?:Index):Sequence<T>; // without index defaults to primary key
    getAll(...keys:string[]):Sequence<T>;
  }

  interface Sequence<T> extends Operation<Cursor<T>>, Writeable {
    (attr: string): Expression<any>;

    between(lower:any, upper:any, index?:Index):Sequence<T>;
    filter(rql:ExpressionFunction<boolean>):Sequence<T>;
    filter(rql:Expression<boolean>):Sequence<T>;
    filter(obj:{[key:string]:any}):Sequence<T>;


    // Join
    // these return left, right
    innerJoin<U>(sequence:Sequence<U>, join:JoinFunction<boolean>):Sequence<{ left: T, right: U }>;
    outerJoin<U>(sequence:Sequence<U>, join:JoinFunction<boolean>):Sequence<{ left: T, right: U }>;
    eqJoin<U>(leftAttribute:string, rightSequence:Sequence<U>, index?:Index):Sequence<{ left: T, right: U }>;
    eqJoin<U>(leftAttribute:ExpressionFunction<any>, rightSequence:Sequence<U>, index?:Index):Sequence<{ left: T, right: U }>;
    zip<U>():Sequence<U>;

    // Transform
    map<U>(transform:ExpressionFunction<U>):Sequence<U>;

    withFields(...selectors:any[]):Sequence<any>;
    concatMap<U>(transform:ExpressionFunction<U>):Sequence<U>;
    orderBy(...keys:string[]):Sequence<T>;
    orderBy(...sorts:Sort[]):Sequence<T>;
    skip(n:number):Sequence<T>;
    limit(n:number):Sequence<T>;
    slice(start:number, end?:number):Sequence<T>;
    nth(n:number):Expression<any>;
    indexesOf(obj:any):Sequence<T>;
    isEmpty():Expression<boolean>;
    union(sequence:Sequence<T>):Sequence<T>;
    sample(n:number):Sequence<T>;

    // Aggregate
    reduce(r:ReduceFunction<any>, base?:any):Expression<any>;
    count():Expression<number>;

    sum(field: string): number;
    sum(fn: ExpressionFunction<number>): Expression<number>;

    avg(field: string): number;
    avg(fn: ExpressionFunction<number>): Expression<number>;

    max(field: string): number;
    max(fn: ExpressionFunction<number>): Expression<number>;

    min(field: string): number;
    min(fn: ExpressionFunction<number>): Expression<number>;

    distinct():Sequence<T>;
    groupedMapReduce(group:ExpressionFunction<any>, map:ExpressionFunction<any>, reduce:ReduceFunction<any>, base?:any):Sequence<T>;

    group(...aggregators:Aggregator[]):Expression<{ group: any, reduction: T[] }>;
    reduce<U>(reductionFunction: (left: Expression<U>, right: Expression<U>) => U): Expression<U>;

    contains(...values: any[]): Expression<boolean>;
    contains(...predicates: ExpressionFunction<boolean>[]): Expression<boolean>;

    // Manipulation
    pluck(...props:string[]):Sequence<T>;
    without(...props:string[]):Sequence<T>;
  }

  interface ExpressionFunction<U> {
    (doc:Expression<any>):Expression<U>;
  }

  interface JoinFunction<U> {
    (left:Expression<any>, right:Expression<any>):Expression<U>;
  }

  interface ReduceFunction<U> {
    (acc:Expression<any>, val:Expression<any>):Expression<U>;
  }

  interface InsertOptions {
    conflict?: string; // 'error'
    durability?: string; // 'soft'
    returnChanges?: boolean; // false
  }

  interface UpdateOptions {
    non_atomic: boolean;
    durability: string; // 'soft'
    returnChanges: boolean; // false
  }

  interface WriteResult {
    inserted: number;
    replaced: number;
    unchanged: number;
    errors: number;
    warnings: string;
    deleted: number;
    skipped: number;
    first_error: Error;
    generated_keys?: string[]; // only for insert
    changes?: { old_val: any, new_val: any }[];
  }

  interface JoinResult {
    left:any;
    right:any;
  }

  interface CreateResult {
    created: number;
  }

  interface DropResult {
    dropped: number;
  }

  interface Index {
    index: string;
    left_bound?: string; // 'closed'
    right_bound?: string; // 'open'
  }

  interface Expression<T> extends Writeable, Operation<T> {
      (prop:string):Expression<any>;
      merge(query:Expression<Object>):Expression<Object>;
      append(prop:string):Expression<Object>;
      contains(prop:string):Expression<boolean>;

      and(b:boolean):Expression<boolean>;
      or(b:boolean):Expression<boolean>;
      eq(v:any):Expression<boolean>;
      ne(v:any):Expression<boolean>;
      not():Expression<boolean>;

      gt(value:T):Expression<boolean>;
      ge(value:T):Expression<boolean>;
      lt(value:T):Expression<boolean>;
      le(value:T):Expression<boolean>;

      add(n:number):Expression<number>;
      sub(n:number):Expression<number>;
      mul(n:number):Expression<number>;
      div(n:number):Expression<number>;
      mod(n:number):Expression<number>;

      hasFields(...fields:string[]):Expression<boolean>;

      default(value:T):Expression<T>;
  }

  interface Operation<T> {
   run(conn:Connection, cb:(err:Error, result:T)=>void);
   run(conn:Connection): Promise<T>;
  }

  interface Aggregator {}
  interface Sort {}

  interface Time {}


  // http://www.rethinkdb.com/api/#js
  // TODO control structures
}
