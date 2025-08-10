# `osui::widget`

The `widget` module defines the fundamental traits and types that constitute OSUI's widget system. It provides the building blocks (`Element`, `Component`) and the containers (`Widget`, `StaticWidget`, `DynWidget`) necessary to create and manage the UI tree.

## `Element` Trait

The core trait for anything that can be rendered in the UI. Elements are responsible for their own rendering logic and can define hooks for lifecycle events and child rendering.

```rust
pub trait Element: Send + Sync {
    /// Called to perform rendering for the element. Elements draw their own content here.
    #[allow(unused)]
    fn render(
        &mut self,
        scope: &mut RenderScope,
        render_context: &crate::render_scope::RenderContext,
    ) {}

    /// Called after rendering, for follow-up logic or cleanup.
    /// Container elements typically trigger rendering of their children here.
    #[allow(unused)]
    fn after_render(
        &mut self,
        scope: &mut RenderScope,
        render_context: &crate::render_scope::RenderContext,
    ) {}

    /// Called by a parent widget to add a child to this element.
    #[allow(unused)]
    fn draw_child(&mut self, element: &Arc<Widget>) {}

    /// Called to handle events for this element.
    #[allow(unused)]
    fn event(&mut self, event: &dyn Event) {}

    /// Returns `true` if this element is a "ghost" element.
    /// Ghost elements primarily serve as layout or logical containers and do not draw themselves.
    fn is_ghost(&mut self) -> bool { false }

    /// Returns a type-erased reference to this object for downcasting.
    fn as_any(&self) -> &dyn Any;

    /// Returns a mutable type-erased reference to this object for downcasting.
    fn as_any_mut(&mut self) -> &mut dyn Any;
}
```

## `Component` Trait

An optional trait for state or metadata attached to widgets. Components are dynamic extensions to a widget's behavior or data, stored in a `HashMap` by `TypeId`.

```rust
pub trait Component: Send + Sync {
    /// Returns a type-erased reference to this object for downcasting.
    fn as_any(&self) -> &dyn Any;
    /// Returns a mutable type-erased reference to this object for downcasting.
    fn as_any_mut(&mut self) -> &mut dyn Any;
}
```

## `BoxedElement`
Type alias for a boxed, trait-object Element.
`pub type BoxedElement = Box<dyn Element + Send + Sync>;`

## `BoxedComponent`
Type alias for a boxed, trait-object Component.
`pub type BoxedComponent = Box<dyn Component + Send + Sync>;`

## `WidgetLoad`

A temporary container for a widget during initial construction. It holds the root `BoxedElement` and any associated `BoxedComponent`s.

```rust
pub struct WidgetLoad(BoxedElement, HashMap<TypeId, BoxedComponent>);
```

### Associated Methods

#### `WidgetLoad::new<E: Element + 'static>(e: E) -> Self`
Creates a new `WidgetLoad` with a given root `Element`.

**Arguments:**
*   `e`: The element to wrap.

**Example:**
```rust
use osui::prelude::*;
let wl = WidgetLoad::new(String::from("Hello"));
```

#### `WidgetLoad::component<C: Component + 'static>(mut self, c: C) -> Self`
Attaches a component to the `WidgetLoad`. If a component of the same type already exists, it is *not* replaced. Use `set_component` for replacement.

**Arguments:**
*   `c`: The component to attach.

**Returns:**
`self`, for chaining.

**Example:**
```rust
use osui::prelude::*;
let wl = WidgetLoad::new(Div::new()).component(Transform::new().dimensions(10, 10));
```

#### `WidgetLoad::set_component<C: Component + 'static>(mut self, c: C) -> Self`
Replaces any existing component of the same type with the new component.

**Arguments:**
*   `c`: The component to set.

**Returns:**
`self`, for chaining.

**Example:**
```rust
use osui::prelude::*;
let wl = WidgetLoad::new(Div::new())
    .component(Transform::new().x(5)) // Adds first transform
    .set_component(Transform::new().x(10)); // Replaces with new transform
```

#### `WidgetLoad::get<C: Component + 'static + Clone>(&self) -> Option<C>`
Attempts to retrieve a component of the given type from the `WidgetLoad`. Requires the component to be `Clone`.

**Returns:**
`Some(C)` if found, `None` otherwise.

**Example:**
```rust
use osui::prelude::*;
let wl = WidgetLoad::new(Div::new()).component(Transform::new().x(5));
let transform: Option<Transform> = wl.get(); // transform will be Some(Transform { x: Const(5), ... })
```

## `StaticWidget`

A widget with fixed content and no dynamic behavior. It holds a `Mutex` wrapped `BoxedElement` and a `Mutex` wrapped `HashMap` of components.

```rust
pub struct StaticWidget {
    element: Mutex<BoxedElement>,
    components: Mutex<HashMap<TypeId, BoxedComponent>>,
    focused: Mutex<bool>,
}
```

### Associated Methods

#### `StaticWidget::new(e: BoxedElement) -> Self`
Creates a new `StaticWidget` from a `BoxedElement`.

#### `StaticWidget::component<C: Component + 'static>(&self, c: C)`
Attaches a component. If a component of the same type exists, it's not replaced.

#### `StaticWidget::set_component<C: Component + 'static>(&self, c: C)`
Replaces any existing component of the same type.

#### `StaticWidget::get<C: Component + 'static + Clone>(&self) -> Option<C>`
Retrieves a cloned component of the specified type.

## `DynWidget`

A widget with dynamic content and dependency tracking. It can be rebuilt using a provided `FnMut()` function when dependencies change, enabling reactive updates.

