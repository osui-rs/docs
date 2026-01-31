# Core Widget Model

OSUI's user interface is built upon a flexible and extensible widget model. At its heart, this model separates rendering logic from data and behavior using `Element`s and `Component`s, all encapsulated within `Widget`s.

## Elements: The Renderable Unit

The `Element` trait is the fundamental building block for anything that can be rendered on the screen.

```rust
pub trait Element: Send + Sync {
    fn render(&mut self, scope: &mut RenderScope, render_context: &RenderContext);
    fn after_render(&mut self, scope: &mut RenderScope, render_context: &RenderContext);
    fn draw_child(&mut self, element: &Arc<Widget>);
    fn event(&mut self, event: &dyn Event);
    fn is_ghost(&mut self) -> bool;
    // ... Any and AnyMut methods for downcasting
}
```

*   **`render`**: This is where the element defines *what* it draws. It uses the provided `RenderScope` to issue drawing commands (e.g., `draw_text`, `draw_rect`). It *does not* handle child rendering; that's done by the system or a parent element's `after_render`.
*   **`after_render`**: Called after the element's `render` method and any extensions have processed it. This is typically where container elements (like `Div` or `FlexRow`) would recursively trigger the rendering of their children, using the `RenderScope` for layout calculations.
*   **`draw_child`**: Used by the `rsx!` macro and `Rsx` structure to register a child widget with a parent `Element`.
*   **`event`**: Allows the element to react to various system events (e.g., keyboard input, custom events).
*   **`is_ghost`**: A "ghost" element is one that primarily serves as a layout or logical container and does not draw itself, but manages the rendering of its children. Examples include `Div` and `FlexRow`. They receive a `RenderScope` but might not add anything to its `render_stack` directly.

By default, simple text (`String`) is also an `Element`, allowing you to embed strings directly in `rsx!`.

## Components: Attaching Behavior and Data

The `Component` trait is an optional marker trait used for attaching arbitrary data or behavior to a `Widget`.

```rust
pub trait Component: Send + Sync {
    fn as_any(&self) -> &dyn Any;
    fn as_any_mut(&mut self) -> &mut dyn Any;
}
```

Components are stored in a `HashMap` within a `Widget`, keyed by `TypeId`. This allows a widget to dynamically acquire and retrieve different functionalities or data.

**Why Components?**

*   **Separation of Concerns**: Keep common behaviors (like styling, focus, velocity) separate from the core rendering logic of an `Element`.
*   **Flexibility**: Widgets can gain new capabilities at runtime by adding or removing components without modifying their fundamental `Element` implementation.
*   **Extensibility**: Extensions often operate by attaching or querying specific components (e.g., `Transform` for layout, `Style` for appearance, `Focused` for focus management).

Examples of built-in components include `Transform`, `Style`, `Velocity`, `Focused`, `Handler<E>`, etc. You can easily define your own using the `component!` macro.

## Widgets: The Container for Elements and Components

The `Widget` enum wraps an `Element` and its associated `Component`s. It's the primary way to interact with UI nodes in the OSUI tree.

```rust
pub enum Widget {
    Static(StaticWidget),
    Dynamic(DynWidget),
}
```

`Widget` provides a unified interface to access its underlying `Element` and `Component`s, regardless of whether it's static or dynamic. Most interactions with the UI tree, such as drawing children or querying properties, are done via an `Arc<Widget>`.

### `WidgetLoad`: Building Widgets

`WidgetLoad` is a temporary struct used during the initial construction of a widget. It encapsulates the root `BoxedElement` and a `HashMap` of `BoxedComponent`s.

```rust
pub struct WidgetLoad(BoxedElement, HashMap<TypeId, BoxedComponent>);

impl WidgetLoad {
    pub fn new<E: Element + 'static>(e: E) -> Self { /* ... */ }
    pub fn component<C: Component + 'static>(mut self, c: C) -> Self { /* ... */ }
    pub fn set_component<C: Component + 'static>(mut self, c: C) -> Self { /* ... */ }
    pub fn get<C: Component + 'static + Clone>(&self) -> Option<C> { /* ... */ }
}
```

It acts as a builder pattern for setting up a widget's initial state and attaching components, often used by the `rsx!` macro.

### `StaticWidget` vs. `DynWidget`

OSUI differentiates between two types of widgets to optimize for different use cases:

*   **`StaticWidget`**:
    *   **Purpose**: Represents UI elements whose content and components do not change after initial creation.
    *   **When to Use**: Ideal for static text, immutable labels, or simple decorative elements that don't react to state changes.
    *   **Performance**: More efficient as they don't carry the overhead of dependency tracking or re-evaluation logic.
    *   **Creation**: Typically created directly via `Widget::new_static` or `Screen::draw` for direct `Element`s, or by `rsx!` when no dependencies are specified.

*   **`DynWidget`**:
    *   **Purpose**: Represents UI elements whose content can change reactively based on external state.
    *   **When to Use**: Essential for displaying dynamic data, user input fields, or any widget that needs to update its appearance or children when underlying data changes (e.g., a counter, a list that filters based on input).
    *   **Mechanism**: Stores a closure (`FnMut() -> WidgetLoad`) that rebuilds its `Element` and `Component`s. It tracks dependencies (via `DependencyHandler`) and automatically `refresh`es itself when those dependencies signal a change.
    *   **Performance**: Carries a small overhead for dependency checking and re-evaluation.
    *   **Creation**: Created via `Widget::new_dyn` or `Screen::draw_dyn`, or by `rsx!` when state dependencies (`%state_var`) are provided.

The distinction allows OSUI to efficiently render static parts of the UI while providing powerful reactivity for dynamic sections. When you use the `rsx!` macro, OSUI automatically determines whether to create a `StaticWidget` or `DynWidget` based on the presence of dependencies.

### Dependency Tracking

`DynWidget`s are at the core of OSUI's reactivity. They listen for changes in their registered dependencies. When a dependency changes, the widget's internal `load` closure is re-executed, effectively rebuilding its `Element` and `Component`s, leading to a re-render. This mechanism is explained in detail in [State Management](/docs/0.1.1/concepts/state-management).
