## An rxjs-based reactive loop and a link to React

If you have used [React][1], chances are that you have heard of [Flux][2].
If you've heard of Flux, chances are you've heard of [redux][3].

You wouldn't be alone to think of **reactive-loop** as _yet another flux-thingy_.

Even so, after having used redux and similar styles of setting up a frontend, I still have found value in putting this together and see if somebody else likes to base a flux-like architecture on [rxjs][4]' Observables and some polish around it.

Much of the usage revolves around the possibillity to define functions of the form

    function(action, state) {
      return state'
    }

(which in reactive-loop are called **AppFuncs**).
While testing the whole thing a number of additional necessary features came to be.

* Ability to return a `Promise<State>`
* Ability to dispatch actions as well as Observables that return actions.
* A way to handle errors while looping around
* A builder pattern to set up an application, with the ability to add literal objects as apps
  based on conventions

## Getting started

In the [repository][5] you will find two samples (for now), which show off a number of possibilities available with reactive-loop. You can run

    npm run samples:run

You also have [the documentation][6].

[1]: https://facebook.github.io/react/
[2]: https://facebook.github.io/flux/
[3]: http://redux.js.org
[4]: https://github.com/Reactive-Extensions/RxJS
[5]: https://github.com/flq/reactive-loop
[6]: http://realfiction.net/reactive-loop/