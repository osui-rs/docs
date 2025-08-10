# Macros

OSUI provides several declarative macros to simplify common tasks like defining custom events, components, `Transform`s, and UI trees.

## `event!` Macro

Declares a struct that implements the `Event` trait, simplifying event type creation for OSUI's reactive system.

### Variants

*   **`event!(Name)`**: Defines a unit struct named `Name`.
*   **`event!(Name { ... })`**: Defines a named struct with fields.
*   **`event!(Name (...))`**: Defines a tuple struct.

### Usage

```rust
use osui::macros::event; // Import the macro

// Unit struct event
event!(Clicked);

// Named struct event with fields
event!(Resized { width: u32, height: u32 });

// Tuple struct event
event!(Moved(u32, u32));

// Example usage
fn main() {
    let click_event = Clicked;
    let resize_event = Resized { width: 80, height: 24 };
    let move_event = Moved(10, 20);

    // Events can be dispatched and handled
    // (requires an OSUI screen and event context)
}
```

## `component!` Macro

Declares a struct that implements the `Component` trait, reducing boilerplate when defining new data or behavior extensions for widgets.

### Variants

*   **`component!(Name)`**: Defines a unit struct.
*   **`component!(Name { ... })`**: Defines a named struct with fields.
*   **`component!(Name (...))`**: Defines a tuple struct.

### Usage

```rust
use osui::macros::component; // Import the macro

// Unit struct component (e.g., a marker for a property)
component!(Focusable);

// Named struct component (e.g., a tooltip message)
component!(Tooltip { text: String });

// Tuple struct component (e.g., a fixed size)
component!(Size(u32, u32));

// Example usage (assuming a widget instance `my_widget`)
// my_widget.component(Focusable);
// my_widget.component(Tooltip { text: "Hello".to_string() });
// my_widget.component(Size(100, 50));
```

## `event_handler!` Macro

Creates an event handler closure that safely calls a method on a `self` instance. This is particularly useful when you need to register a `'static` event handler that interacts with the current object, often requiring unsafe raw pointers.

### Arguments

*   `$self_ty`: The type of `self` (e.g., `Self` or a specific struct name).
*   `$self`: The instance variable (usually `self`) being used.
*   `$events`: The event source object, which must have an `.on` method (e.g., an `EventHandler` wrapper that allows registering closures). This part is not shown in the source, but it implies such an interface.
*   `$method`: The method on `$self` to call when an event is received.

### Safety

This macro uses `unsafe` code to cast `self` to a raw pointer and dereference it. It is the developer's responsibility to ensure that the `self` reference remains valid for the entire lifetime of the generated closure. Incorrect use can lead to use-after-free or other memory safety issues. Use with extreme caution and only when necessary for `'static` lifetimes.

### Usage (Conceptual Example)

```rust
use osui::prelude::*; // Assuming event_handler! is in prelude or imported

struct MyComponent {
    // ... fields
}

impl MyComponent {
    // A method to be called by the event handler
    fn handle_click(&mut self, _widget: &Arc<Widget>, _event: &Clicked) {
        println!("MyComponent was clicked!");
    }

    fn setup_event_listener(self: &Arc<Self>, some_event_source: &Arc<Widget>) {
        // You'd attach a Handler component to `some_event_source`
        // which then triggers `self.handle_click`
        some_event_source.set_component(Handler::new({
            // This is a conceptual expansion of what event_handler! might do
            let self_ref = Arc::downgrade(self); // Weak reference for safety
            move |widget_arc, event: &Clicked| {
                if let Some(strong_self) = self_ref.upgrade() {
                    // Safe dereference if the component still exists
                    let mut_self = Arc::get_mut(&mut strong_self).unwrap(); // Requires Arc to be unique
                    mut_self.handle_click(widget_arc, event);
                }
            }
        }));
    }
}
```
**Note**: The provided `event_handler!` macro in the source code directly converts `self` to a raw pointer. The example above shows a safer, `Arc`-based approach that's more common in modern Rust GUI frameworks for `'static` closures where the lifetime of `self` is not guaranteed. OSUI's `Handler` component itself simplifies common patterns, often making direct use of `event_handler!` macro unnecessary unless you are working with bare `&mut self` on objects whose lifetime is strictly controlled.

## `transform!` Macro

A convenient macro for constructing a `Transform` component with specified properties. It simplifies the setup compared to using `Transform::new()` followed by multiple fluent method calls.

### Arguments

Takes comma-separated key-value pairs where the key is a public field of `Transform` and the value is an expression that can be converted into the field's type (e.g., `u16` for `Position::Const`, `Dimension::Const`).

### Usage

```rust
use osui::prelude::*; // Imports Transform, Position, Dimension

rsx! {
    // Sets x: Const(10), y: Center, width: Full, height: Const(5), px: 1
    @transform!(x: 10, y: Center, width: Full, height: 5, px: 1);
    Div { "Transformed Div" }

    // Minimal transform, only setting width
    @transform!(width: 20);
    Div { "Width 20" }
}
```
This macro makes it very concise to apply layout rules directly within your `rsx!` syntax.

## `rsx!` Macro

The primary macro for declaratively defining your OSUI user interface. It provides a JSX-like syntax for nesting elements, attaching components, and specifying dependencies.

### Arguments

Takes a sequence of UI elements, potentially nested within curly braces `{}`.

### Features

*   **Text Literals**: Direct strings (e.g., `"Hello"`) become text elements.
*   **Element Tags**: Element struct names (e.g., `Div`, `Input`) followed by properties and children.
*   **Properties**: `field: value` pairs set element properties (e.g., `Heading, smooth: true,`).
*   **Children**: Elements nested within `{}` are children of the parent.
*   **Dependencies**: `%variable_name` registers `variable_name` (must implement `DependencyHandler`) as a dependency for a dynamic widget.
*   **Components**: `@ComponentType` or `@ComponentType::new(args)` attaches a component to the element.
*   **Static Elements**: `static ElementType { ... }` creates a `StaticWidget` (no reactivity overhead).
*   **Expansion**: `$another_macro => (args)` allows embedding UI generated by other macros/functions.

### Usage

```rust
use osui::prelude::*;

let my_state_var = use_state("Initial".to_string());

rsx! {
    // Simple text
    "Welcome to OSUI!"

    // Static Div with styling
    @Transform::new().dimensions(20, 5);
    @Style { background: Background::Solid(0x333333), foreground: Some(0xFFFFFF) };
    static Div { "This is a static box." }

    // Dynamic Div reacting to `my_state_var`
    %my_state_var
    Div {
        format!("Current state: {}", my_state_var.get())
    }

    // FlexRow with Heading and Input
    FlexRow, gap: 2, {
        Heading { "User Input" }
        @Transform::new().dimensions(30, 1);
        @Style { background: Background::Outline(0xAAAAAA) };
        @Focused;
        Input { }
    }
}
```

## `rsx_inner!` Macro

An internal, recursive macro used by `rsx!` to parse and build the UI tree. **This macro is not intended for direct use by developers.** Its definition shows the complex pattern matching used to process the various `rsx!` syntax forms.
