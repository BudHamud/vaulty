const path = require("path");
const { getDefaultConfig } = require("expo/metro-config");

const projectRoot = __dirname;
const sharedPackageRoot = path.resolve(projectRoot, "..", "vaulty-shared");

const config = getDefaultConfig(projectRoot);

config.watchFolders = [sharedPackageRoot];
config.resolver.unstable_enableSymlinks = true;
config.resolver.extraNodeModules = {
  "vaulty-shared": sharedPackageRoot,
};
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, "node_modules"),
  path.resolve(sharedPackageRoot, "node_modules"),
];

module.exports = config;