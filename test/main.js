'use strict';

const assert = require('assert');
const crypto = require('crypto');
const querystring = require('querystring');
const request = require('request');
const sinon = require('sinon');
const uri = require('url');

const testError = require('./fixtures/testError');
const testProfile = require('./fixtures/testProfile');
const Verifier = require('../lib/main');

function checkIfValidProof(accessToken, proof, clientSecret) {
  let signature = crypto.createHmac('sha256', clientSecret)
    .update(accessToken).digest('hex');

  return signature === proof;
}

function selectFields(fixture, fields) {
  let profile = {};
  if (fields.length) {
    fields.forEach(function(field) {
      profile[field] = fixture[field];
    });
  } else {
    profile.name = fixture.name;
  }

  profile.id = fixture.id;

  return profile;
}

describe('verify facebook accessToken', function() {
  const clientSecret = 'clientSecret';

  before(function(done) {
    sinon
      .stub(request, 'get', function(options, callback) {
        let queryParams = querystring.parse(uri.parse(options.url).query);
        let profileFields = [];

        if (/invalidURL/i.test(options.url)) {
          return callback(new Error('invalid Url'), null, null);
        }

        if (!queryParams.access_token ||
            queryParams.access_token !== 'validAccessToken') {
          if (queryParams.access_token === 'requestError') {
            return callback(null,
              {statusCode: 500, headers: {}},
              'unhandled error in facebook api');
          }

          return callback(null,
            {statusCode: 400, headers: {}},
            testError.OAuthException);
        }

        if (queryParams.appsecret_proof) {
          if (!checkIfValidProof(queryParams.access_token,
            queryParams.appsecret_proof,
            clientSecret)) {
            return callback(null,
              {statusCode: 400, headers: {}},
              testError.GraphMethodException);
          }
        }

        if (queryParams.fields) {
          profileFields = queryParams.fields.split(',');
        }

        callback(null,
          {statusCode: 200, headers: {}},
          selectFields(testProfile, profileFields));
      });
    done();
  });

  after(function(done) {
    request.get.restore();
    done();
  });

  it('should succeed to get user profile with validAccessToken',
  function(done) {
    let verifier = new Verifier();
    let accessToken = 'validAccessToken';
    verifier.verify(accessToken, function(err, profile) {
      assert.ok(!err);
      assert.equal(profile.id, testProfile.id);
      assert.equal(profile.name, testProfile.name);

      done();
    });
  });

  it('should succeed to get user profile with fields options',
  function(done) {
    let verifier = new Verifier({profileFields: ['email', 'gender']});
    let accessToken = 'validAccessToken';
    verifier.verify(accessToken, function(err, profile) {
      assert.ok(!err);
      assert.equal(profile.id, testProfile.id);
      assert.equal(profile.email, testProfile.email);
      assert.equal(profile.gender, testProfile.gender);

      done();
    });
  });

  it('should succeed to get user profile with string type fields options',
  function(done) {
    let verifier = new Verifier({profileFields: 'email,gender'});
    let accessToken = 'validAccessToken';
    verifier.verify(accessToken, function(err, profile) {
      assert.ok(!err);
      assert.equal(profile.id, testProfile.id);
      assert.equal(profile.email, testProfile.email);
      assert.equal(profile.gender, testProfile.gender);

      done();
    });
  });

  it('should succeed to get user profile with valid clientSecret',
  function(done) {
    let verifier = new Verifier({clientSecret: 'clientSecret'});
    let accessToken = 'validAccessToken';
    verifier.verify(accessToken, function(err, profile) {
      assert.ok(!err);
      assert.equal(profile.id, testProfile.id);
      assert.equal(profile.name, testProfile.name);

      done();
    });
  });

  it('should fail to get user profile with invalid accessToken',
  function(done) {
    let verifier = new Verifier();
    let accessToken = 'invalidAccessToken';
    verifier.verify(accessToken, function(err, profile) {
      assert.ok(!profile);
      assert.equal(err.name, 'FacebookGraphAPIError');
      assert.equal(err.message, 'Invalid OAuth access token.');
      assert.equal(err.type, 'OAuthException');
      assert.equal(err.code, 190);

      done();
    });
  });

  it('should fail to get user profile with invalid clientSecret',
  function(done) {
    let verifier = new Verifier({clientSecret: 'invalidClientSecret'});
    let accessToken = 'validAccessToken';
    verifier.verify(accessToken, function(err, profile) {
      assert.ok(!profile);
      assert.equal(err.name, 'FacebookGraphAPIError');
      assert.equal(err.message,
        'Invalid appsecret_proof provided in the API argument');
      assert.equal(err.type, 'GraphMethodException');
      assert.equal(err.code, 100);

      done();
    });
  });

  it('should fail to get user profile with requestError',
  function(done) {
    let verifier = new Verifier();
    let accessToken = 'requestError';
    verifier.verify(accessToken, function(err, profile) {
      assert.ok(!profile);
      assert.equal(err.name, 'RequestError');
      assert.equal(err.message, 'Failed to fetch user profile');
      assert.deepEqual(err.requestError, 'unhandled error in facebook api');

      done();
    });
  });

  it('should fail to get user profile with internal error',
  function(done) {
    let verifier = new Verifier();
    verifier.facebookProfileUrl = 'http://invalidURL.com';
    let accessToken = 'validAccessToken';
    verifier.verify(accessToken, function(err, profile) {
      assert.ok(!profile);
      assert.equal(err.message, 'invalid Url');

      done();
    });
  });
});
