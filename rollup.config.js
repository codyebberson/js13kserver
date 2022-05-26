import closurePlugin from "@ampproject/rollup-plugin-closure-compiler";
import { nodeResolve } from "@rollup/plugin-node-resolve";
import typescriptPlugin from "@rollup/plugin-typescript";

//
// Configuration
// 
// Use these constants to control the build process.
//

const CLOSURE_ENABLED = false;
const CLOSURE_LEVEL = "ADVANCED"; // WHITESPACE_ONLY, SIMPLE, ADVANCED

const plugins = [
  typescriptPlugin(),
  nodeResolve({
    main: true,
    browser: true,
    preferBuiltins: true,
  }),
];

if (CLOSURE_ENABLED) {
  plugins.push(
    closurePlugin({
      language_in: "ECMASCRIPT_NEXT",
      language_out: "ECMASCRIPT_2020",
      externs: "externs.js",
      compilation_level: CLOSURE_LEVEL,
      strict_mode_input: true,
      summary_detail_level: 3,
    })
  );
}

export default {
  input: "src/index.ts",
  output: {
    file: "public/server.js",
    format: "cjs",
  },
  plugins,
};
