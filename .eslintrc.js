/* eslint-disable no-undef */
module.exports = {
	root: true,
	extends: 'eslint:recommended',
	env: {
		browser: true,
		'es6': true,
	},
	parser: '@babel/eslint-parser',
	parserOptions: {
		allowImportExportEverywhere: true,
		sourceType: 'module',
		requireConfigFile: false,
	},
	rules: {
		indent: [1, 'tab', { SwitchCase: 1 }],
		'no-undefined': [0],
		'linebreak-style': [1, 'unix'],
		quotes: [1, 'single'],
		semi: [1, 'always'],
		'space-in-parens': [1, 'always'],
		'no-console': [1],
		'no-alert': [1],
		camelcase: [1],
	},
};
