---
title: Engine
slug: /engine
---

The OSUI engine is what goes on under the hood. You might need this on special ocasions (Game engine, Custom animation, Physics, etc) because it's easier to manipulate. Here's an example of an element moving with a velocity of 50:

```rust
use osui::prelude::*;

fn main() -> Result<()> {
    let mut con = console::init(true)?;
    let velocity = 50;
    let mut position = use_state(0);

    loop {
        con.draw(app(*position), None)?;
        std::thread::sleep(std::time::Duration::from_millis(1000 / velocity));
        position += 1;
        if position + 13 > con.size().0 {
            break;
        }
    }

    con.end()
}

pub fn app(pos: u16) -> Element {
    std::sync::Arc::new(move |frame, _event| -> Result<()> {
        frame.draw(
            &"Hello, World!",
            Area {
                x: Pos::Num(pos),
                ..Default::default()
            },
        )?;
        Ok(())
    })
}
```
