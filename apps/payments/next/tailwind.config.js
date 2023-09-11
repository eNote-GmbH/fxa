const { createGlobPatternsForDependencies } = require('@nx/react/tailwind');
const { join } = require('path');
// const test = require('../../../libs/shared/styles/src/tailwind')

module.exports = {
  presets: [
    require('../../../libs/shared/styles/tailwind.config.js')
  ],
  content: [
    join(
      __dirname,
      '{src,pages,components,app}/**/*!(*.stories|*.spec).{ts,tsx,html}'
    ),
    ...createGlobPatternsForDependencies(__dirname),
  ]
}
