export default ({ config }) => ({
  ...config,
  name: getAppName(),
  ios: {
    ...config.ios,
    bundleIdentifier: getUniqueIdentifier(),
  },
  android: {
    ...config.android,
    package: getUniqueIdentifier(),
  },
});


const IS_DEV = process.env.APP_VARIANT === 'development';
const IS_PREVIEW = process.env.APP_VARIANT === 'preview';

const getUniqueIdentifier = () => {
  if (IS_DEV) {
    return 'com.nullatnothing.HomeAI.dev';
  }

  if (IS_PREVIEW) {
    return 'com.nullatnothing.HomeAI.preview';
  }

  return 'com.nullatnothing.HomeAI';
};

const getAppName = () => {
  if (IS_DEV) {
    return 'HomeAI (Dev)';
  }

  if (IS_PREVIEW) {
    return 'HomeAI (Preview)';
  }

  return 'HomeAI';
};
