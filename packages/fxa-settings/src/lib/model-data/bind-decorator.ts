/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
import 'reflect-metadata';
import { ModelDataProvider } from './model-data-provider';

/**
 * Turns a field name into a lookup key. This can be one of three states.
 *  - When a string is provided, it will act like an internal key name. For example, if `redirect_url`
 *    is provided, and `redirectUrl` is the current field name, then try look up 'redirect_url' in
 *    the data store.
 *  - When a function is provided, the use this function to generate a new key name based on the fieldName.
 *    For example, if 'Redirect' is the current field name, and (s) => s.toLowerCase() is provided, then
 *    `redirect` will be the key to look up in the the data store.
 *  - When undefined is provided, then use the current field name. For example if `redirectUrl` is the current field
 *    then lookup `redirectUrl` in the the data store.
 */
export type KeyTransform = string | ((s: string) => string) | undefined;

/**
 * Functions for transforming class property names to lookup keys.
 */
export const KeyTransforms = {
  snakeCase: (k: string) =>
    k
      .split(/\.?(?=[A-Z])/)
      .join('_')
      .toLowerCase(),
  lower: (k: string) => k.toLowerCase(),
};

/**
 * Resolves a key that is used to look up data in the model's data store.
 */
const getKey = (keyTransform: KeyTransform, defaultValue: string) => {
  if (typeof keyTransform === 'function') {
    return keyTransform(defaultValue);
  }
  if (typeof keyTransform === 'string') {
    return keyTransform;
  }
  return defaultValue;
};

/**
 * The symbol for the @bind decorator.
 */
export const bindMetadataKey = Symbol('bind');

/**
 * Looks up a list of property names that have bindings on an object
 * @param target
 */
export function getBoundKeys(target: ModelDataProvider) {
  const result = new Array<string>();
  for (const key of Object.keys(Object.getPrototypeOf(target))) {
    // Resolves the @bind decorator
    const bind = Reflect.getMetadata(bindMetadataKey, target, key);
    if (bind?.memberName && typeof bind?.memberName === 'string') {
      result.push(bind.memberName);
    }
  }
  return result;
}

/**
 * Provides the data store for the model, and runs a couple sanity checks on the model state.
 */
function getModelData(model: ModelDataProvider | any) {
  if (!(model instanceof ModelDataProvider)) {
    throw new Error(
      'Invalid bind! Does the model is not an an instance of ModelDataProvider. Check that the model inherits from ModelDataProvider.'
    );
  }
  const data = model.getModelData();
  if (data == null) {
    throw new Error(
      'Invalid bind! Has the data store for the model been initialized?'
    );
  }
  return data;
}

/**
 * Represents a validation check
 **/
export type ValidationCheck = <T>(key: string, value: T) => void;

/**
 * A type script decorator for binding to an underlying data store.
 * @param dataKey A key in the underlying data store. Used to bind the field to a key value pair in the data store.
 * @returns A value of type T
 * @example
 *
 *  class User {
 *    @bind('first_name')
 *    firstName
 *  }
 *
 */
export const bind = <T>(dataKey?: KeyTransform) => {
  // The actual decorator implementation. Note we have to use 'any' as a
  // return type here because that's the type expected by the TS decorator
  // definition.
  return function (model: any | ModelDataProvider, memberName: string): any {
    if (model == null) {
      throw new Error('Invalid bind! Model must be provided!');
    }

    if (!(model instanceof ModelDataProvider)) {
      throw new Error('Invalid bind! Model inherit from ModelDataProvider!');
    }

    const metadata = {
      memberName,
      key: getKey(dataKey, memberName),
    };
    Reflect.defineMetadata(bindMetadataKey, metadata, model, memberName);

    // Hijacks class properties with @bind decorators and turns them into getter/setter that stores
    // their values in the underlying data store.
    const property = {
      enumerable: true,
      set: function (value: T) {
        const data = getModelData(this);
        const key = getKey(dataKey, memberName);
        const currentValue = data.get(key);

        // Don't bother setting state needlessly. Depending on the data
        // store writes may or may not be cheap.
        if (currentValue !== value) {
          data.set(key, value);
        }
      },
      get: function () {
        const data = getModelData(this);
        const key = getKey(dataKey, memberName);
        return data.get(key);
      },
    };
    Object.defineProperty(model, memberName, property);
    return property;
  };
};
