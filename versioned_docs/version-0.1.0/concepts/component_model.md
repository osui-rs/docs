# Component Model

OSUI's architecture is fundamentally component-based, drawing inspiration from modern GUI frameworks. This model centers around three core entities: `Element`s, `Component`s, and `Widget`s, each serving a distinct purpose in building and managing the UI.

## `Element`: The Renderable Unit

An `Element` is the foundational unit that knows how to render itself to the screen. It encapsulates the drawing logic and, for container elements, how to manage and draw its children.

*   **Responsibility**:
    *   **Rendering**: Implementing the `render` method to draw its visual representation using a `RenderScope`.
    *   **Child Management**: For container elements, implementing `draw_child` to accept children and `after_render` to recursively render them.
    *   **Event Handling**: Optionally implementing `event` to react to specific dispatched events.
*   **Characteristics**:
    *   `Element` is a trait (`pub trait Element: Send + Sync`).
    *   Common `Element` implementations include `String` (for text), `Div`, `FlexRow`, `Input`, `Heading`, etc.
    *   An `Element` instance typically holds its own internal state and references to its children if it's a container.
*   **Why a Trait Object?**: `Element` is used as a trait object (`Box<dyn Element>`) because the type of element within a UI tree needs to be dynamic at runtime. A `Widget` can hold *any* `Element` that implements the trait, regardless of its concrete type.

**Example Element (`Div` Simplified):**

```rust
// src/elements/div.rs
pub struct Div {
    children: Vec<Arc<Widget>>, // Stores children as Arc<Widget>
    // ... other internal state like calculated_size
}

impl Element for Div {
    fn render(&mut self, scope: &mut RenderScope) {
        // Queue drawing commands for the Div itself (e.g., background)
        // scope.draw_rect(...);
    }

    fn after_render(&mut self, scope: &mut RenderScope) {
        // Iterate and render `self.children`
        for child_widget in &self.children {
            // ... setup scope for child, call child_widget.get_elem().render(scope) ...
        }
    }

    fn draw_child(&mut self, element: &Arc<Widget>) {
        // Add the new child to internal list
        self.children.push(element.clone());
        // Inform the screen not to render this child independently
        element.inject(|w| w.component(NoRenderRoot));
    }
    // ... as_any, as_any_mut, event methods
}
```

## `Component`: Data and Behavior Extension

A `Component` is a distinct piece of data or behavior that can be *attached* to a `Widget`. Unlike `Element`s, which define the primary visual and structural role, `Component`s augment or modify that role.

*   **Responsibility**:
    *   **Data Storage**: Holding configuration (e.g., `Transform`, `Style`), state (e.g., `State<T>`), or IDs (e.g., `Id`).
    *   **Behavior Attachment**: Providing specific behaviors, often through closures (e.g., `Handler<E>`).
*   **Characteristics**:
    *   `Component` is a trait (`pub trait Component: Send + Sync`).
    *   Implemented by structs often defined with the `component!` macro.
    *   A `Widget` stores `Component`s in a `HashMap<TypeId, Box<dyn Component>>`, meaning only one component of a given concrete type can be attached to a widget at a time (though it can be replaced).
    *   Components are designed to be independent and reusable.
*   **Why a Trait Object?**: Similar to `Element`, `Component`s are stored as trait objects (`Box<dyn Component>`) to allow a `Widget` to hold various, arbitrary component types.

**Examples of Components:**

*   `Transform`: Defines layout properties (position, size, padding, margin).
*   `Style`: Defines visual properties (background, foreground colors).
*   `State<T>`: A reactive state variable. While `State<T>` is a generic struct, OSUI internally uses it as a `Component` for its reactivity.
*   `Handler<E>`: A component that allows a widget to respond to specific events.
*   `Id`: A simple `usize` for uniquely identifying a widget.
*   `Velocity`: Defines movement properties for an element.

## `Widget`: The Container and Lifecycle Manager

The `Widget` enum (`Static(StaticWidget)` or `Dynamic(DynWidget)`) is the central wrapper that brings `Element`s and `Component`s together. It manages their lifecycle, provides access to them, and facilitates interactions like event dispatching and reactive updates.

