import closurePlugin from "@ampproject/rollup-plugin-closure-compiler";
import typescriptPlugin from "@rollup/plugin-typescript";

const CLOSURE_ENABLED = true;
const CLOSURE_LEVEL = "ADVANCED"; // WHITESPACE_ONLY, SIMPLE, ADVANCED
const plugins = [typescriptPlugin()];

if (CLOSURE_ENABLED) {
  plugins.push(
    closurePlugin({
      language_in: "ECMASCRIPT_NEXT",
      language_out: "ECMASCRIPT_2020",
      externs: 'externs.js',
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
