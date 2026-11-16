# Continuous improvement: apps ⇄ library

The library is the source of truth, but the apps are where components get tested against real screens. Improvements flow
both ways, and the CLI makes each step one command.

```text
   app improves a component ──► sas-ui diff            what drifted from the registry?
                                sas-ui upstream <item> --to <library>/packages/registry/src
                                         │                (project aliases are turned back into the registry's)
                                         ▼
                              library: git diff, pnpm test, review, commit
                                         │
   other apps ◄──────────────  sas-ui diff / sas-ui add <item> --overwrite   (pull the improvement in)
```

## In an app

1. Edit the copy in `src/components/ui/…` freely (you own it).
2. `sas-ui diff <item> --verbose` shows exactly what differs from the registry (imports are compared after alias
   rewriting, so only real edits appear).
3. If the change is generic (a prop, an accessibility fix, a variant), send it upstream:

   ```sh
   sas-ui upstream button select --to ~/code/sas-ui/packages/registry/src --dry-run
   sas-ui upstream button select --to ~/code/sas-ui/packages/registry/src
   ```

   If the change is only your app's look (a height, a colour), keep it in the app — that is what owning the code means.

## In the library

1. `git diff` the files `upstream` wrote, make them generic (no app names or copy), keep defaults backward-compatible
   (new behaviour is opt-in), add or update the test and the docs example.
2. `pnpm check && pnpm build && pnpm e2e:cli`.
3. Commit with a conventional message and a CHANGELOG line.

## Back to the apps

`sas-ui diff` in every app lists what the registry now has that the copy lacks. Take it with
`sas-ui add <item> --overwrite` and re-apply the app's look, or merge by hand when the copy was tailored.

## Rules that keep it healthy

- Defaults of a library component change only with a CHANGELOG entry and a major bump; improvements are opt-in props.
- A tailored copy keeps the library's file name and export names so `diff` and `upstream` keep working.
- Never import Base UI from app code outside `components/ui` (the ERP enforces it with a lint rule).
