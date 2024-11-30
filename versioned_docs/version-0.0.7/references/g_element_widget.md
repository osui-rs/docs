---
title: ElementWidget
---

`ElementWidget` is a trait that defines the Elements and it's rendering / event updates.

## Methods
### `render(&self, focused: bool) -> Option<RenderResult>`
- **required**
- This function renders the element

### `event(&mut self, event: Event, document: &Document)`
- **optional**
- This function updates the element when there is a event