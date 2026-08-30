const platform = { OS: 'ios' };
module.exports = {
  Platform: platform,
  __setPlatformOS(value) { platform.OS = value; },
};
