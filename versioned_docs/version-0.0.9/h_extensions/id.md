---
title: ID Extension
slug: /extensions/id
---

The `IdExtension` is a utility struct that provides an interface to look up widgets by a numeric ID within a `Screen`. It is implemented as an `Extension` and is built on top of a thread-safe `Arc<Screen>`.

---

## 📦 Usage

```rust
use osui::prelude::*;

fn main() -> std::io::Result<()> {
    let screen = Screen::new();
    let elements = IdExtension::new(screen.clone());
    screen.extension(elements.clone());

    rsx! {
        "Hello, World"
    }
    .draw(&screen);

    std::thread::spawn({
        let elements = elements.clone();
        move || {
            if let Some(widget) = elements.get_element(42) {
                // use widget
            }
        }
    });

    screen.run()
}
```
