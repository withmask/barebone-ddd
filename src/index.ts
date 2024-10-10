import { register } from 'module';
import { pathToFileURL } from 'url';

register('./include/loader.js', pathToFileURL('./'));

await import('./main.js');
// /* eslint-disable max-classes-per-file */

// import { Result, Exception } from 'shared';
// import type { TVoidResult, TResult } from 'shared';

// class ReadOnlyPropertyException extends Exception<'validation'> {
//   public constructor() {
//     super('validation');
//   }
// }
// class EmptyPropertyException extends Exception<'validation'> {
//   public constructor() {
//     super('validation');
//   }
// }

// class ValueObject<T, C extends { 'any.readonly': boolean }> {
//   private validators: ((value: T) => TVoidResult)[];
//   private value: { value: any } | null;

//   public constructor(
//     public readonly config: C
//     // ...args: [value?: T]
//   ) {
//     this.value = null;
//     this.validators = [];
//   }

//   public get defined(): boolean {
//     return this.value !== null;
//   }

//   public static make<
//     C extends { 'any.readonly': boolean },
//     I extends ValueObject<any, C>
//   >(
//     config: C,
//     type: new (config: C) => I,
//     ...args: I extends ValueObject<infer T, C> ? [value?: T] : never
//   ): TResult<I> {
//     const vo = new type(config);

//     if (args.length > 0) {
//       const [value] = args;

//       const setResult = vo.set(value);

//       if (setResult.failed()) return setResult;
//     }

//     return Result.ok(vo as any);
//   }

//   public get(): TResult<T> {
//     if (this.value === null) return Result.fail(new EmptyPropertyException());

//     return Result.ok(this.value.value);
//   }

//   public set(
//     value: [C['any.readonly']] extends [true] ? never : T
//   ): TVoidResult {
//     if (this.config['any.readonly'])
//       return Result.fail(new ReadOnlyPropertyException());

//     let validatedValue = value;

//     for (const validate of this.validators) {
//       const validateResult = validate(validatedValue);

//       if (validateResult.failed()) return validateResult;

//       if (!validateResult.void()) {
//         const value = validateResult.value();

//         validatedValue = value;
//       }
//     }

//     return Result.done();
//   }

//   protected validate(validator: (value: T) => TVoidResult): void {
//     this.validators.push(validator);
//   }
// }

// type EntityHistory<MethodHistory extends { [key: string]: any }> =
//   | {
//       from: null | { value: any };
//       op: 'SET';
//       prop: string;
//       to: null | { value: any };
//     }
//   | {
//       [M in keyof MethodHistory]: {
//         details: MethodHistory[M];
//         method: M;
//         op: 'METHOD';
//       };
//     }[keyof MethodHistory];

// class Entity<P, M, H extends { [key: string]: any }> {
//   public readonly methods: M;
//   public readonly properties: P;

//   private _history: EntityHistory<H>[];
//   private _methods: {
//     [key: string]: (...args: any[]) => TResult<any> | Promise<TResult<any>>;
//   };
//   private readonly _props: {
//     [key: string]: ValueObject<any, any>;
//   };

//   public constructor(public readonly id: string) {
//     const self = this;

//     this.properties = new Proxy(
//       {},
//       {
//         get(_, p): ValueObject<any, any> {
//           if (!(p in self._props))
//             return new ValueObject({ 'any.readonly': true });

//           return self._props[p as string];
//         }
//       }
//     ) as P;
//     this.methods = new Proxy(
//       {},
//       {
//         get(_, p): (...args: any) => any {
//           if (!(p in self._methods))
//             return () => {
//               throw new Error('Method undefined:' + (p as string));
//             };

//           return self._methods[p as string].bind(self._methods);
//         }
//       }
//     ) as M;

//     this._props = {};
//     this._methods = {};
//     this._history = [];

//     this.id = id;
//   }

//   public get modified(): boolean {
//     return this._history.length > 0;
//   }

//   //Prop: Voidable
//   // eslint-disable-next-line @typescript-eslint/ban-types
//   public read<T extends { [K in keyof P]?: boolean } = {}>(
//     keys?: T
//   ): TResult<{
//     [K in keyof T]: K extends keyof P
//       ? P[K] extends ValueObject<infer Y, any>
//         ?
//             | { value: Y; void: false }
//             | (T[K] extends true ? { void: true } : never)
//         : never
//       : never;
//   }> {
//     const output: {
//       [key: string]: { value: any; void: false } | { void: true };
//     } = {};

