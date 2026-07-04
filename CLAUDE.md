# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository state

This repository is currently empty of source code. The only tracked file is
`README.md`, which contains placeholder text (`claude.md` / `review.md`) rather
than real project documentation. There is no package manifest, build system,
linter, test runner, or application code yet — so there are no build/lint/test
commands to document and no architecture to describe.

## Working here

- Before assuming any framework, language, or tooling, check what actually
  exists in the repo (`git ls-files`, look for a manifest such as
  `package.json`, `pyproject.toml`, `go.mod`, etc.). Do not invent commands or
  structure that aren't backed by real files.
- Once real code is added, update this file to reflect the actual build/lint/
  test commands and the high-level architecture, replacing this placeholder
  section.
