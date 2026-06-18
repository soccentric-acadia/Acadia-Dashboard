@AGENTS.md

# Local Do/Don't

## Do
- After fixing the ESLint baseline (issue #40 / PR #41), the §9a validation gate
  is `make build && make lint && npx tsc --noEmit` for this repo. `make test`
  is broken until issue #24 is fixed — don't rely on it.
- For "setState in useEffect for run-reset" patterns: useEffect is the correct
  primitive. Add an `// eslint-disable-next-line react-hooks/set-state-in-effect`
  comment adjacent to the first setState, with a comment explaining why
  (external change → reset internal state, not derive).
- For stream-loop accumulator mutations: use a local `const accumulatedRef = { current: "" }`
  object instead of a captured `let accumulated = ""`. Snapshot `.current` into
  the setState functional updater. This sidesteps `react-hooks/immutability`.
- Use `gh issue create --body-file` for any body containing backticks (per
  root-tier `project-managers/CLAUDE.md` "Backticks in gh issue create bodies").
- This repo's label set is minimal (bug, documentation, duplicate, enhancement,
  good first issue, help wanted, invalid, question, wontfix). Don't add
  category labels like `concurrency`, `a11y`, etc. — they don't exist and
  filing fails. Just `--label bug`.
- This repo has no `in-progress` label. Use `gh issue comment` to mark "Started"
  instead of `gh issue edit --add-label "in-progress"`.

## Don't
- Don't `cd webui && npm test` — there's no `test` script in package.json. Use
  `npx vitest` if Vitest is installed, otherwise skip the test step until #24
  is fixed.
- Don't `npm run type-check` — there's no such script. Use `npx tsc --noEmit`.
- Don't assume `gh issue edit --add-label "in-progress"` works here.
- Don't try to push directly to `develop`. Always go through a branch + PR.
