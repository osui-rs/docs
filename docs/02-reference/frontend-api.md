---
sidebar_position: 3
title: Frontend API
---

# Frontend Module API Reference

The `frontend` module is responsible for bridging the declarative `rsx!` macro syntax to the dynamic component rendering system. It defines how component hierarchies are constructed and managed before being translated into `View`s.

## `ToRsx` Trait

```rust
pub trait ToRsx {
    fn to_rsx(&self) -> Rsx;
}
```

The `ToRsx` trait is implemented by any type that can be converted into an `Rsx` object. This is crucial for embedding various types (like strings, numbers, or other `Rsx` instances) directly into the `rsx!` macro output using the `@{expr}` syntax.

**Implementations:**
*   **`&Rsx`**: Converts a reference to an `Rsx` into an owned `Rsx` by cloning its internal structure.
*   **`T: std::fmt::Display`**: Any type that implements `std::fmt::Display` (e.g., `String`, `&str`, `i32`, `f64`, etc.) automatically implements `ToRsx`. It converts the displayable value into a `Rsx` containing a static scope that draws the text.

## `RsxScope` Enum

```rust
#[derive(Clone)]
pub enum RsxScope {
    Static(Arc<dyn Fn(&Arc<Scope>) + Send + Sync>),
    Dynamic(
        Arc<dyn Fn(&Arc<Scope>) + Send + Sync>,
        Vec<Arc<dyn HookDependency>>,
    ),
    Child(Rsx),
}
```

`RsxScope` represents the different kinds of renderable units that can be part of an `Rsx` hierarchy. These scopes dictate how and when their content is processed and updated.

*   **`Static(Arc<dyn Fn(&Arc<Scope>) + Send + Sync>)`**:
    *   Represents content that is processed only once. This is typically used for simple text literals or components that don't depend on reactive state within their `rsx!`.
    *   The contained closure is executed once to set up children within a new `Scope`.
*   **`Dynamic(Arc<dyn Fn(&Arc<Scope>) + Send + Sync>, Vec<Arc<dyn HookDependency>>)`**:
    *   Represents content that needs to be re-evaluated and potentially re-rendered when certain `dependencies` change. This is used for `rsx!` blocks with `@if` and `@for` that declare dependencies (`%dep`).
    *   The closure (`drawer`) is executed initially and then whenever any of the `HookDependency` instances in `dependencies` notify an update.
*   **`Child(Rsx)`**:
    *   Represents a nested `Rsx` structure. This is used when an `Rsx` object is embedded directly into another `rsx!` block (e.g., via `@{other_rsx}` or when passing `children` to a component).

## `Rsx` Struct

```rust
#[derive(Clone)]
pub struct Rsx(Vec<RsxScope>);
```

The `Rsx` struct is a collection of `RsxScope`s, representing a declarative UI tree fragment. It's the primary output of the `rsx!` macro.

#### Methods:

*   **`fn new() -> Self`**
    *   Creates a new empty `Rsx` instance.
*   **`fn static_scope<F: Fn(&Arc<Scope>) + Send + Sync + 'static>(&mut self, scope: F)`**
    *   Adds a `Static` `RsxScope` to the collection. The `scope` closure will be executed once to build up the content within a dedicated `Scope`.
*   **`fn dynamic_scope<F: Fn(&Arc<Scope>) + Send + Sync + 'static>(&mut self, drawer: F, dependencies: Vec<Arc<dyn HookDependency>>)`**
    *   Adds a `Dynamic` `RsxScope` to the collection. The `drawer` closure will be executed initially and then on subsequent updates of the specified `dependencies`.
*   **`fn child<R: ToRsx>(&mut self, child: R)`**
    *   Adds a `Child` `RsxScope` to the collection, converting the input `R` (which must implement `ToRsx`) into a nested `Rsx`.
*   **`fn generate_children(&self, context: &Arc<Context>)`**
    *   Processes the internal `Vec<RsxScope>`, converting each scope into actual component `Context`s and `Scope`s within the provided parent `context`. This method recursively builds the component tree.
*   **`fn view(&self, context: &Arc<Context>) -> View`**
    *   The primary method used by components to turn their `rsx!` output into a renderable `View`.
    *   It first calls `generate_children` to build the component tree within the given `context`.
    *   It then returns a `View` closure that, when executed, will instruct the `context` to `draw_children`.

The `frontend` module, through `Rsx` and `RsxScope`, provides the declarative interface and the necessary translation layer to OSUI's imperative rendering core.

**Next:** Explore the [Render API](./render-api.md).
