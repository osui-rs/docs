# Installation
```bash
cargo add osui
```

# Hello World
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