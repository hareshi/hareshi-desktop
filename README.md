### Committing Guide

[Commit Messages](https://raw.githack.com/jaywcjlove/changelog-generator/dadc68a/index.html#getting-started)

### Build for test

output folder `.out/make`<br>
_`Hareshi-win32-x64` `Hareshi-linux-x64` `Hareshi-darwin-x64`_<br>

**Windows example**

-   install `.out/make/squirrel.windows/x64/Hareshi-X.X.X Setup.exe` _(recommend)_
-   Portable `.out/Hareshi-win32-x64/hareshi.exe` _(starting error update)_

## Development

```
# install dependencies
yarn install

# run app (dev mode)
yarn run start

# build app
yarn run build # build-pr or make
```

**if build error try this (install build tools)**

-   `npm install --global windows-build-tools` or `yarn global add windows-build-tools`
