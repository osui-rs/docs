# Macros API Reference

OSUI provides several procedural macros to simplify the definition of common structures like events, components, and especially UI layouts using a declarative syntax.

## `event!` Macro

Declares a struct that implements the `Event` trait. This simplifies the creation of custom event types for OSUI's reactive system.

### Syntax

```rust
event!(Name); // Unit struct
event!(Name { field: Type, ... }); // Named struct with fields
event!(Name (Type, Type, ...)); // Tuple struct
```

### Examples

```rust
use osui::prelude::*;

// Defines a unit struct `Clicked` that implements `osui::extensions::Event`.
event!(Clicked);

// Defines a named struct `Resized` with `width` and `height` fields, implements `Event`.
event!(Resized { width: u32, height: u32 });

// Defines a tuple struct `Moved` with two `u32` fields, implements `Event`.
event!(Moved(u32, u32));
```

### How it Works

The macro automatically adds the necessary `#[derive(Debug, Clone)]` and the `impl Event for ...` block, including the `as_any()` method required for type erasure.

## `component!` Macro

Declares a struct that implements the `Component` trait. Components allow widgets to extend their behavior or contain additional data. This macro helps avoid boilerplate.

### Syntax

```rust
component!(Name); // Unit struct
component!(Name { field: Type, ... }); // Named struct with fields
component!(Name (Type, Type, ...)); // Tuple struct
```

### Examples

```rust
use osui::prelude::*;

// Defines a unit struct `Focusable` that implements `osui::widget::Component`.
component!(Focusable);

// Defines a named struct `Tooltip` with a `text` field, implements `Component`.
component!(Tooltip { text: String });

// Defines a tuple struct `Size` with two `u32` fields, implements `Component`.
component!(Size(u32, u32));
```

### How it Works

Similar to `event!`, this macro adds `#[derive(Debug, Clone)]` and the `impl Component for ...` block, providing `as_any()` and `as_any_mut()`.

## `event_handler!` Macro

Creates an event handler closure that safely calls a method on `self` within a `move` closure, handling the lifetime issues for `Arc` or raw pointers.

### Syntax

```rust
event_handler!($self_ty:ty, $self:ident, $events:ident, $method:ident)
```

*   `$self_ty`: The type of `self` (e.g., `MyStruct`).
*   `$self`: The instance variable (e.g., `self`).
*   `$events`: The event source object (e.g., a `Handler::new` call or `widget.on(...)` if such an API existed) where you want to register the handler.
*   `$method`: The method on `$self` to be called when the event occurs.

### Example

```rust
use osui::prelude::*;
use std::sync::Arc;
use crossterm::event::{KeyCode, KeyEvent, Event as CrosstermEvent};

struct MyApp {
    screen: Arc<Screen>,
    counter: State<u32>,
}

impl MyApp {
    fn new(screen: Arc<Screen>) -> Self {
        Self {
            screen: screen.clone(),
            counter: use_state(0),
        }
    }

    // Method that will handle the event
    fn handle_key_event(&mut self, _widget: &Arc<Widget>, event: &CrosstermEvent) {
        if let CrosstermEvent::Key(KeyEvent { code: KeyCode::Char('a'), .. }) = event {
            **self.counter.get() += 1;
            println!("'a' pressed! Counter: {}", self.counter.get_dl());
        }
    }

    fn build_ui(mut self: Arc<Self>) -> Rsx { // Self must be Arc<Self> here for cloning
        let counter_dep = self.counter.clone();
        rsx! {
            // Attach a Handler component to the root widget
            @Handler::new({
                let self_ref = Arc::downgrade(&self); // Use Weak for self-referential closures if needed for more complex scenarios, or clone Arc directly.
                // For direct method calls, a raw pointer cast is used by the macro,
                // but generally it's safer to clone Arcs for closures or use Weak.
                // The macro's internal implementation uses unsafe raw pointer:
                // let self_ptr = &*self as *const Self as *mut Self;
                // move |widget, event| unsafe { (*self_ptr).handle_key_event(widget, event) }
                // Let's use a safe Arc clone here for demonstration
                let app_clone = self.clone();
                move |widget, event| {
                    app_clone.clone().handle_key_event(widget, event);
                }
            });
            %counter_dep
            Div {
                "Press 'a' to increment: {counter_dep}"
            }
        }
    }
}

// NOTE: The `event_handler!` macro as provided in the source code uses `unsafe` raw pointers.
// In real-world code, using `Arc::clone` or `Arc::downgrade` (for weak references)
// and then `upgrade()` within the closure is generally safer and idiomatic for
// closures that need to refer back to their owning struct.
// The provided macro is a low-level utility and care must be taken regarding lifetimes.
```

