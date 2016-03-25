<!-- toc -->

# appBuilder

    import {appBuilder} from 'reax';
    const app = appBuilder()
        .addAppFunc('increment', (s, a) => ({ count: s().count + 1 }))
        .setInitialState({count: 0})
        .build();

The appBuilder provides the entry point to reax. It helps you to set up your
application. All things that you will call on the app builder (with the exception of _build_) will return the appBuilder object itself, in other words, you will typically have all calls chained.

# addAppFunc(selector, func)

> Provide an application function to participate in the reactive loop.

## selector

Either 

* a `string` which will then define on which type of dispatched action the func should listen to
* or a `function` that takes an action as an input and returns true/false to define whether the func should be called with this particular action or not.

## func

A function with the following input:

* A function that, when called, returns the current state object.
* The action that initiated the call
* If the dispatch method is required, it will be available as the third argument.

Put it all together and you get SAD, which may help you to remember this ;)

The **return** value of the function must be the new application state. You will typically use
`assign` to join your state updates with the currently available state.
If you return undefined, the result will be ignored. This allows you to react to an action and produce side effects unrelated to the UI.

# addAsyncAppFunc(selector, func)

All documentation to `addAppFunc` applies to this method, with the notable difference that your function must return a Promise which will resolve to the new state.

# addActionSource(observable)

This method allows you to feed in an Observable that will produce actions that will be dispatched into your application. A typical use case would involve a periodic action like some kind of timer, or input from other subsystems like e.g. a back channel from your server.

# addErrorListener(func)

Reax works with Observables internally. Exceptions that occur while dealing with observables essentially kill that particular observable. Hence all app funcs will be wrapped such that when they throw an exception, that exception will be made available to the system in the form of a special action.

## func

Input:

* s : A function that, when called, provides the current state
* a : The error action

Ouput: none is required

The error action has this shape:

    {
      type: 'error'
      whileHandling: { action that was provided to the app func causing the exception }
      error: { the exception thrown }
    }

# addStateRefinement(func)

The functions you provide here are allowed to access only the current state and may modify it by returning a new state. These functions are called every time a state transition occurs. You can use
it to e.g. separate concerns with regard to state modifications.

## func

A function that takes a single input, namely the state and returns a modified version of the state

> Please note that this type of function will receive the state object itself, **NOT** a function
> returning the state.

# setInitialState(object)

Sets the initial state with which the reactive loop is kicked off. If you don't set it, the loop will be kicked off with an empty object ({}).

# addApp(function)

Allows you to add app funcs and similar items by convention as well as providing an extension point for modularized application fragments (e.g. an Undo Stack). See [AppBuilder.AddApp][1]

# build()

Finalizes the application building and returns an object which should typically be used as input to the `appInit` function.

[1]: addApp.md