# Contributing

## Development

Requires a current Node.js LTS release and npm.

Use `npm run dev` while coding, `npm test` to run the test suite, and `npm run lint` before pushing changes.

## Release

If `minAppVersion` changes, update `manifest.json` and commit that change first. For each subsequent release, run:

```bash
npm version patch # Or: npm version minor / npm version major
git push --follow-tags
version=$(node -p "require('./package.json').version")
# Wait for the release workflow to finish, then publish its draft:
gh release edit "$version" --draft=false
```

`npm version` updates `package.json`, `manifest.json`, and `versions.json`, then creates the version commit and tag. Pushing the tag triggers GitHub Actions to build the plugin and create the draft release.

Tags must use `x.y.z` without a `v` prefix and match both `manifest.json` and `package.json`.

### First release

The project already starts at `1.0.0`, so create that tag directly instead of running `npm version`:

```bash
version=$(node -p "require('./package.json').version")
git tag -a "$version" -m "$version"
git push --follow-tags
# Wait for the release workflow to finish, then publish its draft:
gh release edit "$version" --draft=false
```

After publishing it, submit a pull request to [obsidianmd/obsidian-releases](https://github.com/obsidianmd/obsidian-releases) adding the plugin to `community-plugins.json`. After acceptance, future updates only require the regular tagged release process above.
