import { Firestore } from '@google-cloud/firestore';
import cacheManager, {
  CacheClient,
  CacheManagerOptions,
} from '@type-cacheable/core';

export class FirestoreAdapter implements CacheClient {
  constructor(firestoreClient: Firestore, collectionName: string) {
    this.firestoreClient = firestoreClient;
    this.collectionName = collectionName;

    this.get = this.get.bind(this);
    this.del = this.del.bind(this);
    this.delHash = this.delHash.bind(this);
    this.getClientTTL = this.getClientTTL.bind(this);
    this.keys = this.keys.bind(this);
    this.set = this.set.bind(this);
  }

  private readonly firestoreClient: Firestore;
  private readonly collectionName: string;

  public async get(cacheKey: string): Promise<any> {
    const result = await this.firestoreClient
      .collection(this.collectionName)
      .doc(cacheKey)
      .get();

    const data = result?.data();
    const cachedValue = data?.value;

    return cachedValue;
  }

  public async set(cacheKey: string, value: any, ttl?: number): Promise<any> {
    await this.firestoreClient
      .collection(this.collectionName)
      .doc(cacheKey)
      .set({
        value,
        ttl: ttl || 0,
        updatedAt: new Date(),
      });
  }

  public getClientTTL(): number {
    return 0;
  }

  public async del(keyOrKeys: string | string[]): Promise<any> {
    if (Array.isArray(keyOrKeys) && !keyOrKeys.length) {
      return 0;
    }

    const keysToDelete = Array.isArray(keyOrKeys) ? keyOrKeys : [keyOrKeys];

    for (const cacheKey of keysToDelete) {
      await this.firestoreClient
        .collection(this.collectionName)
        .doc(cacheKey)
        .delete();
    }
  }

  public async keys(_: string): Promise<string[]> {
    throw new Error('keys() not supported for cachable FirestoreAdapter');
  }

  public async delHash(_: string | string[]): Promise<any> {
    throw new Error('delHash() not supported for cachable FirestoreAdapter');
  }
}

export const useAdapter = (
  client: Firestore,
  collectionName: string,
  asFallback?: boolean,
  options?: CacheManagerOptions
): FirestoreAdapter => {
  const firestoreAdapter = new FirestoreAdapter(client, collectionName);

  if (asFallback) {
    cacheManager.setFallbackClient(firestoreAdapter);
  } else {
    cacheManager.setClient(firestoreAdapter);
  }

  if (options) {
    cacheManager.setOptions(options);
  }

  return firestoreAdapter;
};
