# Changelog

## [1.1.0](https://github.com/fx/mcp-node-red/compare/mcp-node-red-v1.0.1...mcp-node-red-v1.1.0) (2026-02-17)


### Features

* add delete_flow tool and API coverage spec ([#1](https://github.com/fx/mcp-node-red/issues/1)) ([4bccdf3](https://github.com/fx/mcp-node-red/commit/4bccdf33724bdb92b2eb60b17408942bb2eb8b29))
* add dotenv support for .env and .env.local files ([#10](https://github.com/fx/mcp-node-red/issues/10)) ([cb23353](https://github.com/fx/mcp-node-red/commit/cb233535ca6e86c23e46617e8f9ffcdbd04fb7f0))
* add flow state tools (get_flow_state, set_flow_state) ([#2](https://github.com/fx/mcp-node-red/issues/2)) ([cf4b108](https://github.com/fx/mcp-node-red/commit/cf4b1082bc2483ff9ebcb0f3b016a29aec35cb7a))
* add MCP server for Node-RED workflow management ([4330d3a](https://github.com/fx/mcp-node-red/commit/4330d3a84f4341b000e12859d02da0604d0cf4bf))
* add semantic-release for automated releases ([654965d](https://github.com/fx/mcp-node-red/commit/654965d940b859d784d753172f7f6f57a08bc18c))
* **context:** add get_context and delete_context tools ([#3](https://github.com/fx/mcp-node-red/issues/3)) ([9da4888](https://github.com/fx/mcp-node-red/commit/9da4888f2a469d4b8f96c9794a8840a75aeb2bf9))
* initial commit from template ([5ef23d6](https://github.com/fx/mcp-node-red/commit/5ef23d6ea3b7584c9116a1de1263e4f937e3b2c4))
* **nodes:** add node module management tools ([#4](https://github.com/fx/mcp-node-red/issues/4)) ([bbd3376](https://github.com/fx/mcp-node-red/commit/bbd3376a115c938e9f28a63cbb29b777557e8ec7))
* **runtime:** add get_settings and get_diagnostics tools ([#5](https://github.com/fx/mcp-node-red/issues/5)) ([e58b564](https://github.com/fx/mcp-node-red/commit/e58b5641af52aa817f6828268d537f3c682040b7))
* **tools:** add trigger_inject and set_debug_state tools ([#6](https://github.com/fx/mcp-node-red/issues/6)) ([8b2f51a](https://github.com/fx/mcp-node-red/commit/8b2f51a409553875c6c0fe3b38f75ade81998147))


### Bug Fixes

* clean up release pipeline and npm package contents ([5869433](https://github.com/fx/mcp-node-red/commit/58694339c1d624b8c7fb2e9ce9a2fdb92472e5cf))
* correct Node-RED API response handling for v4.1.5 ([#11](https://github.com/fx/mcp-node-red/issues/11)) ([eff418b](https://github.com/fx/mcp-node-red/commit/eff418bed18b5da754b1011e6a40a25b7d9bc950))
* ensure dist/index.js is executable in npm package ([9d95bca](https://github.com/fx/mcp-node-red/commit/9d95bca133b17a98c81834470e45f19b20be1555))


### Documentation

* improve installation with claude mcp commands and collapse sections ([5edf6ff](https://github.com/fx/mcp-node-red/commit/5edf6ff55c0526f941b53f0e8cefb2bccfb930c4))
* reorganize README and move dev docs to docs/ ([29d8575](https://github.com/fx/mcp-node-red/commit/29d857568368fdd1f55457bba448906076981ba3))
* update all documentation for 17 MCP tools ([#7](https://github.com/fx/mcp-node-red/issues/7)) ([67e5c2c](https://github.com/fx/mcp-node-red/commit/67e5c2ce345c77892c793320c5617b4645c68d24))


### Miscellaneous

* add husky pre-commit hooks with lint-staged ([cbdc6f1](https://github.com/fx/mcp-node-red/commit/cbdc6f15db4dbfb5ff72f0fcd7c8e12b5a9f3064))
* format code ([c09882f](https://github.com/fx/mcp-node-red/commit/c09882f98dce5486c8301aa62f78bc37975d0026))
* format package.json ([424b6a9](https://github.com/fx/mcp-node-red/commit/424b6a91d2971bcc2fd0e599bd2d96b056862305))
* **release:** 1.0.0 [skip ci] ([7d8cf9d](https://github.com/fx/mcp-node-red/commit/7d8cf9dcf2b9dc8671ad28d60a15e812a2ad3214))
* **release:** 1.0.1 [skip ci] ([8ab070f](https://github.com/fx/mcp-node-red/commit/8ab070f2c6ac71ad799b718e4c4e07041d7ddb5c))
* rename to mcp-node-red and add CI/CD workflows ([80ca66a](https://github.com/fx/mcp-node-red/commit/80ca66a1d818f428e1a8f5df905ad388bd34d406))
* switch from semantic-release to release-please ([#8](https://github.com/fx/mcp-node-red/issues/8)) ([6bd24b2](https://github.com/fx/mcp-node-red/commit/6bd24b2ae3236d550daf414131fdddba4fd0df16))

## [1.0.1](https://github.com/fx/mcp-node-red/compare/v1.0.0...v1.0.1) (2025-10-08)


### Bug Fixes

* ensure dist/index.js is executable in npm package ([9d95bca](https://github.com/fx/mcp-node-red/commit/9d95bca133b17a98c81834470e45f19b20be1555))

## 1.0.0 (2025-10-08)


### Features

* add MCP server for Node-RED workflow management ([4330d3a](https://github.com/fx/mcp-node-red/commit/4330d3a84f4341b000e12859d02da0604d0cf4bf))
* add semantic-release for automated releases ([654965d](https://github.com/fx/mcp-node-red/commit/654965d940b859d784d753172f7f6f57a08bc18c))
* initial commit from template ([5ef23d6](https://github.com/fx/mcp-node-red/commit/5ef23d6ea3b7584c9116a1de1263e4f937e3b2c4))
