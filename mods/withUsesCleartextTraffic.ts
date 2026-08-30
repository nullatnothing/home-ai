import {
  ConfigPlugin,
  withAndroidManifest,
  withDangerousMod,
} from "expo/config-plugins";
import fs from "fs";
import path from "path";

function createNetworkSecurityConfig(ips: string[]): string {
  const ipDomains = ips
    .map((ip) => `<domain includeSubdomains="true">${ip}</domain>`)
    .join("\n  ");
  return `<?xml version="1.0" encoding="utf-8"?>
<network-security-config>
  <domain-config cleartextTrafficPermitted="false">
    <domain includeSubdomains="true">app.modocu.com</domain>
  </domain-config>
  <domain-config cleartextTrafficPermitted="true">
    <domain includeSubdomains="true">localhost</domain>
    ${ipDomains}
  </domain-config>
</network-security-config>`;
}

const withUsesCleartextTraffic: ConfigPlugin<{ ips: string[] }> = (
  config,
  { ips = [] },
) => {
  config = withDangerousMod(config, [
    "android",
    async (config) => {
      const projectRoot = config.modRequest.projectRoot;
      const dest = path.join(
        projectRoot,
        "android",
        "app",
        "src",
        "main",
        "res",
        "xml",
        "network_security_config.xml",
      );
      const networkSecurityConfig = createNetworkSecurityConfig(ips);
      fs.mkdirSync(path.dirname(dest), { recursive: true });
      fs.writeFileSync(dest, networkSecurityConfig, "utf8");
      return config;
    },
  ]);

  return withAndroidManifest(config, (config) => {
    const mainApplication = config?.modResults?.manifest?.application?.[0];

    if (mainApplication) {
      mainApplication.$["android:usesCleartextTraffic"] = "true";
      mainApplication.$["android:networkSecurityConfig"] =
        "@xml/network_security_config";
    }

    return config;
  });
};

export default withUsesCleartextTraffic;
