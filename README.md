# OUTER COLONIES

## 1. Release & Deployment

### 1.1 Deploy server

1. Go to `server` directory
2. Zip all files and directories except the `node_modules` directory
3. Delete all files and directories on target env under `server`
4. Upload zip to the target env under `server`
5. Unzip zip archive on target env
6. Restart outercolonies_server container

### 1.2 Deploy client

1. Go to `client` directory
2. Run `npm run bs` for staging or `npm run bp` for production environment
3. Go to `dist/outercolonies-client`
4. Zip all files and directories
5. Delete all files and directories on target env under `client`
6. Upload zip to the target env under `client`
7. Unzip zip archive on target env

### 1.3 Deploy website

1. Go to `website` directory
2. Run `npm run bs` for staging or `npm run bp` for production environment
3. Go to `dist/outercolonies-website`
4. Zip all files and directories
5. Delete all files and directories on target env under `website`
6. Upload zip to the target env under `website`
7. Unzip zip archive on target env

### 1.4 Create release

1. Create tag via `git tag -a v<x.x.x> -m "<tag description from milestone>"`
2. Push tag via `git push origin v<x.x.x>`
3. Create new [GitHub Release](https://github.com/chrthom/outer-colonies/releases/new), refering to the existing tag

### 1.5 Increment version

Update the version to the next development version in these places:

1. In `website/package.json` under `version`
2. In `website/src/app/app.component.html` in the <span> tag with `id="version"`
3. In `server/package.json` under `version`
4. In `client/package.json` under `version`
5. In `client/src/app/components.indicators/verson_indicator.ts` in the `scene.add.text` method call
