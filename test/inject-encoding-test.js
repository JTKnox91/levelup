/* Copyright (c) 2012-2015 LevelUP contributors
 * See list at <https://github.com/level/levelup#contributing>
 * MIT License <https://github.com/level/levelup/blob/master/LICENSE.md>
 */

var levelup = require('../lib/levelup.js')
  , async   = require('async')
  , common  = require('./common')
  , msgpack = require('msgpack-js')

  , assert  = require('referee').assert
  , refute  = require('referee').refute
  , buster  = require('bustermove')
  
buster.testCase('JSON API', {
    'setUp': function (done) {
      common.commonSetUp.call(this, function () {
        this.runTest = function (testData, assertType, done) {
          common.openTestBackend(function (err, backend) {
            refute(err)

            var db = levelup({
              db: backend,
              createIfMissing: true,
              errorIfExists: true,
              valueEncoding: {
                encode: msgpack.encode,
                decode: msgpack.decode,
                buffer: true,
                type: 'msgpack'
              }
            })
            refute(err)

            this.closeableDatabases.push(db)

            async.parallel(
                testData.map(function (d) { return db.put.bind(db, d.key, d.value) })
              , function (err) {
                  refute(err)

                  async.forEach(
                      testData
                    , function (d, callback) {
                        db.get(d.key, function (err, value) {
                          if(err) console.error(err.stack)
                          refute(err)
                          assert[assertType](d.value, value)
                          callback()
                        })
                      }
                    , done
                  )
                }
            )
          }.bind(this))
        }
        done()
      }.bind(this))
    }

  , 'tearDown': common.commonTearDown

  , 'simple-object values in "json" encoding': function (done) {
      this.runTest([
            { key: '0', value: 0 }
          , { key: '1', value: 1 }
          , { key: 'string', value: 'a string' }
          , { key: 'true', value: true }
          , { key: 'false', value: false }
        ], 'same', done)
    }

  , 'simple-object keys in "json" encoding': function (done) {
      this.runTest([
            { value: '0', key: 0 }
          , { value: '1', key: 1 }
          , { value: 'string', key: 'a string' }
          , { value: 'true', key: true }
          , { value: 'false', key: false }
        ], 'same', done)
    }

  , 'complex-object values in "json" encoding': function (done) {
      this.runTest([
            { key: '0', value: {
                foo: 'bar'
              , bar: [ 1, 2, 3 ]
              , bang: { yes: true, no: false }
            }}
        ], 'equals', done)
    }

  , 'complex-object keys in "json" encoding': function (done) {
      this.runTest([
            { value: '0', key: {
                foo: 'bar'
              , bar: [ 1, 2, 3 ]
              , bang: { yes: true, no: false }
            }}
        ], 'same', done)
    }
});
