---
title: Extensions
slug: /extensions
---

OSUI Extensions are a practical way to extend the possibilities with OSUI, Extensions allow for there to be a specific use or functionality that may otherwise be bloat or the opposite behavior of the use case.

### `screen.extension(&mut self, ext: E)`
You likely noticed that we used this function in the [Hello World App With Velocity](/docs/next/#hello-world-app-with-velocity) example, this function simply allows for structures implementing [Extension](/docs/next/extensions#trait-extension) to be included in the program.

## Trait `Extension`
### `init(&self, _widgets: &Vec<Arc<Widget>>)`
Runs right after the Transform component is applied to every widget.

### `render(&self, _widget: &Arc<Widget>)`
Runs right before the `Element::render` is called.
