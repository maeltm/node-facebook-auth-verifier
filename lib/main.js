'use strict';

const _ = require('underscore');
const uri = require('url');
const crypto = require('crypto');
const request = require('request');

class Verifier {
  constructor(options) {
    options = options || {};
    this.facebookProfileUrl = 'https://graph.facebook.com/v2.7/me';
    this._profileFields = options.profileFields || [];
    this._clientSecret = options.clientSecret || '';
  }

  addUrlQueryFields(url, key, value) {
    url.search = (url.search ? url.search + '&' : '') + key + '=' + value;
  }

  convertProfileFields(profileFields) {
    if (_.isArray(profileFields)) {
      return profileFields.join(',');
    }

    return profileFields;
  }

  getEndPointUrl(accessToken) {
    let url = uri.parse(this.facebookProfileUrl);

    if (this._clientSecret) {
      let proof = crypto.createHmac('sha256', this._clientSecret)
        .update(accessToken).digest('hex');
      this.addUrlQueryFields(url, 'appsecret_proof', proof);
    }

    if (this._profileFields) {
      var fields = this.convertProfileFields(this._profileFields);
      if (fields) {
        this.addUrlQueryFields(url, 'fields', fields);
      }
    }

    this.addUrlQueryFields(url, 'access_token', accessToken);

    return uri.format(url);
  }

  verify(accessToken, callback) {
    request.get({url: this.getEndPointUrl(accessToken), json: true},
      (error, response, body) => {
        if (error) {
          return callback(error, null);
        }

        if (response.statusCode !== 200) {
          if (body && body.error && typeof body.error === 'object') {
            let err = new Error(body.error.message);
            err.name = 'FacebookGraphAPIError';
            err.type = body.error.type;
            err.code = body.error.code;
            this.subcode = body.error.error_subcode;
            this.traceID = body.error.fbtrace_id;
            this.status = response.statusCode;
            return callback(err, null);
          }

          let err = new Error('Failed to fetch user profile');
          err.name = 'RequestError';
          err.requestError = body;
          return callback(err, null);
        }

        callback(null, body);
      });
  }
}

module.exports = Verifier;
