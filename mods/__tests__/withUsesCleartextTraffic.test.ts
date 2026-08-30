import fs from "fs";
import path from "path";
import withUsesCleartextTraffic from "../withUsesCleartextTraffic";

jest.mock("expo/config-plugins", () => ({
  withDangerousMod: (config: any, action: any) => action[1](config),
  withAndroidManifest: (config: any, action: any) => action(config),
}));

describe("withUsesCleartextTraffic", () => {
  beforeEach(() => {
    jest.spyOn(fs, "mkdirSync").mockImplementation(() => undefined as any);
    jest.spyOn(fs, "writeFileSync").mockImplementation(() => undefined as any);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("writes the network security config", async () => {
    const config: any = {
      modRequest: { projectRoot: "/app" },
      modResults: { manifest: { application: [{ $: {} }] } },
    };

    const result = await withUsesCleartextTraffic(config, {
      ips: ["10.0.2.2"],
    });

    expect(fs.mkdirSync).toHaveBeenCalledWith(
      path.join("/app", "android", "app", "src", "main", "res", "xml"),
      { recursive: true },
    );
    expect(fs.writeFileSync).toHaveBeenCalledWith(
      path.join(
        "/app",
        "android",
        "app",
        "src",
        "main",
        "res",
        "xml",
        "network_security_config.xml",
      ),
      expect.stringContaining(
        '<domain includeSubdomains="true">10.0.2.2</domain>',
      ),
      "utf8",
    );
    expect(result).toBe(config);
  });
});
