# Widget System API Reference

OSUI's UI is built upon a flexible widget system that combines `Element`s (renderable units) with `Component`s (data/behavior). The `Widget` enum serves as the primary container for these UI entities.

## Core Traits

### `Element` Trait

The fundamental building block for anything that can be rendered or participate in the UI tree.

```rust
pub trait Element: Send + Sync {
    fn render(&mut self, scope: &mut RenderScope);
    fn after_render(&mut self, scope: &mut RenderScope);
    fn draw_child(&mut self, element: &Arc<Widget>);
    fn event(&mut self, event: &dyn Event);
    fn as_any(&self) -> &dyn Any;
    fn as_any_mut(&mut self) -> &mut dyn Any;
}
```

*   `render(&mut self, scope: &mut RenderScope)`: Called to perform the element's direct rendering (e.g., drawing text, shapes).
*   `after_render(&mut self, scope: &mut RenderScope)`: Called after the element's `render` and its children's `render` methods. Used by container elements (`Div`, `FlexRow`, `FlexCol`) to process and render their children.
*   `draw_child(&mut self, element: &Arc<Widget>)`: Called by the `rsx!` macro or parent elements when a child widget is added to this element. Container elements must implement this to store their children.
*   `event(&mut self, event: &dyn Event)`: Called when an event is dispatched to this widget.
*   `as_any(&self) -> &dyn Any`: Required for downcasting.
*   `as_any_mut(&mut self) -> &mut dyn Any`: Required for mutable downcasting.

### `Component` Trait

An optional trait for state or metadata attached to widgets. Components are key-value pairs (`TypeId` to `Box<dyn Component>`) stored alongside the element.

```rust
pub trait Component: Send + Sync {
    fn as_any(&self) -> &dyn Any;
    fn as_any_mut(&mut self) -> &mut dyn Any;
}
```

*   `as_any(&self) -> &dyn Any`: Required for downcasting.
*   `as_any_mut(&mut self) -> &mut dyn Any`: Required for mutable downcasting.
*   **Note**: Components usually implement `Clone` as well, so they can be retrieved (`get()`) by value.

## Widget Containers

### `WidgetLoad` Struct

A temporary container used during the initial construction of a widget, particularly by `rsx!`.

```rust
pub struct WidgetLoad(BoxedElement, HashMap<TypeId, BoxedComponent>);
```

*   `new<E: Element + 'static>(e: E) -> Self`: Creates a new `WidgetLoad` with a root element.
*   `component<C: Component + 'static>(mut self, c: C) -> Self`: Attaches a component if one of its type doesn't already exist. Chainable.
*   `set_component<C: Component + 'static>(mut self, c: C) -> Self`: Replaces any existing component of the same type. Chainable.
*   `get<C: Component + 'static + Clone>(&self) -> Option<C>`: Attempts to retrieve a cloned component of the given type.

    ```rust
    use osui::prelude::*;
    let wl = WidgetLoad::new(String::from("My Text"))
        .component(Transform::new().center())
        .set_component(Style { background: Background::Solid(0x000000), foreground: Some(0xFFFFFF) });

    if let Some(t) = wl.get::<Transform>() {
        // ... use t ...
    }
    ```

### `StaticWidget` Struct

Represents a widget with fixed content and no dynamic rebuilding behavior.

```rust
pub struct StaticWidget(Mutex<BoxedElement>, Mutex<HashMap<TypeId, BoxedComponent>>);
```

*   `new(e: BoxedElement) -> Self`: Creates a new `StaticWidget`. Used internally by `Screen::draw`.
*   `component<C: Component + 'static>(&self, c: C)`: Attaches a component if type doesn't exist.
*   `set_component<C: Component + 'static>(&self, c: C)`: Replaces a component.
*   `get<C: Component + 'static + Clone>(&self) -> Option<C>`: Retrieves a cloned component.
*   **Note**: Access to the element and components is via `Mutex`es for thread safety.

### `DynWidget` Struct

Represents a widget with dynamic content, supporting reactive updates and rebuilding.

```rust
pub struct DynWidget(
    Mutex<BoxedElement>,
    Mutex<HashMap<TypeId, BoxedComponent>>,
    Mutex<Box<dyn FnMut() -> WidgetLoad + Send + Sync>>, // The rebuild function
    Mutex<Vec<Box<dyn DependencyHandler>>>, // Registered dependencies
    Mutex<Option<Box<dyn FnMut(WidgetLoad) -> WidgetLoad + Send + Sync>>>, // Inject function
);
```

