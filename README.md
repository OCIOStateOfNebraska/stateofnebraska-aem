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


## EDS Index Configurations
- Index configurations have been moved to the [configuration service](https://www.aem.live/docs/config-service-setup) in order to allow different configurations per site.
- Current configurations are versioned in ./helix-configs/index, with each site's yaml configuration defined.
- Deployment of configurations is done manually via the [configuration service api](https://www.aem.live/docs/admin.html#tag/indexConfig/operation/updateIndexConfig).


## Node Version
This project requires Node.js 22.

## Installation

```sh
npm i
```

## Local Development
_Note that this will run a watcher for both SASS and AEM changes_
```sh
npm run dev
```

### AEM Development
If you don't want to make any style updates, and are only touching JS files, the following will run a watcher for just those AEM changes.

```sh
aem up
```

## Linting
Note that linting must pass before committing changes, otherwise the automated build will fail.

```sh
npm run lint
```

## Compile Just SASS

```sh
npm run sass
```

## Local development
1. Create .env file with the following content: AEM_PAGES_URL=https://main--stateofnebraska-aem--ociostateofnebraska.aem.page (where the url the env where you want to pull the content from)
1. Install the [AEM CLI](https://github.com/adobe/helix-cli): `npm install -g @adobe/aem-cli`
1. Start AEM Proxy: `aem up` (opens your browser at `http://localhost:3000`)



