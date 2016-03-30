# appInit

    import {appBuilder, appInit} from 'reactive-loop';

    var appArtefacts = appBuilder()...build();
    var appInterfaces = appInit(appArtefacts);

`appInit` wires up the artefacts that are produced by using the `appBuilder`. It returns an object with the following items:

    {
        getCurrentState,
        stateObservable,
        actionObservable,
        dispatchAction
    }

* **getCurrentState**: a function that returns the current state of the app.
* **stateObservable**: This is the application state as an observable, i.e. every state change will appear here as a transition.
* **actionObservable**: All actions dispatched into the app as an observable.
* **dispatchAction**: The function that allows you to dispatch new actions. It can dispatch either
literal object with a `type : string`-property, or an observable that produces actions.

  
>While these items are everything you need to set up your reactive loop, you would usually not use these items directly but rather feed the appArtefacts produced by an `appBuilder` to the **Reax Connector**.