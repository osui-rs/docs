# RSX Internals

The `rsx!` macro is a cornerstone of OSUI, providing a declarative, JSX-like syntax for building UI trees. While it appears to directly construct widgets, it actually expands into an intermediate representation handled by the `frontend` module. This allows for powerful features like static/dynamic differentiation and dependency tracking.

## The Problem: Expressing UI Trees in Rust

Directly constructing OSUI widgets in Rust code can be verbose:

```rust
use osui::prelude::*;

let my_div = Arc::new(Widget::Dynamic(DynWidget::new(|| {
    WidgetLoad::new(Div::new())
        .component(Transform::new().center())
        .set_component(Style { background: Background::Solid(0x333333), foreground: Some(0xFFFFFF) })
})));
// How to add children? How to declare dependencies? How to make it static?
```

The `rsx!` macro aims to solve this by providing a compact, expressive syntax.

## `frontend` Module: The RSX Intermediate Representation

The `frontend` module defines the data structures that the `rsx!` macro generates. It acts as a bridge between the high-level declarative syntax and the low-level `Widget` creation.

### `Rsx` Struct

`Rsx` is essentially a wrapper around a `Vec<RsxElement>`. It represents a collection of UI elements, typically a list of siblings or children of a parent element.

```rust
pub struct Rsx(pub Vec<RsxElement>);
```

*   `Rsx::draw()`: The entry point to take an `Rsx` tree and render it onto the `Screen`.
*   `Rsx::draw_parent()`: Used recursively to draw children, passing the `Arc<Widget>` of their parent.
*   `Rsx::create_element()`: Adds a dynamic element definition to the `Rsx` vector.
*   `Rsx::create_element_static()`: Adds a static element definition to the `Rsx` vector.
*   `Rsx::expand()`: Allows merging another `Rsx` tree into the current one.

### `RsxElement` Enum

`RsxElement` is the core enum that represents a single node in the intermediate UI tree. It can be either a static or a dynamic element.

```rust
pub enum RsxElement {
    /// A static widget with children.
    Element(StaticWidget, Rsx),

    /// A dynamically generated widget (e.g., with state) with associated dependencies and children.
    DynElement(
        Box<dyn FnMut() -> WidgetLoad + Send + Sync>, // The closure that builds the WidgetLoad
        Vec<Box<dyn DependencyHandler>>,              // Dependencies for dynamic updates
        Rsx,                                          // Its children
    ),
}
```

*   **`RsxElement::Element`**: Corresponds to elements declared with `static` in `rsx!`. It directly holds a `StaticWidget` instance and its `Rsx` children.
*   **`RsxElement::DynElement`**: Corresponds to elements without `static` or with `%dependency` in `rsx!`. It holds:
    *   A `Box<dyn FnMut() -> WidgetLoad>`: This is the actual *code* (a closure) that will be executed later to create the `Element` and its initial `Component`s. This closure captures any necessary environment variables (like `State` clones).
    *   `Vec<Box<dyn DependencyHandler>>`: A list of the dependencies declared with `%`. When `DynWidget::auto_refresh()` is called, these handlers are checked to decide if the widget needs rebuilding.
    *   `Rsx`: The children of this dynamic element.

## How `rsx!` Expands

The `rsx!` macro is implemented using multiple `macro_rules!` rules that parse different patterns (text, element types, properties, components, dependencies, children). It uses an internal recursive macro, `rsx_inner!`, to build the `Rsx` structure.

Let's look at a simplified conceptual expansion:

```rust
// Example rsx! input:
rsx! {
    @Transform::new().center();
    %my_state
    Div {
        "Hello: {my_state}"
        static Input { }
    }
}
```

This *conceptually* expands to something like this (highly simplified, actual expansion is more complex with error handling and exact types):

```rust
// Conceptual Expansion of rsx!
{
    let mut r = osui::frontend::Rsx(Vec::new());

    // Processing the 'Div' element
    r.create_element(
        // The closure to build the WidgetLoad for Div
        {
            let my_state = my_state.clone(); // Clone the Arc<State<T>> for capture
            move || {
                osui::widget::WidgetLoad::new(osui::elements::Div::new())
                    // Attach Transform component
                    .component(osui::style::Transform::new().center())
            }
        },
        // Dependencies list
        vec![
            Box::new(my_state.clone()) as Box<dyn osui::state::DependencyHandler>
        ],
        // Children of the Div
        osui::frontend::Rsx(vec![
            // Processing "Hello: {my_state}" text
            osui::frontend::RsxElement::DynElement(
                {
                    let my_state = my_state.clone();
                    move || {
                        osui::widget::WidgetLoad::new(
                            format!("Hello: {}", my_state) // Format string dynamically
                        )
                    }
                },
                vec![
                    Box::new(my_state.clone()) as Box<dyn osui::state::DependencyHandler>
                ],
                osui::frontend::Rsx(Vec::new()) // No children for text
            ),
            // Processing `static Input { }`
            osui::frontend::RsxElement::Element(
                osui::widget::StaticWidget::new(Box::new(osui::elements::Input::new())),
                osui::frontend::Rsx(Vec::new()) // No children for Input here
            ),
        ])
    );

    r // The final Rsx object
}
```

## How the `Rsx` Tree is Rendered

When you call `.draw(&screen)` on an `Rsx` object:

1.  `Rsx::draw_parent()` is called, which iterates through its `Vec<RsxElement>`.
2.  For each `RsxElement`:
    *   If it's `RsxElement::Element(static_widget, children_rsx)`:
        *   An `Arc<Widget::Static(static_widget)>` is created.
        *   It's added to the screen's top-level widgets via `screen.draw_widget()`.
        *   `children_rsx.draw_parent(screen, Some(parent_widget_arc))` is recursively called.
    *   If it's `RsxElement::DynElement(build_fn, dependencies, children_rsx)`:
        *   `screen.draw_box_dyn(build_fn)` is called. This immediately executes `build_fn` *once* to get the initial `WidgetLoad`, creates an `Arc<Widget::Dynamic(...)>`, and adds it to the screen.
        *   All `dependencies` are then registered with the newly created `DynWidget` using `widget.dependency_box()`.
        *   `children_rsx.draw_parent(screen, Some(parent_widget_arc))` is recursively called.

This two-stage process (macro expansion to `Rsx` then `Rsx::draw` to `Widget`s) allows OSUI to efficiently manage static vs. dynamic content and set up the reactivity system.

## Performance Implications

*   **Static vs. Dynamic**: The `static` keyword in `rsx!` is critical for performance. `static` elements expand into `RsxElement::Element`, which directly holds a `StaticWidget`. This `StaticWidget` is instantiated only once. Dynamic elements (`RsxElement::DynElement`) hold a *closure* that is re-executed every time the widget needs to refresh. Use `static` whenever a UI part doesn't need to dynamically change its `Element` type or internal `Element` state based on external `State`s.
*   **Closure Captures**: Be mindful of what is captured by closures in dynamic elements. Cloning `Arc`s (`State<T>`, `Arc<Screen>`, etc.) is efficient. Capturing large structs by value can increase memory usage on each re-render.

Understanding the internal representation generated by `rsx!` helps in optimizing your UI structure and debugging complex reactive behaviors.



