module.exports = {
  withDangerousMod: (config, action) => action[1](config),
  withAndroidManifest: (config, action) => action(config),
};
