const path = require('path');
const core = require('@actions/core');
const tc = require('@actions/tool-cache');
const io = require('@actions/io');
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
  const filename = `infracost-${ mapOS(platform) }-${ mapArch(os.arch()) }`;
  const binaryName = platform === 'win32' ? 'infracost.exe' : filename;
  const url = `https://github.com/infracost/infracost/releases/download/v${ version }/${ filename }.tar.gz`;
  return {
    url,
    binaryName
  };
}

// Rename infracost-<platform>-<arch> to infracost
async function renameBinary(pathToCLI, binaryName) {
  if(!binaryName.endsWith('.exe')) {
    try {
      source = path.join(pathToCLI, binaryName);
      target = path.join(pathToCLI, 'infracost');
      core.debug(`Moving ${source} to ${target}.`);
      await io.mv(source, target);
    } catch (e) {
      core.error(`Unable to move ${source} to ${target}.`);
      throw e;
    }
  }
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

    // Rename the platform/architecture specific binary to 'infracost'
    await renameBinary(pathToCLI, download.binaryName)

    // Expose the tool by adding it to the PATH
    core.addPath(pathToCLI);
  } catch (e) {
    core.setFailed(e);
  }
}

module.exports = setup

if (require.main === module) {
  setup();
}
