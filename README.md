# OUTER COLONIES

## 1. Release & deployment

### 1.1 Deployment

You need to run the following commands from the outercolonies root directory.
Run `npm run build:staging` for staging or `npm run build:prod` for production build.

#### 1.1.1 Deploy server

1. Delete all files and directories on target env under `server`
2. Upload zip to the target env under `server`
3. Unzip zip archive on target env
4. Restart outercolonies_server container
5. (optional) If dependencies in package.json have changes, reload package.json in target container

#### 1.1.2 Deploy client

1. Delete all files and directories on target env under `client`
2. Upload zip to the target env under `client`
3. Unzip zip archive on target env

### 1.1.3 Deploy website

1. Delete all files and directories on target env under `website`
2. Upload zip to the target env under `website`
3. Unzip zip archive on target env

### 1.2 Release

#### 1.2.1 Create release branch

1. Create branch via `git checkout -b release/<x.x>`
2. Push branch via `git push --set-upstream origin release/<x.x>`

#### 1.2.2 Create tag

1. Create tag via `git tag -a v<x.x.x> -m "<tag description from milestone>"`
2. Push tag via `git push origin v<x.x.x>`
3. Switch back to main branch `git checkout main`

#### 1.2.3 Create release

Create new [GitHub Release](https://github.com/chrthom/outer-colonies/releases/new), refering to the existing tag.

#### 1.2.4 Increment version

1. Run `npm run version`
2. Enter the new version number
3. Enter the new Release name
