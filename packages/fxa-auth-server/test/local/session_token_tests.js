/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

var sinon = require('sinon')
var test = require('../ptaptest')
var log = { trace: function() {}, info: function () {} }

var tokens = require('../../lib/tokens')(log)
var SessionToken = tokens.SessionToken

var ACCOUNT = {
  uid: 'xxx',
  email: Buffer('test@example.com').toString('hex'),
  emailCode: '123456',
  emailVerified: true
}

test(
  'interface is correct',
  function (t) {
    return SessionToken.create(ACCOUNT)
      .then(function (token) {
        t.equal(typeof token.lastAuthAt, 'function', 'lastAuthAt method is defined')
        t.equal(typeof token.update, 'function', 'update method is defined')
        t.equal(typeof token.isFresh, 'function', 'isFresh method is defined')
        t.equal(typeof token.forceUpdate, 'function', 'forceUpdate method is defined')
      })
  }
)

test(
  're-creation from tokenData works',
  function (t) {
    var token = null
    return SessionToken.create(ACCOUNT)
      .then(
        function (x) {
          token = x
        }
      )
      .then(
        function () {
          return SessionToken.fromHex(token.data, ACCOUNT)
        }
      )
      .then(
        function (token2) {
          t.deepEqual(token.data, token2.data)
          t.deepEqual(token.id, token2.id)
          t.deepEqual(token.authKey, token2.authKey)
          t.deepEqual(token.bundleKey, token2.bundleKey)
          t.deepEqual(token.uid, token2.uid)
          t.equal(token.email, token2.email)
          t.equal(token.emailCode, token2.emailCode)
          t.equal(token.emailVerified, token2.emailVerified)
        }
      )
  }
)

test(
  'sessionToken key derivations are test-vector compliant',
  function (t) {
    var token = null
    var tokenData = 'a0a1a2a3a4a5a6a7a8a9aaabacadaeafb0b1b2b3b4b5b6b7b8b9babbbcbdbebf'
    return SessionToken.fromHex(tokenData, ACCOUNT)
      .then(
        function (x) {
          token = x
          t.equal(token.data.toString('hex'), tokenData)
          t.equal(token.id.toString('hex'), 'c0a29dcf46174973da1378696e4c82ae10f723cf4f4d9f75e39f4ae3851595ab')
          t.equal(token.authKey.toString('hex'), '9d8f22998ee7f5798b887042466b72d53e56ab0c094388bf65831f702d2febc0')
        }
      )
  }
)

test(
  'SessionToken.forceUpdate',
  function (t) {
    return SessionToken.create(ACCOUNT)
      .then(function (token) {
        token.forceUpdate({
          data: 'foo',
          tokenId: 'foo',
          authKey: 'foo',
          bundleKey: 'foo',
          algorithm: 'foo',
          uid: 'foo',
          lifetime: 'foo',
          createdAt: 'foo',
          email: 'foo',
          emailCode: 'foo',
          emailVerified: 'foo',
          verifierSetAt: 'foo',
          locale: 'foo',
          uaBrowser: 'foo',
          uaBrowserVersion: 'bar',
          uaOS: 'baz',
          uaOSVersion: 'qux',
          uaDeviceType: 'wibble',
          lastAccessTime: 'mnngh'
        })
        t.notEqual(token.data, 'foo', 'data was not updated')
        t.notEqual(token.tokenId, 'foo', 'tokenId was not updated')
        t.notEqual(token.authKey, 'foo', 'authKey was not updated')
        t.notEqual(token.bundleKey, 'foo', 'bundleKey was not updated')
        t.notEqual(token.algorithm, 'foo', 'algorithm was not updated')
        t.notEqual(token.uid, 'foo', 'uid was not updated')
        t.notEqual(token.lifetime, 'foo', 'lifetime was not updated')
        t.notEqual(token.createdAt, 'foo', 'createdAt was not updated')
        t.notEqual(token.email, 'foo', 'email was not updated')
        t.notEqual(token.emailVerified, 'foo', 'emailVerified was not updated')
        t.notEqual(token.verifierSetAt, 'foo', 'verifierSetAt was not updated')
        t.notEqual(token.locale, 'foo', 'locale was not updated')
        t.equal(token.uaBrowser, 'foo', 'uaBrowser was updated')
        t.equal(token.uaBrowserVersion, 'bar', 'uaBrowserVersion was updated')
        t.equal(token.uaOS, 'baz', 'uaOS was updated')
        t.equal(token.uaOSVersion, 'qux', 'uaOSVersion was updated')
        t.equal(token.uaDeviceType, 'wibble', 'uaDeviceType was updated')
        t.equal(token.lastAccessTime, 'mnngh', 'lastAccessTime was updated')
      })
  }
)

