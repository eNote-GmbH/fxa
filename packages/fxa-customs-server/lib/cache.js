const Memcached = require('memcached');
const { RedisShared } = require('fxa-shared/db/redis');
const P = require('bluebird');
P.promisifyAll(Memcached.prototype);

class Cache {
  constructor(config) {
    this.useRedis = config.redis.useRedis || false;

    if (this.useRedis) {
      this.client = new RedisShared(config.redis);
    } else {
      // this.client = new Memcached(config.memcache.address, {
      //   timeout: 500,
      //   retries: 1,
      //   retry: 1000,
      //   reconnect: 1000,
      //   idle: 30000,
      //   namespace: 'fxa~',
      // });
    }
  }

  async setAsync(key, value) {
    return this.client.redis.set(key, JSON.stringify(value));
  }

  async getAsync(key) {
    const value = await this.client.redis.get(key);
    try {
      return JSON.parse(value);
    } catch (e) {
      console.log(e.toString());
    }
  }
}

module.exports = Cache;
