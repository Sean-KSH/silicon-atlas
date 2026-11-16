# Contributing

Thank you for helping. Corrections to the physics and to the explanations are the most valuable
contributions; please open a "Physics or content issue" with the module, what looks wrong, and a
reference if you have one. The "Copy link" button in the top bar gives a link that reopens your
exact settings.

## Running the project

Requires Node 20 or newer and pnpm.

```sh
pnpm install
pnpm dev        # http://127.0.0.1:5173
pnpm test       # physics and integration tests
pnpm build      # type check and production build
pnpm format     # format source files
```

## How the code is organized

- Physics lives in `src/<model>.ts`, never in interface files. Kernels use SI units internally
  and convert only at the interface.
- Every kernel has a test file, `src/<model>.test.ts`. Tests compare against analytical limits,
  conservation laws, independent calculations or textbook worked examples.
- Material parameters come only from `src/materials.ts`. Do not repeat constants in a module.
- Lesson text (goals, demos, self-check questions) lives in `src/lessons.ts`.
- Colours are CSS variables in `src/theme-colors.css`; after adding one, run
  `python3 scripts/theme-tokens.py` to generate its light-theme value.

## Changing a model

Any change to an equation, parameter or solver needs:

1. A source for the change (textbook section or paper), recorded in the module's sources panel
   and, if it is a design choice, in `docs/decisions.md`.
2. A test that would fail without the change, and all existing tests passing.
3. Updated assumptions and limits in the module and in `docs/limitations.md`.
4. A fresh validation record: `pnpm validate`.

Interface and wording changes do not need this, but please keep the existing conventions: state
what is held fixed when something changes, label illustrations as illustrations, and keep text at
12 px or larger.
