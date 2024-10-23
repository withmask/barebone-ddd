/* eslint-disable @typescript-eslint/explicit-function-return-type */
import {
  BadValueObjectInput,
  InvalidValueTypeException,
  Result,
  ValueNotAllowedException
} from 'shared';
import type { ValueObject, TResult, TVoidResult } from 'shared';

// type Constructor<T> = { new (...args: any[]): T } | { (): T };

type ReverseType<A> = A extends string
  ? 'string'
  : A extends number
    ? 'number'
    : never;

export class Validator {
  public static validateDTO<O extends { [key: string]: any }>(
    options: O
  ): {
    properties<Pk extends keyof O, T extends any[] = []>(
      props: {
        [K in Pk]: {
          nullable: null extends O[K] ? true : false;
          optional: undefined extends O[K] ? true : false;
          rules?: ((
            value: Exclude<O[K], null | undefined>,
            ...args: T
          ) => Promise<TVoidResult>)[];
          type: ReverseType<O[K]>;
        };
      },
      ...rulesArguments: T
    ): Promise<TVoidResult>;
    valueObjects<
      V extends { [P in keyof O]?: { create(): ValueObject<O[P]> } }
    >(
      valueObjects: V
    ): TResult<{
      [K in keyof V]: V[K] extends { create(): ValueObject<any> }
        ? ReturnType<V[K]['create']>
        : never;
    }>;
  } {
    return {
      valueObjects(valueObjects) {
        const VOs: { [key: string]: ValueObject<any> } = {};

        for (const prop in valueObjects) {
          if (Object.prototype.hasOwnProperty.call(valueObjects, prop)) {
            VOs[prop as string] = valueObjects[prop]!.create();

            const setValueResult = VOs[prop].set(
              options[prop as keyof typeof options]
            );

            if (setValueResult.failed())
              return Result.fail(
                new BadValueObjectInput(setValueResult.error(), prop)
              );
          }
        }

        return Result.ok(VOs as any);
      },
      async properties(props, ...rulesArgs) {
        for (const key in props) {
          const prop = props[key];
          const value = options[key] as any;

          // Handle nullability and optionality
          if (
            (value === null && !prop.nullable) ||
            (value === undefined && !prop.optional)
          )
            return Result.fail(new ValueNotAllowedException(key, value));

          // Check if the value is an instance of the given constructor (runtime type check)
          if (
            value !== null &&
            value !== undefined &&
            (typeof prop.type === 'string'
              ? prop.type !== typeof value
              : !(value instanceof prop.type))
          )
            return Result.fail(
              new InvalidValueTypeException(
                key,
                value.constructor.name,
                typeof prop.type === 'string' ? prop.type : 'UNREACHABLE'
              )
            );

          // Apply custom rules if any
          if (prop.rules) {
            for (const rule of prop.rules) {
              const result = await rule(value, ...rulesArgs);
              if (result.failed())
                return Result.fail(
                  new ValueNotAllowedException(key, result.error())
                );
            }
          }
        }
        return Result.done();
      }
    };
  }
}
