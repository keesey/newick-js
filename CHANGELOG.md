# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/en/1.0.0/) and this project adheres to [Semantic Versioning](http://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

### Changed

### Deprecated

### Fixed

### Removed

### Security

## [1.2.1] - 2023-06-20

### Fixed

-   Distribution files were missing.

## [1.2.0] - 2023-06-20

### Added

-   Ability to write root weights.
-   Example JavaScript file.

## [1.1.4] - 2023-06-20

### Changed

-   Upgraded all development dependencies (where available).

## [1.1.3] - 2023-03-19

### Security

-   `minimatch` upgrade.

## [1.1.2] - 2023-03-19

### Security

-   Dependency upgrades.

## [1.1.1] - 2019-08-24

### Fixed

-   Some TypeScript declarations were missing from `dist/src`.

## [1.1.0] - 2018-05-02

### Added

-   A way to import `parse()` and `write()` separately.

### Changed

-   Multiple source files.

## [1.0.6] - 2017-03-30

### Changed

-   Minor optimizations to `parse()`.

## [1.0.5] - 2017-03-25

### Added

-   Parse results also return root node's weight.
-   Validation for `write()`, with tests.
-   Errors when Newick tree ends before string does.

### Changed

-   Preserving extra spaces within vertex labels.
-   No longer trimming input to `parse()`. (Leaving that up to the user.)

## [1.0.4] - 2017-03-24

### Changed

-   Refactored and optimized `write()`.

## [1.0.3] - 2017-03-24

### Changed

-   Slight changes to vertex sorting.

## [1.0.2] - 2017-03-24

### Changed

-   Optimized vertex sorting when writing.

### Fixed

-   Bugs with reading and writing quoted names.

## [1.0.1] - 2017-03-24

### Fixed

-   Nondeterministic behavior for writing graphs with multiple incoming arcs.

## [1.0.0] - 2017-03-24

### Added

-   Initial version.
