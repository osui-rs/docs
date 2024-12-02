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
```rust title='src/main.rs'
use osui::prelude::*;

fn main() {
    launch!(app());
}

fn app() -> Element {
    rsx! {
        // Create a button with a on_click handler
        button {
            on_click: fn(btn: &mut Button, _, document) {
                let count = document.use_state::<u32>("count");
                *count += 1;
                btn.children.set_text(&count.to_string());
            },

            "0"
        }

        // Create a elemental field
        @count: u32;
    }
}
```