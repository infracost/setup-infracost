const path = require('path');
const core = require('@actions/core');
const tc = require('@actions/tool-cache');
const os = require('os');

// arch in [arm, x32, x64...] (https://nodejs.org/api/os.html#os_os_arch)
// return value in [amd64, 386, arm]
function mapArch(arch) {
  const mappings = {
    x64: 'amd64'
  };
  return mappings[arch] || arch;
}

// os in [darwin, linux, win32...] (https://nodejs.org/api/os.html#os_os_platform)
// return value in [darwin, linux, windows]
function mapOS(os) {
  const mappings = {
    win32: 'windows'
  };
  return mappings[os] || os;
}

function getDownloadObject(version) {
  const platform = os.platform();
  const filename = `infracost_${ mapOS(platform) }_${ mapArch(os.arch()) }`;
  const binPath = platform === 'win32' ? 'bin' : path.join(filename, 'bin');
  const url = `https://github.com/infracost/infracost/releases/download/v${ version }/${ filename }.tar.gz`;
  return {
    url,
    binPath
  };
}

async function setup() {
  try {
    // Get version of tool to be installed
    const version = core.getInput('version');

    // Download the specific version of the tool, e.g. as a tarball/zipball
    const download = getDownloadObject(version);
    const pathToTarball = await tc.downloadTool(download.url);

    // Extract the tarball onto host runner
    const pathToCLI = await tc.extractTar(pathToTarball);

    // Expose the tool by adding it to the PATH
    core.addPath(path.join(pathToCLI, download.binPath));
  } catch (e) {
    core.setFailed(e);
  }
}

module.exports = setup

if (require.main === module) {
  setup();
}
