import * as assert from "assert";
import * as vscode from "vscode";
import * as path from "path";
import * as fs from "fs";
import * as os from "os";
import {
  isPathAlias,
  clearTsConfigCache,
} from "../../src/classifiers/tsAliasResolver";

suite("tsAliasResolver", () => {
  let tmpDir: string;

  setup(() => {
    clearTsConfigCache();
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "tsalias-test-"));
  });

  teardown(() => {
    clearTsConfigCache();
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  test("returns false when no tsconfig exists", () => {
    const uri = vscode.Uri.file(path.join(tmpDir, "src", "index.ts"));
    assert.strictEqual(isPathAlias("@app/foo", uri), false);
  });

  test("detects path alias from tsconfig", () => {
    const tsconfig = {
      compilerOptions: {
        paths: {
          "@app/*": ["src/app/*"],
          "@utils/*": ["src/utils/*"],
        },
      },
    };
    fs.writeFileSync(
      path.join(tmpDir, "tsconfig.json"),
      JSON.stringify(tsconfig)
    );

    // Create a subdirectory to simulate project structure
    const srcDir = path.join(tmpDir, "src");
    fs.mkdirSync(srcDir, { recursive: true });

    const uri = vscode.Uri.file(path.join(srcDir, "index.ts"));

    assert.strictEqual(isPathAlias("@app/services/auth", uri), true);
    assert.strictEqual(isPathAlias("@utils/helpers", uri), true);
    assert.strictEqual(isPathAlias("express", uri), false);
  });

  test("detects exact alias without wildcard", () => {
    const tsconfig = {
      compilerOptions: {
        paths: {
          "@config": ["src/config/index.ts"],
        },
      },
    };
    fs.writeFileSync(
      path.join(tmpDir, "tsconfig.json"),
      JSON.stringify(tsconfig)
    );

    const uri = vscode.Uri.file(path.join(tmpDir, "src", "index.ts"));
    fs.mkdirSync(path.join(tmpDir, "src"), { recursive: true });

    assert.strictEqual(isPathAlias("@config", uri), true);
    assert.strictEqual(isPathAlias("@config/sub", uri), true);
    assert.strictEqual(isPathAlias("@other", uri), false);
  });

  test("follows extends chain", () => {
    const baseConfig = {
      compilerOptions: {
        paths: {
          "@base/*": ["base/*"],
        },
      },
    };
    const childConfig = {
      extends: "./base.json",
      compilerOptions: {
        paths: {
          "@child/*": ["child/*"],
        },
      },
    };
    fs.writeFileSync(
      path.join(tmpDir, "base.json"),
      JSON.stringify(baseConfig)
    );
    fs.writeFileSync(
      path.join(tmpDir, "tsconfig.json"),
      JSON.stringify(childConfig)
    );

    const uri = vscode.Uri.file(path.join(tmpDir, "index.ts"));

    // Child paths override, but base paths should also be present
    assert.strictEqual(isPathAlias("@child/foo", uri), true);
    assert.strictEqual(isPathAlias("@base/bar", uri), true);
  });
});