### Safety Considerations

The provided `event_handler!` macro internally uses `unsafe` code to cast `self` to a raw mutable pointer and dereference it within the closure. **This is inherently unsafe** because it bypasses Rust's borrow checker. You *must* ensure that the instance referred to by the raw pointer outlives the closure. In complex scenarios (e.g., where the event handler could outlive the original struct), this can lead to use-after-free or data races. For safer patterns, consider:
*   Cloning `Arc`s for each capture in the closure.
*   Using `Arc::downgrade` for weak references if the closure might outlive the original `Arc`.

## `transform!` Macro

Creates a `Transform` struct with specified field values. This offers a more concise syntax for defining transforms compared to `Transform::new().field(...).field(...)`.

### Syntax

```rust
transform!{ field: value, ... }
```

### Examples

```rust
use osui::prelude::*;

// Creates a Transform with x=10, y=20, and default values for others.
let t1 = transform!{ x: 10, y: 20 };

// Creates a Transform centered horizontally, with full width and 2 units of padding.
let t2 = transform!{ x: Center, width: Full, padding: (2, 2) };

rsx! {
    @transform!{ x: 5, y: 5, dimensions: (30, 10) };
    Div { "A fixed-size div at (5,5)" }
}
```

### How it Works

The macro expands to a `Transform::new()` call followed by setting each specified field using its `into()` method (which allows `u16` to convert to `Position::Const` or `Dimension::Const`).

## `rsx!` Macro

The primary macro for declaratively building UI element trees in OSUI. It supports static elements, dynamic elements with state dependencies, and component attachment.

### Syntax (Simplified Key Patterns)

```rust
rsx! {
    // Text literal
    "Some text"

    // Text literal with color
    ("Some colored text", 0xFF0000)

    // Static element: `static` keyword
    // ElementType, prop1: val1, ... { children }
    static MyElement, some_prop: true, { "Static child" }

    // Static element (no properties):
    static MyElement { "Static child" }

    // Dynamic element (default, no `static` keyword):
    // %dependency1 %dependency2 ... ElementType, prop1: val1, ... { children }
    %my_state
    MyDynamicElement, another_prop: "value", { "Dynamic child: {my_state}" }

    // Dynamic element (no properties):
    %my_state
    MyDynamicElement { "Dynamic child: {my_state}" }

    // Attaching components: `@ComponentType;`
    @Transform::new().center();
    @Style { background: Background::Solid(0x111111) };
    Div { "Div with Transform and Style" }

    // Expanding another Rsx block: `function_call => (args)`
    my_sub_rsx_function => (arg1, arg2)
}
```

### How it Works (High-Level)

The `rsx!` macro recursively calls an internal `rsx_inner!` macro. It parses the declarative syntax and constructs a tree of `RsxElement` enums (either `RsxElement::Element` for static or `RsxElement::DynElement` for dynamic widgets). This `Rsx` tree is then used by `Rsx::draw` or `Rsx::draw_parent` to create the actual `Widget` instances on the `Screen`.

*   **`static`**: Creates a `StaticWidget` for the root `Element`.
*   **No `static`**: Creates a `DynWidget` whose element-creation closure will be re-evaluated on dependency changes.
*   **`%dependency`**: Automatically clones the `Arc<State<T>>` (or other `DependencyHandler`) and registers it with the `DynWidget`.
*   **`@Component`**: Attaches the specified component to the `Widget` being created.
*   **`properties: value`**: Sets public fields on the `Element` struct during its construction.
*   **`{ children }`**: Recursively processes nested `rsx!` blocks to create child elements.

The `rsx!` macro is the most idiomatic way to build user interfaces in OSUI, offering a concise and powerful syntax for defining complex UI hierarchies and reactivity.



