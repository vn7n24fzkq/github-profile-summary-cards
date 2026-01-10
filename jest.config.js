const path = require('path');

module.exports = {
    collectCoverage: true,
    clearMocks: true,
    moduleFileExtensions: ['js', 'ts'],
    transform: {
        '^.+\\.ts$': ['ts-jest', {
            tsconfig: 'tsconfig.test.json'
        }],
        '^.+\\.js$': 'babel-jest' // Ensure JS files in node_modules can be transformed
    },
    setupFilesAfterEnv: [],
    testMatch: ['**/*.test.ts'],
    verbose: true,
    collectCoverageFrom: ['**/*.{ts,jx}', '!**/node_modules/**', '!**/dist/**', '!**/lib/**', '!scripts/**'],
    moduleNameMapper: {
        '^axios$': path.join(__dirname, 'node_modules/axios/dist/node/axios.cjs')
    },
    // Tell Jest to compile d3 and its dependencies (which are ESM)
    transformIgnorePatterns: [
        'node_modules/(?!d3|d3-.*|internmap|delaunator|robust-predicates|axios)'
    ]
};
