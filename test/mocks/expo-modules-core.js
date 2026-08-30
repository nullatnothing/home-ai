globalThis.expo = globalThis.expo || {};
globalThis.expo.EventEmitter = globalThis.expo.EventEmitter || class EventEmitter {};
globalThis.expo.NativeModule = globalThis.expo.NativeModule || class NativeModule {};
globalThis.expo.SharedObject = globalThis.expo.SharedObject || class SharedObject {};
globalThis.expo.NativeModulesProxy = globalThis.expo.NativeModulesProxy || {};
globalThis.expo.modules = globalThis.expo.modules || {};

const installExpoGlobalPolyfill = () => {
  globalThis.expo = globalThis.expo || {};
  globalThis.expo.modules = globalThis.expo.modules || {};
};

module.exports = {
  NativeModules: {},
  NativeModulesProxy: globalThis.expo.NativeModulesProxy,
  requireNativeModule: () => ({}),
  requireOptionalNativeModule: () => ({}),
  EventEmitter: globalThis.expo.EventEmitter,
  NativeModule: globalThis.expo.NativeModule,
  SharedObject: globalThis.expo.SharedObject,
  installExpoGlobalPolyfill,
};
