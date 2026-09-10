'use strict';
const manifest = require('../package.json');
const errors = [];
if (!manifest.publisher || manifest.publisher === 'local-tools') {
  errors.push('Set package.json publisher to your registered Marketplace publisher ID. local-tools is a local placeholder.');
}
if (manifest.repository && (!manifest.repository.url || !/^https:\/\//.test(manifest.repository.url))) {
  errors.push('If provided, repository.url must point to your real public HTTPS source repository.');
}
if (!manifest.repository) {
  console.warn('NOTE: No repository configured. A public source repository is recommended; do not invent a URL.');
}
if (errors.length) {
  for (const error of errors) console.error(`RELEASE BLOCKED: ${error}`);
  process.exitCode = 1;
} else {
  console.log(`Release metadata ready: ${manifest.publisher}.${manifest.name}@${manifest.version}`);
  console.log('Run npm run check and npm run package, then upload the generated VSIX from your publisher account.');
}
