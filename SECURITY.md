# Security policy

## Scope

Puppy Quest 1989 is a static, client-side browser game. It has no account system, backend API, or server-side game state. The main security-relevant areas are the DOM overlays, browser storage, third-party web resources, dependency tooling, and the GitHub Pages deployment.

Only the default branch is treated as the actively maintained version. Older commits and the legacy `DogeQuest-1989` application are not guaranteed to receive fixes.

## Reporting a vulnerability

Please do not open a public issue with exploit details. Use GitHub's private vulnerability reporting form when it is available:

[Report a vulnerability privately](https://github.com/jonbiro/DogeQuest-1989/security/advisories/new)

If private reporting is unavailable, contact the repository maintainer through [the GitHub profile](https://github.com/jonbiro) and share only the minimum information needed to establish a private conversation. Include:

- the affected URL, file, or dependency;
- a concise description of the impact;
- reproducible steps or a minimal proof of concept, if safe to share;
- browser, device, and version information; and
- any suggested mitigation.

Do not access, alter, or disclose another person's browser storage or personal data while validating a report. Do not stress the live GitHub Pages site or submit malicious content through public forms.

## What to expect

Reports will be reviewed privately. Once a fix is available, the maintainer may publish a short advisory or changelog entry that credits the reporter only with permission.
