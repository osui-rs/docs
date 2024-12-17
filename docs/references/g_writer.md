---
title: Writer
---

The `Writer` is what makes OSUI efficient and it's magic. `Writer` is used on the `Element::render` function. It get's access to the `Style` and gets a absolute position and ansi coloring, Then it prints and adjusts to what is being written.

## Functions
### `write(&mut self, s: &str)`
This function simply writes s to the screen depending on the absolute positioning.
### `new_frame(&mut self) -> Frame`
This function creates a frame depending on the values. Use this you need to render elements.