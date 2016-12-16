Change Log
==========

## 3.0.0

- Release

## 3.0.1

- Fixed issue where e.preventDefault() was called on reset events preventing reset functionality. Many additional demos added.

## 3.0.2

- Makes text input searching case-insensive by converting to lowercase before selector generation.

## 3.0.3

- Trims and removes non-alphanumeric characters from text input values before selector generation. Adds text inputs demo.

## 3.1.0

- Integrates with `selectors.controls` configuration option added to MixItUp core 3.1.0 to add specificity to control
selectors and prevent inteference by third-party markup which may share the mandatory control data attributes.