*   **Responsibility**:
    *   **Aggregation**: Holds one `Box<dyn Element>` and a `HashMap<TypeId, Box<dyn Component>>`.
    *   **Lifecycle**: For `DynWidget`s, manages the rebuilding process based on dependencies.
    *   **Access**: Provides methods to `get_elem()` (access the inner `Element`), `get<C>()` (retrieve a `Component`), `set_component<C>()` (add/replace a `Component`).
    *   **Event Dispatch**: Calls `Handler` components and the inner `Element::event` when an event is dispatched to the widget.
    *   **Thread Safety**: Uses `Mutex`es internally to ensure safe concurrent access to its `Element` and `Component`s from different threads (e.g., render thread, input thread, background threads updating state).
*   **Characteristics**:
    *   `Widget` is an `enum` with `StaticWidget` and `DynWidget` variants.
    *   Always wrapped in an `Arc<Widget>` for shared ownership and efficient cloning, reflecting its place in the UI tree.
    *   `StaticWidget`: Holds a fixed `Element` instance. Its content doesn't change unless explicitly replaced.
    *   `DynWidget`: Holds a closure that can rebuild its `Element` and initial `Component`s. It tracks `DependencyHandler`s and automatically refreshes when they change.

**Example `Widget` Structure:**

```rust
// Internally in OSUI:
pub enum Widget {
    Static(StaticWidget), // Wrapper for fixed content
    Dynamic(DynWidget),   // Wrapper for reactive content
}

// Simplified StaticWidget structure:
pub struct StaticWidget(
    Mutex<BoxedElement>,                 // The main Element instance
    Mutex<HashMap<TypeId, BoxedComponent>>, // Attached components
);

// Simplified DynWidget structure:
pub struct DynWidget(
    Mutex<BoxedElement>,                 // The main Element instance
    Mutex<HashMap<TypeId, BoxedComponent>>, // Attached components
    Mutex<Box<dyn FnMut() -> WidgetLoad>>, // The function to rebuild the Element/Components
    // ... dependencies and inject closure
);
```

## How They Work Together (The Flow)

1.  **Declarative UI (`rsx!` macro)**: You define your UI using the `rsx!` macro.
    *   `Div { ... }` generates a `WidgetLoad` containing a `Div` `Element`.
    *   `@Transform(...)` adds a `Transform` `Component` to this `WidgetLoad`.
    *   `%my_state` adds `my_state` (a `State<T>`) as a `DependencyHandler` to the `DynWidget`'s list.
2.  **`Screen::draw()`**: The `rsx!` output (an `Rsx` object) is passed to `Screen::draw()` (or `draw_parent`).
    *   The `Screen` creates `Arc<Widget>` instances (either `Static` or `Dynamic`) from the `WidgetLoad` definitions.
    *   These `Arc<Widget>` are stored in the `Screen`'s `widgets` list, forming the top level of the UI tree.
    *   For nested elements, the parent's `Element::draw_child` is called, allowing the parent to store references to its children. Crucially, children rendered by a parent are marked with `NoRenderRoot` to prevent the `Screen` from rendering them independently.
3.  **Rendering Loop (`Screen::render`)**:
    *   For each `Arc<Widget>` in its top-level `widgets` list:
        *   It checks for `NoRender` or `NoRenderRoot` to decide if this widget should be directly rendered or if its parent is handling it.
        *   It obtains the widget's `Transform` and `Style` `Component`s and sets them on a fresh `RenderScope`.
        *   It calls `Extension::render_widget` for all registered extensions.
        *   It calls `widget.get_elem().render(scope)` to let the `Element` queue its drawing commands.
        *   It calls `widget.get_elem().after_render(scope)`. This is where container `Element`s iterate through their own children, setting up a new `RenderScope` context for each child and recursively calling `child_widget.get_elem().render` and `after_render`.
        *   Finally, `scope.draw()` is called to flush the accumulated commands to the terminal.
        *   For `DynWidget`s, `widget.auto_refresh()` is called, which checks dependencies and rebuilds the `Element` if needed.
4.  **Event Handling (`Widget::event`)**:
    *   When an event occurs (e.g., keyboard input from `InputExtension`), `Screen` dispatches it to all top-level widgets by calling `widget.event(&event)`.
    *   `Widget::event` first checks if a `Handler<E>` `Component` is present for that event type and calls its closure.
    *   Then, it calls `widget.get_elem().event(&event)`, allowing the `Element` itself to react.

This robust component model allows for clear separation of concerns, reusability of UI parts, and a powerful reactive system, making it possible to build complex and dynamic terminal user interfaces.



