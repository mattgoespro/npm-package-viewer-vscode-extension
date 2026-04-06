import * as assert from "assert";
import {
  extractModuleSpecifier,
  extractPackageFromLine,
} from "../../src/parsers/moduleExtractor";

suite("moduleExtractor", () => {
  suite("extractModuleSpecifier", () => {
    // ESM static imports
    test("ESM default import", () => {
      assert.strictEqual(
        extractModuleSpecifier('import lodash from "lodash"'),
        "lodash",
      );
    });

    test("ESM named import", () => {
      assert.strictEqual(
        extractModuleSpecifier('import { useState } from "react"'),
        "react",
      );
    });

    test("ESM namespace import", () => {
      assert.strictEqual(
        extractModuleSpecifier("import * as fs from 'node:fs'"),
        "node:fs",
      );
    });

    test("ESM side-effect import", () => {
      assert.strictEqual(
        extractModuleSpecifier('import "reflect-metadata"'),
        "reflect-metadata",
      );
    });

    test("ESM type import", () => {
      assert.strictEqual(
        extractModuleSpecifier('import type { FC } from "react"'),
        "react",
      );
    });

    test("ESM import with single quotes", () => {
      assert.strictEqual(
        extractModuleSpecifier("import express from 'express'"),
        "express",
      );
    });

    // ESM dynamic imports
    test("ESM dynamic import", () => {
      assert.strictEqual(
        extractModuleSpecifier('const m = import("chalk")'),
        "chalk",
      );
    });

    test("ESM dynamic import with await", () => {
      assert.strictEqual(
        extractModuleSpecifier('const m = await import("chalk")'),
        "chalk",
      );
    });

    // CommonJS require
    test("CommonJS require with double quotes", () => {
      assert.strictEqual(
        extractModuleSpecifier('const fs = require("fs")'),
        "fs",
      );
    });

    test("CommonJS require with single quotes", () => {
      assert.strictEqual(
        extractModuleSpecifier("const express = require('express')"),
        "express",
      );
    });

    test("CommonJS destructured require", () => {
      assert.strictEqual(
        extractModuleSpecifier('const { join } = require("path")'),
        "path",
      );
    });

    // Re-exports
    test("named re-export", () => {
      assert.strictEqual(
        extractModuleSpecifier('export { foo } from "bar"'),
        "bar",
      );
    });

    test("wildcard re-export", () => {
      assert.strictEqual(
        extractModuleSpecifier("export * from 'utils'"),
        "utils",
      );
    });

    test("re-export with rename", () => {
      assert.strictEqual(
        extractModuleSpecifier('export { default as myLib } from "my-lib"'),
        "my-lib",
      );
    });

    // Scoped packages
    test("scoped package import", () => {
      assert.strictEqual(
        extractModuleSpecifier('import { Component } from "@angular/core"'),
        "@angular/core",
      );
    });

    // Deep imports
    test("deep import path", () => {
      assert.strictEqual(
        extractModuleSpecifier('import fp from "lodash/fp"'),
        "lodash/fp",
      );
    });

    test("scoped deep import path", () => {
      assert.strictEqual(
        extractModuleSpecifier(
          'import { testing } from "@angular/core/testing"',
        ),
        "@angular/core/testing",
      );
    });

    // Relative imports
    test("relative import with ./", () => {
      assert.strictEqual(
        extractModuleSpecifier('import { T } from "./utils"'),
        "./utils",
      );
    });

    test("relative import with ../", () => {
      assert.strictEqual(
        extractModuleSpecifier('import config from "../config"'),
        "../config",
      );
    });

    // Node built-in with prefix
    test("node: prefixed import", () => {
      assert.strictEqual(
        extractModuleSpecifier('import path from "node:path"'),
        "node:path",
      );
    });

    // No import on line
    test("returns null for plain code", () => {
      assert.strictEqual(
        extractModuleSpecifier("const x = 42;"),
        null,
      );
    });

    test("returns null for empty line", () => {
      assert.strictEqual(extractModuleSpecifier(""), null);
    });

    test("returns null for comment", () => {
      assert.strictEqual(
        extractModuleSpecifier('// import foo from "bar"'),
        null,
      );
    });
  });

  suite("extractPackageFromLine", () => {
    test("extracts top-level unscoped package from deep path", () => {
      const result = extractPackageFromLine('import fp from "lodash/fp"');
      assert.ok(result);
      assert.strictEqual(result.rawSpecifier, "lodash/fp");
      assert.strictEqual(result.packageName, "lodash");
    });

    test("extracts scoped package from deep path", () => {
      const result = extractPackageFromLine(
        'import { x } from "@angular/core/testing"',
      );
      assert.ok(result);
      assert.strictEqual(result.rawSpecifier, "@angular/core/testing");
      assert.strictEqual(result.packageName, "@angular/core");
    });

    test("extracts simple package name", () => {
      const result = extractPackageFromLine('import express from "express"');
      assert.ok(result);
      assert.strictEqual(result.rawSpecifier, "express");
      assert.strictEqual(result.packageName, "express");
    });

    test("returns null for no import", () => {
      const result = extractPackageFromLine("const x = 42;");
      assert.strictEqual(result, null);
    });
  });
});
