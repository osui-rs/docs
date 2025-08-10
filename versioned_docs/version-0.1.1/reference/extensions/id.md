# `osui::extensions::id`

The `id` module provides a simple way to assign unique identifiers to OSUI widgets and retrieve them later by that ID. This is useful for direct access to specific UI elements for manipulation or querying.

## `Id` (Component)

```rust
component!(Id(pub usize));
```
A tuple struct component that holds a `usize` value, representing a unique identifier for the widget it's attached to.

**Example:**
```rust
use osui::prelude::*;
rsx! {
    @Id(101); // Assign ID 101 to this Div
    Div { "My uniquely identified div" }
}
```

## `IdExtension`

The `IdExtension` provides functionality to look up widgets by their `Id` component.

```rust
pub struct IdExtension(pub Arc<Screen>);
```

### Associated Methods

#### `IdExtension::new(screen: Arc<Screen>) -> Arc<Self>`
Creates a new `IdExtension` instance. It requires an `Arc<Screen>` because it needs to access the screen's list of widgets to perform ID lookups.

**Arguments:**
*   `screen`: An `Arc` to the main `Screen` instance.

**Returns:**
An `Arc<IdExtension>`. It's recommended to store extensions that are queried by other parts of your app in an `Arc` so they can be easily shared.

**Example:**
```rust
use osui::prelude::*;
let screen = Screen::new();
let id_ext = IdExtension::new(screen.clone());
screen.extension(id_ext.clone()); // Register the extension
```

#### `IdExtension::get_element(self: &Arc<IdExtension>, id: usize) -> Option<Arc<Widget>>`
Retrieves an `Arc<Widget>` from the `Screen`'s widget list that has an `Id` component matching the provided `id`.

**Arguments:**
*   `id`: The `usize` identifier to search for.

**Returns:**
`Some(Arc<Widget>)` if a widget with the matching ID is found, `None` otherwise.

**Example:**
```rust
use osui::prelude::*;
let screen = Screen::new();
let id_ext = IdExtension::new(screen.clone());
screen.extension(id_ext.clone());

rsx! {
    @Id(100);
    Div { "Hello, ID 100!" }
}.draw(&screen);

// Later, perhaps in an event handler or another part of your app:
if let Some(widget_100) = id_ext.get_element(100) {
    // You can now interact with widget_100 directly, e.g., get its transform, set components etc.
    // let transform: Transform = widget_100.get().unwrap();
}
```

### `Extension` Trait Implementation

`IdExtension` currently has an empty implementation for the `Extension` trait (`impl Extension for Arc<IdExtension> {}`). This means it doesn't hook into any lifecycle events or event dispatching by default. Its primary purpose is to provide the `get_element` lookup method, which is invoked manually when needed.