*   `new<F: FnMut() -> WidgetLoad + 'static + Send + Sync>(mut e: F) -> Self`: Creates a new `DynWidget` from a build closure.
*   `inject<F: FnMut(WidgetLoad) -> WidgetLoad + 'static + Send + Sync>(&self, f: F)`: Provides a callback that can modify the `WidgetLoad` during refresh. Useful for adding components dynamically.
*   `refresh(&self)`: Forces the widget to rebuild its content by re-evaluating its creation function.
*   `auto_refresh(&self)`: Rebuilds the widget only if any of its registered dependencies (`DependencyHandler`) have changed. Called by `Screen` during `render`.
*   `dependency<D: DependencyHandler + 'static>(&self, d: D)`: Adds a dependency.
*   `dependency_box(&self, d: Box<dyn DependencyHandler>)`: Adds a boxed dependency.
*   `component<C: Component + 'static>(&self, c: C)`: Attaches a component if type doesn't exist.
*   `set_component<C: Component + 'static>(&self, c: C)`: Replaces a component.
*   `get<C: Component + 'static + Clone>(&self) -> Option<C>`: Retrieves a cloned component.

## `Widget` Enum

The main reference-counted container for either a `StaticWidget` or `DynWidget`. This is the standard way to pass widgets around.

```rust
pub enum Widget {
    Static(StaticWidget),
    Dynamic(DynWidget),
}
```

*   `new_static(e: BoxedElement) -> Self`: Creates a static `Widget`.
*   `new_dyn<F: FnMut() -> WidgetLoad + 'static + Send + Sync>(mut e: F) -> Self`: Creates a dynamic `Widget`.

### Common `Widget` Methods (Delegated)

These methods delegate to the underlying `StaticWidget` or `DynWidget` variant.

*   `get_elem(&self) -> MutexGuard<BoxedElement>`: Gets a mutable lock to the widget's root `Element`. Use `*widget.get_elem()` to access the `Element`.
*   `after_render(&self)`: Calls `Element::after_render` on the root element.
*   `component<C: Component + 'static>(self: &Arc<Self>, c: C) -> &Arc<Self>`: Attaches a component. Returns `self` for chaining.
*   `set_component<C: Component + 'static>(self: &Arc<Self>, c: C) -> &Arc<Self>`: Replaces a component. Returns `self` for chaining.
*   `get<C: Component + 'static + Clone>(&self) -> Option<C>`: Retrieves a cloned component. Returns `None` if not found or type mismatch.
*   `inject<F: FnMut(WidgetLoad) -> WidgetLoad + 'static + Send + Sync>(self: &Arc<Self>, mut f: F)`: For dynamic widgets, sets a callback to modify `WidgetLoad` on refresh. For static, it injects components from the `WidgetLoad` returned by `f`.
*   `refresh(self: &Arc<Self>)`: Forces a rebuild for `DynWidget`s. Does nothing for `StaticWidget`s.
*   `auto_refresh(self: &Arc<Self>)`: Triggers rebuild for `DynWidget`s if dependencies have changed. Does nothing for `StaticWidget`s.
*   `dependency<D: DependencyHandler + 'static>(self: &Arc<Self>, d: D) -> &Arc<Self>`: Adds a dependency for `DynWidget`s. Does nothing for `StaticWidget`s.
*   `dependency_box(self: &Arc<Self>, d: Box<dyn DependencyHandler>) -> &Arc<Self>`: Adds a boxed dependency for `DynWidget`s. Does nothing for `StaticWidget`s.
*   `event<E: Event + Clone + 'static>(self: &Arc<Self>, e: &E)`: Dispatches an event. It first checks for an attached `Handler<E>` component and calls it, then calls `Element::event` on the root element.

## Special Components

OSUI uses a few internal components to control rendering behavior:

*   `NoRender`: If a widget has this component, the `Screen`'s main rendering loop will skip rendering it directly. This is typically used for widgets that are managed and rendered by their parent `Element::after_render` method.
*   `NoRenderRoot`: Similar to `NoRender`, but specifically signals that the widget is a child being managed by a parent element, preventing the `Screen` from considering it a top-level root widget for direct rendering.
*   `Handler<E>`: (Described in [Handling Input](/docs/0.1.0/guides/handling_input) and [Extensions API](/docs/0.1.0/reference/extensions_api)) Enables widgets to subscribe to specific event types.

## Usage Patterns

When working with widgets, you'll commonly:

1.  Create them using `rsx!` or `Screen::draw`/`draw_dyn`.
2.  Attach `Transform` and `Style` components for layout and appearance.
3.  Attach other custom components for data or behavior.
4.  For dynamic widgets, declare `State` dependencies using `%` in `rsx!`.
5.  Access elements and components using `get_elem()`, `get()`, `set_component()`.

Understanding the interplay between `Element`, `Component`, and `Widget` is crucial for building complex and interactive OSUI applications.



