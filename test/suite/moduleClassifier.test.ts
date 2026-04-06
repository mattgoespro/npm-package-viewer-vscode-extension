import * as assert from "assert";
import * as vscode from "vscode";
import { classifyModule } from "../../src/classifiers/moduleClassifier";

suite("moduleClassifier", () => {
  const fakeUri = vscode.Uri.file("/fake/project/src/index.ts");

  test("classifies relative import with ./", () => {
    const result = classifyModule("./utils", "utils", fakeUri);
    assert.strictEqual(result.type, "relative");
  });

  test("classifies relative import with ../", () => {
    const result = classifyModule("../config", "config", fakeUri);
    assert.strictEqual(result.type, "relative");
  });

  test("classifies node: prefixed module as node-builtin", () => {
    const result = classifyModule("node:fs", "fs", fakeUri);
    assert.strictEqual(result.type, "node-builtin");
    assert.strictEqual(result.packageName, "fs");
  });

  test("classifies bare Node.js built-in as node-builtin", () => {
    const result = classifyModule("path", "path", fakeUri);
    assert.strictEqual(result.type, "node-builtin");
  });

  test("classifies npm package", () => {
    const result = classifyModule("express", "express", fakeUri);
    assert.strictEqual(result.type, "npm");
    assert.strictEqual(result.packageName, "express");
  });

  test("classifies scoped npm package", () => {
    const result = classifyModule(
      "@angular/core",
      "@angular/core",
      fakeUri,
    );
    assert.strictEqual(result.type, "npm");
    assert.strictEqual(result.packageName, "@angular/core");
  });

  test("non-npm types include an info message", () => {
    const result = classifyModule("node:crypto", "crypto", fakeUri);
    assert.strictEqual(result.type, "node-builtin");
    assert.ok(result.message);
    assert.ok(result.message!.includes("native Node.js module"));
  });
});
