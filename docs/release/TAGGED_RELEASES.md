# Make a release from a version tag

A **tag** is a name attached to one exact Git commit. Pushing `v0.7.7` asks GitHub to package that commit as version `0.7.7`.

The workflow creates a **draft GitHub release** with a store ZIP, a development ZIP and their checksums. It does not submit to Chrome Web Store or deploy the privacy site. No Google credentials are needed for this stage.

## First release

Open the repository's [Actions](https://github.com/forest-jit/zendesk-helper/actions/workflows/release.yml). A successful **Prepare tagged release** run provides the files under **Artifacts** for 14 days. The same files are attached to a draft under [Releases](https://github.com/forest-jit/zendesk-helper/releases), where repository collaborators can review them without the artifact expiry.

Choose the ZIP ending in **store.zip** for your first Chrome Web Store upload. The development ZIP adds optional local-processing tools. The GitHub-generated “Source code” archives are the full repository; do not use them for the store.

A draft is visible to repository collaborators, not ordinary visitors. Clicking **Publish release** makes these downloads public because this repository is public. Publishing a GitHub release does not publish the Chrome extension to the store.

## Next release: five steps

1. **Update the version.** For example, set `manifest.json` to `0.7.8`, then run `npm version 0.7.8 --no-git-tag-version`. npm updates `package.json` and `package-lock.json`. Use the same three-number version everywhere.
2. **Test and document the change.** Run `npm run format:check` and `npm run check`; test changed behavior in Chrome. Update the guide, TASKS.md and CHROMEWEBSTORE.md as relevant. A green automated check is not live UI acceptance.
3. **Review and commit.** Use `git status` and `git diff`. Commit the intended source/version/documentation files. Keep customer data, exports and credentials out of Git.
4. **Push the commit and tag.** From this repository, with the example version:

   ```sh
   git push origin main
   git tag -a v0.7.8 -m "Jones IT Zendesk Helper 0.7.8"
   git push origin v0.7.8
   ```

5. **Open Actions, then Releases.** Wait for **Prepare tagged release** to pass. Review the draft notes and download the matching store ZIP. Existing Web Store owners can upload it to the same store item.

The workflow is `.github/workflows/release.yml`. Normal branch pushes run checks without making release files. The release build has read-only repository access; only the final draft job gets `contents: write` through GitHub's short-lived token. No personal token is stored in the workflow.

## If it fails

- **Version mismatch:** the tag and version files differ. Do not move an existing release tag to different code. Correct the version in a new commit and use a new version/tag.
- **Checks or packaging fail:** open the failed step. If code needs changing, make a new version/tag. Use **Re-run failed jobs** only for a transient failure with unchanged tagged source.
- **Draft already exists:** do not overwrite it automatically. Review its files and provenance; the workflow deliberately refuses to replace an existing release.
- **Cannot see a draft:** sign in with a repository collaborator account. Public visitors cannot see drafts.

## Connect the Chrome Web Store later

Google requires the first item to be created in its dashboard. Once it exists, we can add a separate submission workflow using the store item/publisher IDs and authorized API credentials stored securely in GitHub. The official API supports uploading and submitting later versions for review. This connection is not configured yet.

Chrome automatically distributes approved store updates on its own schedule, subject to organization policy. A local unpacked installation does not turn into the store installation or promise settings/draft migration.

References: [GitHub tag triggers](https://docs.github.com/en/actions/reference/workflows-and-actions/workflow-syntax#onpushbranchestagsbranches-ignoretags-ignore), [draft creation](https://cli.github.com/manual/gh_release_create), [Chrome publishing API](https://developer.chrome.com/docs/webstore/using-api).
