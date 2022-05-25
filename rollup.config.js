import typescriptPlugin from "@rollup/plugin-typescript";

export default ["client", "server"].map((name) => ({
  input: `src/${name}.ts`,
  output: {
    name,
    file: `public/${name}.js`,
    format: name === "server" ? "cjs" : "es",
    sourcemap: false,
  },
  plugins: [typescriptPlugin()],
}));