//     for (const key of Object.keys(keys as T) ??
//       Object.keys(this.properties as any)) {
//       const readKeyValueResult = (this.properties as any)[key].get();

//       if (readKeyValueResult.failed()) return readKeyValueResult;

//       if (readKeyValueResult.void()) output[key as string] = { void: true };
//       else
//         output[key as string] = {
//           void: false,
//           value: readKeyValueResult.value()
//         };
//     }

//     return Result.ok(output as any);
//   }

//   protected set<K extends keyof P>(name: K, vo: ValueObject<any, any>): void {
//     this._props[name as string] = vo;
//   }

//   protected setMethods(methods: M): void {
//     this._methods = methods as any;
//   }
// }

// interface IUserAggregateOptions {
//   name: StringValueObject<{ 'any.readonly': false; 'string.isEmail': false }>;
// }

// interface IUserAggregateMethodEvents {
//   deleteUser: {
//     previousName: string;
//   };
// }

// interface IUserAggregateMethods {
//   deleteUser(): Promise<TVoidResult>;
//   updateName(name: string): Promise<TVoidResult>;
// }

// class BaseAggregateMethods<M extends { [key: string]: any }> {
//   private _push:
//     | null
//     | ((op: Omit<Extract<EntityHistory<M>, { op: 'METHOD' }>, 'prop'>) => void);

//   public constructor() {
//     this._push = null;
//   }

//   public listen(
//     push: (
//       op: Omit<Extract<EntityHistory<M>, { op: 'METHOD' }>, 'prop'>
//     ) => void
//   ): void {
//     this._push = push;
//   }

//   protected push(op: Extract<EntityHistory<M>, { op: 'METHOD' }>): void {
//     if (this._push !== null) this.push(op);
//   }
// }

// class UserAggregateMethods
//   extends BaseAggregateMethods<IUserAggregateMethodEvents>
//   implements IUserAggregateMethods
// {
//   public constructor(private readonly _user: UserAggregate) {
//     super();
//   }

//   public async deleteUser(): Promise<TVoidResult> {
//     const getNameResult = this._user.properties.name.get();

//     if (getNameResult.failed()) return getNameResult;

//     const oldName = getNameResult.value();

//     const setResult = this._user.properties.name.set('Deleted User');

//     if (setResult.failed()) return setResult;

//     super.push({
//       op: 'METHOD',
//       method: 'deleteUser',
//       details: { previousName: oldName }
//     });

//     return Result.done();
//   }

//   public async updateName(name: string): Promise<TVoidResult> {
//     const updateNameResult = await this._user.properties.name.set(name);

//     if (updateNameResult.failed()) return updateNameResult;
//   }
// }

// class UserAggregate extends Entity<
//   IUserAggregateOptions,
//   IUserAggregateMethods,
//   IUserAggregateMethodEvents
// > {
//   public constructor(options: IUserAggregateOptions, id: string) {
//     super(id);
//     super.set('name', options.name);
//     // super.set('email', options.email);
//     super.setMethods(new UserAggregateMethods(this));
//   }
// }

// const x = new UserAggregate({
//   name: ''
// });

// x.properties.name.get();

// interface IStringValueObjectConfig extends IValueObjectConfig {
//   'string.isEmail': boolean;
// }

// class StringValueObject<R extends IStringValueObjectConfig> extends ValueObject<
//   string,
//   R
// > {
//   public constructor(config: R) {
//     super(config);

//     super.validate((value) => {
//       if (typeof value !== 'string') return Result.fail();

//       return Result.done();
//     });

//     if (this.config['string.isEmail']) super.validate((value) => {});
//   }
// }

// const options = Result.read({
//   name: ValueObject.make({ 'any.readonly': true }, StringValueObject),
//   email: ValueObject.make({ 'any.readonly': true }, StringValueObject)
// });

// if (options.failed()) return options;

// //Concept
// //vo.string().email().readonly()
// //Domain specific ValueObjects
// // app/user/domains/user/core/value-object/user-id

// const userIDValueObject = vo
//   .readonly()
//   .string()
//   .check('id', (value) => value);

// const makeValueObjectResult = userIDValueObject.make('a');

// if (makeValueObjectResult.failed()) return makeValueObjectResult;

// const userIDVO = makeValueObjectResult.value();

// const isSchema = vo.isSchema(
//   {
//     id: userIDValueObject
//   },
//   { is: userIDVO }
// );

// isSchema;
