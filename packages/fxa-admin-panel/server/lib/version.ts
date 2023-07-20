/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/**
 * Return version info based on package.json, the git sha, and source repo
 *
 * Try to statically determine commitHash, sourceRepo, and l10nVersion * at startup.
 *
 * If l10nVersion cannot be loaded statically from the
 * content in ../../node_modules, then just show UNKNOWN.
 *
 * If commitHash cannot be found from ./config/version.json (i.e., this is not
 * production or stage), then an attempt will be made to determine commitHash
 * and sourceRepo dynamically from `git`. If it cannot be found with `git`,
 * just show UNKNOWN for commitHash and sourceRepo.
 *
 */

import cp from 'child_process';
import path from 'path';

const UNKNOWN: string | Buffer = 'unknown';
const versionJsonPath = '../config/version.json';

// commitHash and sourceRepo
function getCommitHash() {
  try {
    const versionInfo = require(versionJsonPath);
    const ver = versionInfo.version;
    return ver.hash;
  } catch (e) {
    /* ignore, shell out to `git` for hash */
  }

  let stdout = UNKNOWN;
  const gitDir = path.resolve(__dirname, '../../../../.git');

  try {
    stdout = cp.execSync('git rev-parse HEAD', { cwd: gitDir });
  } catch (e) {
    /* ignore, report UNKNOWN */
  }

  return stdout && stdout.toString().trim();
}

function getSourceRepo() {
  try {
    const versionInfo = require(versionJsonPath);
    const ver = versionInfo.version;
    return ver.source;
  } catch (e) {
    /* ignore, shell out to `git` for repo */
  }

  let stdout = UNKNOWN;
  const gitDir = path.resolve(__dirname, '..', '..', '.git');
  const configPath = path.join(gitDir, 'config');
  const cmd = 'git config --get remote.origin.url';

  try {
    // TODO: figure out why both `cmd` are neccesary here
    // @ts-ignore
    stdout = cp.execSync(cmd, cmd, { env: { GIT_CONFIG: configPath } });
  } catch (e) {
    /* ignore, shell out to `git` for repo */
  }

  return stdout && stdout.toString().trim();
}

let version:
  | undefined
  | {
      commit: string;
      version: string;
      source: string;
    };

function getVersion() {
  version = version || {
    commit: getCommitHash(),
    version: require('../../package.json').version,
    source: getSourceRepo(),
  };

  return version;
}

getVersion();

export default version;
