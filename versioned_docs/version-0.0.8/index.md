---
title: Introduction
slug: /
---

## Installation

On a cargo project run

```bash
cargo add osui
```

## Hello world

```rust title='src/main.rs'
use osui::prelude::*;

fn main() -> Result<()> {
    let mut con = console::init(true)?;

    con.run(app())?;

    con.end()
}

pub fn app() -> Element {
    rsx! {
        "Hello, World!"
    }
}
```

## Counter

```rust title='src/main.rs'
use osui::prelude::*;

fn main() -> Result<()> {
    let mut con = console::init(true)?;

    con.run(app())?;

    con.end()
}

pub fn app() -> Element {
    let count = use_state(0);

    rsx! {
        button { on_click: move |_| count+=1, "{count}" }
    }
}
```
