---
sidebar_position: 1
title: Installation
---

# Installation

To get started with OSUI, you need to add it as a dependency to your Rust project. OSUI is available on [crates.io](https://crates.io/crates/osui).

## Adding OSUI to Your Project

Open your project in your terminal and run this command:

```bash
cargo add osui
```

The `osui` crate re-exports its procedural macros (`#[component]` and `rsx!`) through its `prelude` module, so you typically don't need to add `osui-macros` as a separate dependency.

## Enabling the `rsx` Feature (Recommended)

The `rsx` feature is crucial for using OSUI's declarative UI syntax. It is usually enabled by default when you add `osui` as a dependency. If you ever explicitly disable default features for `osui`, remember to re-enable `rsx`:

```toml
[dependencies]
osui = { version = "0.2.0", features = ["rsx"] }
```

:::info
The `rsx` feature is vital for using OSUI's `rsx!` macro and `#[component]` attribute, which are fundamental to building UIs in OSUI.
:::

## Building Your Project

Once `osui` is added to your `Cargo.toml`, you can build your project using Cargo:

```bash
cargo build
```

This will download and compile OSUI and its dependencies.

You are now ready to start building your first OSUI application! Proceed to the [Getting Started](./02-getting-started.md) guide to write your first "Hello World" component.
