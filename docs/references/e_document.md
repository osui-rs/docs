---
title: Document
---

The `Document` holds the root element and it renders and passes events to the `Element`. It's important for updating the UI.

## Example
```rust
fn(_, _, document) {
    if let Some(my_text) = document.get_element_by_id::<Text>("my_text") {
        my_text.children.set_text("Updated!");
    }
}
```

## Methods
### `exit()`
Exits the program
### `restart()`
Restarts the program
### `get_element_by_id<T>(id: &str) -> Option<&mut Box<T>>`
Retrieves a mutable reference to a boxed element of type T by its string identifier, returning None if no such element exists.
> :::info Please make sure that the type of the element is correctly matched to the element of that id
### `get_element_by_id_raw(id: &str) -> Option<&mut Element>`
> :::warn Not recommended to use this function, Use `get_element_by_id` instead
Retrieves a mutable reference to a boxed element by its string identifier, returning None if no such element exists
### `render()`
Renders/reloads the screen, useful when a element updates