# facebook-auth-verifier
[![Build Status][travisimg]][travis]
[![Coverage Status][coverallsimg]][coveralls]

This is library to validate facebook auth token and parse it for consuming it in [node.js][node] backend server.

## Installation

```bash
npm install facebook-auth-verifier --save
```

## Usage

```js
var Verifier = require('facebook-auth-verifier');

// accessToken from client.
var accessToken = 'XYZ123';

// app's client secret for appsecret_proof.
var clientSecret = 'clientSecret';

var verifier = new Verifier({
  profileFields: [ 'email', 'name' ],
  clientSecret: clientSecret
});

verifier.verify(accessToken, function (err, userProfile) {
  if (!err) {
    // use userProfile in here.
    console.log(userProfile);
  }
});
```

## Tests

```bash
npm test
```
or
```bash
npm prepare
```

## Contributing

In lieu of a formal styleguide, take care to maintain the existing coding style.
Add unit tests for any new or changed functionality. Lint and test your code.

## Third-party libraries

The following third-party libraries are used by this module:

* request: https://github.com/request/request - to get user profile from facebook.
* underscore: http://underscorejs.org

## Inspired by

* passport-facebook - https://github.com/jaredhanson/passport-facebook

## Release History

* 0.1.0 Initial release

[travisimg]: https://travis-ci.org/maeltm/node-facebook-auth-verifier.svg?branch=master
[travis]: https://travis-ci.org/maeltm/node-facebook-auth-verifier
[coverallsimg]: https://coveralls.io/repos/maeltm/node-facebook-auth-verifier/badge.svg?branch=master&service=github
[coveralls]: https://coveralls.io/github/maeltm/node-facebook-auth-verifier?branch=master
[node]: http://nodejs.org/