```rust
pub struct DynWidget {
    element: Mutex<BoxedElement>,
    components: Mutex<HashMap<TypeId, BoxedComponent>>,
    load: Mutex<Box<dyn FnMut() -> WidgetLoad + Send + Sync>>, // The closure that rebuilds the widget
    dependencies: Mutex<Vec<Box<dyn DependencyHandler>>>, // Tracked dependencies
    injection: Mutex<Option<Box<dyn FnMut(WidgetLoad) -> WidgetLoad + Send + Sync>>>, // For runtime modification
    focused: Mutex<bool>,
}
```

### Associated Methods

#### `DynWidget::new<F: FnMut() -> WidgetLoad + 'static + Send + Sync>(mut e: F) -> Self`
Creates a new `DynWidget` from a closure that returns a `WidgetLoad`. The closure is immediately executed once to initialize the widget's content.

#### `DynWidget::inject<F: FnMut(WidgetLoad) -> WidgetLoad + 'static + Send + Sync>(&self, f: F)`
Replaces or modifies the widget's structure on subsequent reloads and initializations. The provided closure takes the `WidgetLoad` generated by the `load` closure and returns a modified `WidgetLoad`. This is useful for dynamically adding components or wrapping elements. It triggers an immediate `refresh()`.

#### `DynWidget::refresh(&self)`
Forces the widget to rebuild its content by re-evaluating the original `load` function. If an `injection` closure is present, it's applied after the `load` function. This method updates the internal `element` and `components`.

#### `DynWidget::auto_refresh(&self)`
Checks if any registered dependencies have changed (via `DependencyHandler::check()`). If so, it calls `self.refresh()`. This method is called automatically by the `Screen` in its rendering loop for `DynWidget`s.

#### `DynWidget::dependency<D: DependencyHandler + 'static>(&self, d: D)`
Adds a dependency to this widget. When `d` signals a change, the widget will `auto_refresh()`. The `add()` method of the `DependencyHandler` is called.

#### `DynWidget::dependency_box(&self, d: Box<dyn DependencyHandler>)`
Adds a boxed dependency. Similar to `dependency` but takes a `Box<dyn DependencyHandler>`.

#### `DynWidget::component<C: Component + 'static>(&self, c: C)`
Attaches a component. If a component of the same type exists, it's not replaced.

#### `DynWidget::set_component<C: Component + 'static>(&self, c: C)`
Replaces any existing component of the same type.

#### `DynWidget::get<C: Component + 'static + Clone>(&self) -> Option<C>`
Retrieves a cloned component of the specified type.

## `Widget` (Enum)

A reference-counted wrapper around either a static or dynamic widget. `Arc<Widget>` is the standard way to store and pass around widgets in the UI tree.

```rust
pub enum Widget {
    Static(StaticWidget),
    Dynamic(DynWidget),
}
```

### Associated Methods

#### `Widget::new_static(e: BoxedElement) -> Self`
Creates a new `Widget::Static` from a `BoxedElement`.

#### `Widget::new_dyn<F: FnMut() -> WidgetLoad + 'static + Send + Sync>(e: F) -> Self`
Creates a new `Widget::Dynamic` from a closure that returns a `WidgetLoad`.

#### `Widget::is_focused(&self) -> bool`
Returns `true` if the widget currently has focus. Focus is managed by extensions like `RelativeFocusExtension`.

#### `Widget::is_ghost(&self) -> bool`
Delegates to the underlying `Element::is_ghost()`. Returns `true` if the element is primarily a layout container.

#### `Widget::set_focused(&self, f: bool)`
Sets the focus status of the widget. This method is usually called by focus management extensions.

#### `Widget::get_elem(&self) -> MutexGuard<BoxedElement>`
Provides a `MutexGuard` for mutable access to the underlying `BoxedElement`. Use with caution to avoid deadlocks.

#### `Widget::after_render(&self)`
Internal: Calls `after_render` hooks for the underlying element and extensions.

#### `Widget::component<C: Component + 'static>(self: &Arc<Self>, c: C) -> &Arc<Self>`
Attaches a component to the widget. If a component of the same type already exists, it is *not* replaced. Returns `self` for chaining.

#### `Widget::set_component<C: Component + 'static>(self: &Arc<Self>, c: C) -> &Arc<Self>`
Replaces any existing component of the same type with the new component. Returns `self` for chaining.

#### `Widget::get<C: Component + 'static + Clone>(&self) -> Option<C>`
Retrieves a cloned component of the specified type from the widget's component map.

#### `Widget::inject<F: FnMut(WidgetLoad) -> WidgetLoad + 'static + Send + Sync>(self: &Arc<Self>, mut f: F)`
Injects a modification closure into a `DynWidget`. For `StaticWidget`s, it applies the modification directly to its components. This allows runtime structural changes to widgets.

#### `Widget::refresh(self: &Arc<Self>)`
Forces a `DynWidget` to rebuild its content. Does nothing for `StaticWidget`s.

#### `Widget::auto_refresh(self: &Arc<Self>)`
Triggers `auto_refresh` on a `DynWidget` (checking and rebuilding if dependencies changed). Does nothing for `StaticWidget`s.

#### `Widget::dependency<D: DependencyHandler + 'static>(self: &Arc<Self>, d: D) -> &Arc<Self>`
Adds a dependency to a `DynWidget`. Does nothing for `StaticWidget`s. Returns `self` for chaining.

#### `Widget::dependency_box(self: &Arc<Self>, d: Box<dyn DependencyHandler>) -> &Arc<Self>`
Adds a boxed dependency to a `DynWidget`. Does nothing for `StaticWidget`s. Returns `self` for chaining.

#### `Widget::event<E: Event + Clone + 'static>(self: &Arc<Self>, e: &E)`
Dispatches an event to the widget. If the widget has a `Handler<E>` component, its callback is invoked. If the widget is focused, its underlying `Element::event` method is also called.
