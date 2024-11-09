// @ts-check
import url from 'url';
import path from 'path';
import tslint from 'typescript-eslint';
import prettierConfig from 'eslint-config-prettier';
import prettierPlugin from 'eslint-plugin-prettier';

const tsConfigs = {
  root: path.join(url.fileURLToPath(import.meta.url), '../tsconfig.json'),
  utils: path.join(
    url.fileURLToPath(import.meta.url),
    '../include/utils.tsconfig.json'
  )
};

const [tsConfig] = tslint.config({
  plugins: {
    '@typescript-eslint': tslint.plugin
  },
  rules: {
    'max-classes-per-file': ['error', 1],
    'no-constant-condition': 'error',
    '@typescript-eslint/no-floating-promises': 'error',
    '@typescript-eslint/await-thenable': 'error',
    '@typescript-eslint/ban-ts-comment': 'error',
    // '@typescript-eslint/no-empty-object-type': 'error',
    '@typescript-eslint/class-literal-property-style': 'error',
    '@typescript-eslint/consistent-generic-constructors': [
      'error',
      'type-annotation'
    ],
    '@typescript-eslint/consistent-indexed-object-style': [
      'error',
      'index-signature'
    ],
    '@typescript-eslint/no-unused-vars': [
      'error',
      {
        varsIgnorePattern: '^_'
      }
    ],
    '@typescript-eslint/consistent-type-assertions': [
      'error',
      {
        assertionStyle: 'as',
        objectLiteralTypeAssertions: 'never'
      }
    ],
    '@typescript-eslint/consistent-type-definitions': ['error', 'interface'],
    '@typescript-eslint/consistent-type-exports': 'error',
    '@typescript-eslint/consistent-type-imports': [
      'error',
      {
        prefer: 'type-imports',
        disallowTypeAnnotations: true
      }
    ],
    '@typescript-eslint/no-this-alias': 'off',
    '@typescript-eslint/default-param-last': 'error',
    '@typescript-eslint/no-non-null-assertion': 'off',
    '@typescript-eslint/explicit-member-accessibility': 'error',
    '@typescript-eslint/explicit-function-return-type': [
      'error',
      {
        allowedNames: ['default', 'collection']
      }
    ],
    '@typescript-eslint/member-ordering': [
      'error',
      {
        default: {
          order: 'alphabetically'
        }
      }
    ],
    '@typescript-eslint/no-explicit-any': 'off'
  }
});

export default tslint.config(
  {
    ...tsConfig,
    languageOptions: {
      parser: tslint.parser,
      parserOptions: {
        project: tsConfigs.utils,
        tsconfigRootDir: path.dirname(tsConfigs.root)
      }
    },
    files: ['utils/**/*.ts']
  },
  {
    ...tsConfig,
    languageOptions: {
      parser: tslint.parser,
      parserOptions: {
        project: tsConfigs.root,
        tsconfigRootDir: path.dirname(tsConfigs.root)
      }
    },
    files: ['src/**/*.ts']
  },
  {
    ...prettierConfig,
    plugins: {
      prettier: prettierPlugin
    },
    rules: {
      'prettier/prettier': ['error']
    }
  },
  {
    rules: {
      '@typescript-eslint/consistent-type-exports': 'off'
    },
    files: ['src/**/index.ts']
  }
);
