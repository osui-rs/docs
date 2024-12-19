---
title: Introduction
slug: /
---

## Installation
On a cargo project run
```bash
cargo add osui
```

## Simple app
```rust title='src/main.rs'
use osui::prelude::*;

fn main() {
    launch!(app());
}

fn app() -> Element {
    rsx! {
        text { "Hello, World!" }
    }
}
```

## A slightly more advanced app (counter)
This app uses state management and a function using the state as a dependent
```rust title='src/main.rs'
use osui::prelude::*;

fn main() {
    launch!(app());
}

fn app() -> Element {
    let count = State::new(0);

    rsx! {
        button {
            on_click: fn(_, _, _) @count {
                count += 1;
            },

            "The current count is: {count}"
        }
    }
}
```