test(
  'SessionToken.isFresh',
  function (t) {
    return SessionToken.create({
      uaBrowser: 'foo',
      uaBrowserVersion: 'bar',
      uaOS: 'baz',
      uaOSVersion: 'qux',
      uaDeviceType: 'wibble',
      lastAccessTime: 0
    }).then(function (token) {
      t.equal(token.isFresh({
        uaBrowser: 'foo',
        uaBrowserVersion: 'bar',
        uaOS: 'baz',
        uaOSVersion: 'qux',
        uaDeviceType: 'wibble',
        lastAccessTime: 0
      }), true, 'returns true when all fields are the same')
      t.equal(token.isFresh({
        uaBrowser: 'Foo',
        uaBrowserVersion: 'bar',
        uaOS: 'baz',
        uaOSVersion: 'qux',
        uaDeviceType: 'wibble',
        lastAccessTime: 0
      }), false, 'returns false when uaBrowser is different')
      t.equal(token.isFresh({
        uaBrowser: 'foo',
        uaBrowserVersion: 'baR',
        uaOS: 'baz',
        uaOSVersion: 'qux',
        uaDeviceType: 'wibble',
        lastAccessTime: 0
      }), false, 'returns false when uaBrowserVersion is different')
      t.equal(token.isFresh({
        uaBrowser: 'foo',
        uaBrowserVersion: 'bar',
        uaOS: 'foo',
        uaOSVersion: 'qux',
        uaDeviceType: 'wibble',
        lastAccessTime: 0
      }), false, 'returns false when uaOS is different')
      t.equal(token.isFresh({
        uaBrowser: 'foo',
        uaBrowserVersion: 'bar',
        uaOS: 'baz',
        uaOSVersion: 'QUX',
        uaDeviceType: 'wibble',
        lastAccessTime: 0
      }), false, 'returns false when uaOSVersion is different')
      t.equal(token.isFresh({
        uaBrowser: 'foo',
        uaBrowserVersion: 'bar',
        uaOS: 'baz',
        uaOSVersion: 'qux',
        uaDeviceType: 'wobble',
        lastAccessTime: 0
      }), false, 'returns false when uaDeviceType is different')
      t.equal(token.isFresh({
        uaBrowser: 'foo',
        uaBrowserVersion: 'bar',
        uaOS: 'baz',
        uaOSVersion: 'qux',
        uaDeviceType: 'wibble',
        lastAccessTime: 3600000
      }), false, 'returns false when lastAccessTime is 3,600,000 milliseconds newer')
      t.equal(token.isFresh({
        uaBrowser: 'foo',
        uaBrowserVersion: 'bar',
        uaOS: 'baz',
        uaOSVersion: 'qux',
        uaDeviceType: 'wibble',
        lastAccessTime: 3599999
      }), true, 'returns true when lastAccessTime is 3,599,999 milliseconds newer')
    })
  }
)

test(
  'SessionToken.update on fresh token',
  function (t) {
    return SessionToken.create(
    ).then(function (token) {
      sinon.stub(SessionToken.prototype, 'isFresh', function () {
        return true
      })
      sinon.spy(SessionToken.prototype, 'forceUpdate')

      t.equal(
        token.update(
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.10; rv:41.0) Gecko/20100101 Firefox/41.0'
        ), false, 'returns'
      )

      t.equal(SessionToken.prototype.isFresh.callCount, 1, 'isFresh was called once')
      t.equal(SessionToken.prototype.isFresh.thisValues[0], token, 'isFresh context was token')
      var isFreshArgs = SessionToken.prototype.isFresh.args[0]
      t.equal(isFreshArgs.length, 1, 'isFresh was passed one argument')
      var isFreshData = isFreshArgs[0]
      t.equal(typeof isFreshData, 'object', 'isFresh was passed an object')
      t.equal(Object.keys(isFreshData).length, 6, 'isFresh data had six properties')
      t.equal(isFreshData.uaBrowser, 'Firefox', 'uaBrowser was correct')
      t.equal(isFreshData.uaBrowserVersion, '41', 'uaBrowserVersion was correct')
      t.equal(isFreshData.uaOS, 'Mac OS X', 'uaOS was correct')
      t.equal(isFreshData.uaOSVersion, '10.10', 'uaOSVersion was correct')
      t.equal(isFreshData.uaDeviceType, null, 'uaDeviceType was correct')
      t.ok(isFreshData.lastAccessTime > Date.now() - 10000, 'lastAccessTime was greater than 10 seconds ago')
      t.ok(isFreshData.lastAccessTime < Date.now(), 'lastAccessTime was less then Date.now()')

      t.equal(SessionToken.prototype.forceUpdate.callCount, 0, 'forceUpdate was not called')
    })
    .finally(function () {
      SessionToken.prototype.isFresh.restore()
      SessionToken.prototype.forceUpdate.restore()
    })
  }
)

test(
  'SessionToken.update on stale token',
  function (t) {
    return SessionToken.create()
      .then(function (token) {
        sinon.stub(SessionToken.prototype, 'isFresh', function () {
          return false
        })
        sinon.spy(SessionToken.prototype, 'forceUpdate')

        t.equal(
          token.update(
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.10; rv:41.0) Gecko/20100101 Firefox/41.0'
          ), true, 'returns true'
        )

        t.equal(SessionToken.prototype.isFresh.callCount, 1, 'isFresh was called once')
        var isFreshArgs = SessionToken.prototype.forceUpdate.args[0]
        t.equal(isFreshArgs.length, 1, 'isFresh was passed one argument')

        t.equal(SessionToken.prototype.forceUpdate.callCount, 1, 'forceUpdate called once')
        t.equal(SessionToken.prototype.forceUpdate.thisValues[0], token, 'forceUpdate context was token')
        var forceUpdateArgs = SessionToken.prototype.forceUpdate.args[0]
        t.equal(forceUpdateArgs.length, 1, 'forceUpdate was passed one argument')
        t.deepEqual(forceUpdateArgs[0], isFreshArgs[0], 'forceUpdate was passed correct argument')
      })
      .finally(function () {
        SessionToken.prototype.isFresh.restore()
        SessionToken.prototype.forceUpdate.restore()
      })
  }
)

