# Contributing to OSUI

We welcome contributions to OSUI! Whether it's reporting bugs, suggesting features, improving documentation, or submitting code, your help is valuable. This guide outlines the process for contributing.

## How to Contribute

1.  **Report Bugs**: If you find a bug, please open an issue on the [GitHub repository](https://github.com/osui-rs/osui/issues). Provide a clear description of the bug, steps to reproduce it, and your environment (OS, Rust version, terminal emulator).
2.  **Suggest Features**: Have an idea for a new feature or improvement? Open an issue on GitHub to discuss it.
3.  **Improve Documentation**: Spotted a typo, unclear explanation, or missing example? Feel free to submit a pull request with your changes, or open an issue.
4.  **Submit Code (Pull Requests)**: If you'd like to contribute code, follow the guidelines below.

## Code Contribution Guidelines

1.  **Fork the Repository**: Start by forking the [OSUI GitHub repository](https://github.com/osui-rs/osui).
2.  **Clone Your Fork**:
    ```bash
    git clone https://github.com/your-username/osui.git
    cd osui
    ```
3.  **Create a New Branch**: Create a descriptive branch for your changes.
    ```bash
    git checkout -b feature/my-new-feature
    # or
    git checkout -b bugfix/fix-some-bug
    ```
4.  **Make Your Changes**:
    *   **Code Style**: Adhere to the existing Rust code style. Run `cargo fmt` before committing.
    *   **Clippy**: Ensure your code passes Clippy lints: `cargo clippy --all-targets --all-features -- -D warnings`.
    *   **Tests**: If you're adding new functionality, please include unit tests. If fixing a bug, consider adding a regression test.
    *   **Documentation**: Update relevant documentation (API reference, guides) for any new features or changes. Add comments to your code where necessary.
    *   **Examples/Demos**: If your feature adds significant new functionality, consider adding a small example to the `src/demos` directory.
5.  **Commit Your Changes**: Write clear, concise commit messages.
    ```bash
    git commit -m "feat: Add new awesome feature"
    ```
6.  **Push to Your Fork**:
    ```bash
    git push origin feature/my-new-feature
    ```
7.  **Open a Pull Request**:
    *   Go to the [OSUI repository on GitHub](https://github.com/osui-rs/osui).
    *   You should see a prompt to open a pull request from your recently pushed branch.
    *   Provide a clear title and description for your pull request. Explain what problem it solves and how.
    *   Reference any related issues (e.g., `Fixes #123`, `Closes #456`).
8.  **Review Process**:
    *   Project maintainers will review your pull request.
    *   Be prepared to address feedback and make further changes if requested.
    *   Once approved, your changes will be merged into the `master` branch.

## Development Environment Setup

*   **Rust Toolchain**: Make sure you have a recent stable Rust toolchain installed.
    ```bash
    rustup update
    ```
*   **Dependencies**: Ensure all project dependencies are installed by running `cargo build`.
*   **Testing**: Run tests with `cargo test`.
*   **Linting**: Use `cargo clippy --all-targets --all-features -- -D warnings` to check for common code issues.
*   **Formatting**: Use `cargo fmt` to automatically format your code according to Rust's standard style.

Thank you for considering contributing to OSUI! Your efforts help make this project better for everyone.

[**Return to Overview**](../intro/overview.md)

