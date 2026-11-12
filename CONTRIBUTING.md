# Help improve Jones IT Zendesk Helper

## Report something that went wrong

Staff reports belong in [Internal Tools: problems and fixes](https://app.notion.com/p/41618a28418d8148b816ec7c3bd7d641). The board supports screenshots, ownership, status and minutes spent. The reporting form is still a closed draft; use your usual company channel to contact Forest until its questions and company-only sharing are checked.

A useful report answers four questions:

1. What were you trying to do?
2. What happened, and what did you expect?
3. How can we make it happen again?
4. Which extension version and theme were you using? Add a screenshot if it helps.

Keep customer messages, screenshots, ticket exports and credentials in approved company systems. This GitHub repository, its issues and its pull requests are public. Describe public issues with made-up examples and remove identifying details from images.

## Submit a code fix

1. Fork the repository and make a branch for one problem.
2. Read [the code tour](docs/CODE_TOUR.md) and [development guide](docs/DEVELOPMENT.md). Run `npm ci --ignore-scripts` to install development tools.
3. Make the change and run `npm run format:check` and `npm run check`. Check changed behavior in Chrome with a synthetic ticket or your own authorized test ticket. Do not send messages or save someone else’s ticket to test a fix.
4. Add a short entry under **Unreleased** in [CHANGELOG.md](CHANGELOG.md). Update the feature guide if behavior changes.
5. Open a pull request explaining the problem, the changed behavior and what you tested. Use a sanitized example; keep private report links out of a public PR.

Forest reviews fixes before merging. A merged fix can wait for the next version; it is not released to Chrome users until the Store update is approved. The maintainer coordinates the version bump and release tag.

## Follow a fix

The internal board should track **New → Planned → Fixing → Testing → Released**. Released means the fix is available in the Chrome Web Store. A commit, green check or GitHub draft release alone does not mean it is available to users.

Release instructions are in [the tagged-release guide](docs/release/TAGGED_RELEASES.md).
