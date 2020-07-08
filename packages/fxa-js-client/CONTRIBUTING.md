# Contribution guidelines to fxa-js-client

Anyone is welcome to help with Firefox Accounts. Feel free to get in touch with other community members on Matrix, the
mailing list or through issues here on GitHub.

- Matrix: [#fxa:mozilla.org](https://chat.mozilla.org/#/room/#fxa:mozilla.org)
- Mailing list: <https://mail.mozilla.org/listinfo/dev-fxacct>
- and of course, [the issues list](https://github.com/mozilla/fxa-js-client/issues)

UPDATE: On March 2020, Mozilla moved from IRC to Matrix. For more information on Matrix, check out the following wiki article: <https://wiki.mozilla.org/Matrix>.

## Bug Reports

You can file issues here on GitHub. Please try to include as much information as you can and under what conditions
you saw the issue.

## Sending Pull Requests

Patches should be submitted as pull requests (PR).

Before submitting a PR:

- Your code must run and pass all the automated tests before you submit your PR for review. "Work in progress" pull requests are allowed to be submitted, but should be clearly labeled as such and should not be merged until all tests pass and the code has been reviews.
  - Run `grunt lint` to make sure your code passes linting.
  - Run `npm test` to make sure all tests still pass.
- Your patch should include new tests that cover your changes. It is your and your reviewer's responsibility to ensure your patch includes adequate tests.

When submitting a PR:

- You agree to license your code under the project's open source license ([MPL 2.0](/LICENSE)).
- Base your branch off the current `main` (see below for an example workflow).
- Add both your code and new tests if relevant.
- Run `grunt lint` and `npm test` to make sure your code passes linting and tests.
- Please do not include merge commits in pull requests; include only commits with the new relevant code.

See the main [README.md](/README.md) for information on prerequisites, installing, running and testing.

## Code Review

This project is production Mozilla code and subject to our [engineering practices and quality standards](https://developer.mozilla.org/en-US/docs/Mozilla/Developer_guide/Committing_Rules_and_Responsibilities). Every patch must be peer reviewed. This project is part of the [Firefox Accounts module](https://wiki.mozilla.org/Modules/Other#Firefox_Accounts), and your patch must be reviewed by one of the listed module owners or peers.

## Build Library

Note: Java is required to build the library due to a custom SJCL build.

```
npm run-script setup
npm start
```

The `build` directory should have `fxa-client.js` and `fxa-client.min.js`.

## Development

`grunt build` - builds the regular and minified version of the library

`grunt dev` - builds the library, runs eslint, shows library size, runs tests, watches for changes

`grunt debug` - builds the regular library, runs test, watches for changes. Helpful when you are debugging.

### SJCL Notes

Currently [SJCL](http://bitwiseshiftleft.github.io/sjcl/) is built with `./configure --without-random --without-ocb2 --without-gcm --without-ccm`.
Adjust this if you need other SJCL features.

## Testing

This package uses [Mocha](https://mochajs.org/) to test its code. By default `npm test` will first lint the code and then test all files under `tests/lib`, and `npm run test-local` will run the suite against the local fxa-auth-server running on port 9000.

Test specific tests with the following commands:

```bash
# Test only tests/lib/sms.js
npx mocha tests/lib/sms.js

# Grep for "interface is correct"
npx mocha tests/lib -g "interface is correct"
```

Refer to Mocha's [CLI documentation](https://mochajs.org/#command-line-usage) for more advanced test configuration.

## Git Commit Guidelines

We loosely follow the [Angular commit guidelines](https://github.com/angular/angular.js/blob/master/CONTRIBUTING.md#type) of `<type>(<scope>): <subject>` where `type` must be one of:

- **feat**: A new feature
- **fix**: A bug fix
- **docs**: Documentation only changes
- **style**: Changes that do not affect the meaning of the code (white-space, formatting, missing
  semi-colons, etc)
- **refactor**: A code change that neither fixes a bug or adds a feature
- **perf**: A code change that improves performance
- **test**: Adding missing tests
- **chore**: Changes to the build process or auxiliary tools and libraries such as documentation
  generation

## Documentation

Running `grunt doc` will create a `docs` directory, browse the documentation by opening `docs/index.html`.

Write documentation using [YUIDoc Syntax](http://yui.github.io/yuidoc/syntax/).
