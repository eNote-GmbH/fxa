import { Inject } from '@nestjs/common';
import { Cacheable, CacheOptions } from '@type-cacheable/core';
import { FirestoreService } from '@fxa/shared/db/firestore';
import { useAdapter } from './type-cachable-firestore-adapter';
import { Firestore } from '@google-cloud/firestore';

export function FirestoreCacheable(
  cacheableOptions: CacheOptions,
  collectionName: string
) {
  const injectFirestore = Inject<Firestore>(FirestoreService);

  return (
    target: any,
    propertyKey: string,
    propertyDescriptor: PropertyDescriptor
  ) => {
    injectFirestore(target, 'firestore');

    const originalMethod = propertyDescriptor.value;

    propertyDescriptor.value = async function (...args: any[]) {
      const firestore = (this as any).firestore;
      const newDescriptor = Cacheable({
        ...cacheableOptions,
        client: useAdapter(firestore, collectionName),
      })(target, propertyKey, {
        ...propertyDescriptor,
        value: originalMethod,
      });

      return await newDescriptor.value.apply(this, args);
    };

    return propertyDescriptor;
  };
}
