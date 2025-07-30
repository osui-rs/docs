---
title: Tick Extension
slug: /extensions/tick
---

The `TickExtension` is a utility struct that calls a TickEvent on every tick from the provided tick rate on a separate thread.

---

## 📦 Usage

```rust
use osui::prelude::*;

fn main() -> std::io::Result<()> {
    let screen = Screen::new();
    screen.extension(TickExtension(20)); // 20 tps

    rsx! {
        @Handler::new(|_, t: &TickEvent| {
            // One second passed
            if t.0 == 20 {
                std::process:exit(0);
            }
        });
        "Hello, World"
    }
    .draw(&screen);

    screen.run()
}
```
