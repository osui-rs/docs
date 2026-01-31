markdown
---
sidebar_position: 3
title: Contributing
---

# Contributing to OSUI

We welcome and appreciate contributions from the community! Whether it's reporting bugs, suggesting features, improving documentation, or submitting code, your help makes OSUI better for everyone.

## How to Contribute

### 1. Report Bugs

If you find a bug, please open an issue on our [GitHub repository](https://github.com/osui-rs/osui/issues). When reporting a bug, please include:

*   A clear and concise description of the bug.
*   Steps to reproduce the behavior.
*   Expected behavior.
*   Actual behavior.
*   Your OSUI version, Rust version, and operating system.
*   Any relevant code snippets or error messages.

### 2. Suggest Features

Have an idea for a new feature or improvement? Feel free to open an issue on GitHub to discuss it. Please provide:

*   A clear and concise description of the proposed feature.
*   Why you think it would be valuable to OSUI.
*   Any potential use cases or examples.

### 3. Improve Documentation

Good documentation is vital for any library. If you find errors, omissions, or areas that could be explained more clearly in our docs, please consider:

*   Opening an issue to point out the specific area.
*   Submitting a pull request with your suggested improvements.

### 4. Contribute Code

If you'd like to contribute code, here's the general workflow:

#### Fork the Repository

First, fork the [osui-rs/osui](https://github.com/osui-rs/osui) repository to your own GitHub account.

#### Clone Your Fork

```bash
git clone https://github.com/YOUR_USERNAME/osui.git
cd osui
```

#### Create a New Branch

Create a new branch for your feature or bug fix. Use a descriptive name:

```bash
git checkout -b feature/my-awesome-feature
# or
git checkout -b bugfix/fix-rendering-issue
```

#### Make Your Changes

*   Write clean, idiomatic Rust code.
*   Follow existing code style and conventions.
*   Add comments where necessary to explain complex logic.
*   **Write Tests**: If you're adding new features or fixing bugs, please include appropriate unit and/or integration tests to cover your changes.
*   **Update Documentation**: If your changes affect the public API or add new functionality, please update the relevant documentation files.

#### Run Tests

Before submitting a pull request, ensure all existing tests pass and your new tests pass:

```bash
cargo test --workspace
```

#### Format and Lint

Make sure your code is formatted correctly and passes lint checks:

```bash
cargo fmt --all
cargo clippy --all-targets --all-features
```

#### Commit Your Changes

Commit your changes with clear and concise commit messages. A good commit message explains *what* changed and *why*.

```bash
git commit -m "feat: Add new awesome feature"
# or
git commit -m "fix: Resolve rendering issue on Windows"
```

#### Push to Your Fork

```bash
git push origin feature/my-awesome-feature
```

#### Create a Pull Request

Go to the [osui-rs/osui](https://github.com/osui-rs/osui) repository on GitHub and open a new pull request.
*   Provide a clear title and description for your pull request.
*   Reference any related issues (e.g., "Fixes #123" or "Closes #456").
*   The project maintainers will review your PR, provide feedback, and work with you to get it merged.

## Code of Conduct

Please note that this project is released with a [Contributor Code of Conduct](https://github.com/osui-rs/osui/blob/main/CODE_OF_CONDUCT.md). By participating in this project, you agree to abide by its terms.

Thank you for considering contributing to OSUI! Your efforts help foster a vibrant and robust TUI ecosystem in Rust.
