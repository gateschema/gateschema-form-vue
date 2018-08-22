module.exports = {
    "testEnvironment": "node",
    "roots": [
        "./test"
    ],
    "transform": {
      "^.+\\.js$": "babel-jest"
    },
    "testRegex": "(\\.|/)(test|spec)\\.(ts|js)x?$",
    "moduleFileExtensions": [
        "ts",
        "tsx",
        "js",
        "jsx",
        "json",
        "node"
    ],
    "setupFiles": [
        "./test/setup.js"
    ]
}