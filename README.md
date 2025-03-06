# State of Nebraska Sower Design System
Design system based on USWDS

## Environments
- Preview: https://main--stateofnebraska-aem--ociostateofnebraska.aem.page/
- Live: https://main--stateofnebraska-aem--ociostateofnebraska.aem.live/

## Documentation

Before using the aem-boilerplate, we recommand you to go through the documentation on https://www.aem.live/docs/ and more specifically:
1. [Developer Tutorial](https://www.aem.live/developer/tutorial)
2. [The Anatomy of a Project](https://www.aem.live/developer/anatomy-of-a-project)
3. [Web Performance](https://www.aem.live/developer/keeping-it-100)
4. [Markup, Sections, Blocks, and Auto Blocking](https://www.aem.live/developer/markup-sections-blocks)

## Node Version
This project requires Node.js 22.

## Installation

```sh
npm i
```

## Linting

```sh
npm run lint
```

## Compile USWDS
npx gulp compile

## Local development
1. Create .env file with the following content: AEM_PAGES_URL=https://main--stateofnebraska-aem--ociostateofnebraska.aem.page (where the url the env where you want to pull the content from)
1. Install the [AEM CLI](https://github.com/adobe/helix-cli): `npm install -g @adobe/aem-cli`
1. Start AEM Proxy: `aem up` (opens your browser at `http://localhost:3000`)