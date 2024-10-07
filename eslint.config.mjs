import antfu from '@antfu/eslint-config';

console.log('antfu', antfu);

export default antfu(
  {
    ignores: [],
  },
  {
    rules: {
      'import/order': 'off',
      'style/semi': 'off',
      'antfu/if-newline': 'off',
      'style/comma-dangle': 'off',
      'style/member-delimiter-style': 'off',
      'semi': ['error', 'always'],
      'no-alert': 'off',
    },
  },
);
