# Host the information pages on company GitHub

GitHub stores the source. **GitHub Pages serves the homepage, privacy policy and support page.** Chrome Web Store handles extension installation and automatic updates; Pages does not replace it.

## What you need

- Repository: https://github.com/forest-jit/zendesk-helper (public). You need permission to push or open a pull request, plus admin/maintainer access for Pages configuration.
- A repository administrator/maintainer who can configure Pages. Organization policy must allow Pages and the official GitHub Actions used here.
- A plan that supports Pages for the chosen repository visibility. Public repos can use GitHub Free; private organization repos generally require Team or Enterprise support. Confirm the company's actual plan and policy.
- Approval to publish the information pages and selected contact email. The privacy URL must be accessible without company sign-in for store users/reviewers; a private repository does not guarantee a private website.

No custom domain is required. A normal project URL looks like `https://ORGANIZATION.github.io/REPOSITORY/`. Use the URL GitHub actually reports, especially with Enterprise or a custom domain.

## Publish the prepared pages

1. Review the three pages in `docs/release/site/`, the policy in `docs/release/PRIVACY.md`, and the contact values in `scripts/build_release_site.py`. Confirm who owns the publisher account. Do not push raw ticket exports, audit screenshots, credentials or reviewer access details to a public repository.
2. Push the approved source and `.github/workflows/pages.yml` to the company's repository through its normal review process. The workflow must be on the default branch to appear for manual runs. Do not push this whole dirty checkout without reviewing what is included.
3. In **Settings → Pages → Build and deployment**, choose **GitHub Actions**. An administrator may need to enable Pages/Actions or approve the `github-pages` environment first.
4. In **Actions → Publish extension information pages**, choose **Run workflow** on the approved default branch. The workflow builds and publishes only `index.html`, `src/guide/privacy.html` and `support.html`. It does not deploy the repository, customer evidence, submission notes or extension ZIP.
5. Open the resulting homepage, `/src/guide/privacy.html` and `/support.html` in a signed-out browser. Verify they work over HTTPS without SSO. Add the final URLs to LISTING.md and the store dashboard.

The workflow is manual. A push alone does not publish; after a reviewed policy/site change, run it again. It uses GitHub's Pages environment and short-lived workflow token, not a personal access token. Review the official action versions against your organization's allowlist.

## If the company cannot allow public Pages

Use an approved public documentation host or a separate approved repository containing only the three static pages. You can keep extension source private while publishing those pages. Do not make a private source repository public just to host a privacy policy.

## Source hosting versus releases

Keep development source in the company repo. Use a reviewed store ZIP for Chrome Web Store. Do not run the unpacked development copy and store copy together. Publish extensions through the store review/update process; publishing Pages does not install or update them.

Official instructions checked November 11, 2026: [Create a Pages site](https://docs.github.com/en/pages/getting-started-with-github-pages/creating-a-github-pages-site), [custom Pages workflows](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages), [organization controls](https://docs.github.com/en/organizations/managing-organization-settings/managing-the-publication-of-github-pages-sites-for-your-organization).
