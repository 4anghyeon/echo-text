import { readFileSync } from 'node:fs';
import typescript from '@rollup/plugin-typescript';

// Read package.json
const pkg = JSON.parse(readFileSync('./package.json', 'utf8'));

export default [
  // ESM and CommonJS build
  {
    input: 'src/index.ts',
    output: [
      {
        file: pkg.main,
        format: 'cjs',
        exports: 'named',
        sourcemap: true,
      },
      {
        file: pkg.module,
        format: 'es',
        exports: 'named',
        sourcemap: true,
      },
    ],
    plugins: [
      typescript({
        tsconfig: './tsconfig.json',
        declaration: true,
        declarationDir: './dist',
      }),
    ],
  },
  // UMD build for browsers
  {
    input: 'src/index.ts',
    output: {
      name: 'EchoText',
      file: pkg.unpkg,
      format: 'umd',
      exports: 'named',
      sourcemap: true,
    },
    plugins: [
      typescript({
        tsconfig: './tsconfig.json',
        declaration: false,
      }),
    ],
  },
];
