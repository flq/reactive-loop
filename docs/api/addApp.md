# addApp(func)

<!-- toc -->

## func

A function that is called with the following object:

    {
      dispatch // A function with which to dispatch actions
      getState // A function that returns the current state
    }

> You probably don't need these very often since the app funcs you provide will also have access
> to those bits.

Your function is expected to return an object with a number of methods on it. These will be added
as app funcs, async app funcs or state refinements based on the following rules:

* A method starting with **"on"** will become an appFunc, with the remaining name of the method used to match with the type of actions (e.g. onLaunch becomes an app func which will listen to action's of type = 'launch')
* If such a method ends on the word **"Async"** it will be considered as async app func (i.e. an app func that returns a Promise for a new state)
* If there is a method that starts with **"filterFor"**, it will be used as [selector](appBuilder.md#addappfuncselector-func) for a method that runs by the same word. E.g. **onLaunchRocket** + **filterForLaunchRocket**
* If the function starts with either **refine** or **monitor** it will be treated as a state refinement.
* If the function starts with **dispatch** its return value will be treated as an observable of actions.

## Mounting into a subspace of the state object

If you intend to run multiple instances of the same app, it will be useful to specify a mount point
for your app. This means that all app funcs of said app will receive the property specified 
as mount point from the state object, and will also only be able to update the object 
accessible through that property on the state object.

    function app(mount) {
      return (ctx) => {
        return {
          mount() { return mount; }
          ...
        }
      };
    }
    
    const app = appBuilder()
      .addApp(app('firstInstance'))
      .addApp(app('secondInstance'))
      .build();
      
    // Giving a state object like:
    {
      firstInstance: {},
      secondInstance: {}
    }

reactive-loop ensures that the properties are initialized to empty objects if nothing has been
provided by giving a fitting initial state.

## Sample 1

    function launchApp() {
      return {
        onInitLaunch(s,a,d) { /* app func for action.type == 'initLaunch' */ },
        onResetCounterAsync(s,a,d) { /* async app func for action.type == 'resetCounter' */ },
        filterForNewWeatherData(a) { return a.type.startsWith("weather/"); },
        onNewWeatherData(s,a,d) { /* gets called when the filter allows it */ },
        refineUi(s) { /* A state refinement */ },
      }
    }
    const app = appBuilder().addApp(launchApp).build();

## Naive Undo app
Here's another example, a naive undo app:

    function undoApp() {
      const stateStack = [];
      return {
        onUndo() {
          stateStack.pop(); // current
          var last = stateStack.pop();
          return last;
        },
        monitorState(s) {
          stateStack.push(s);
        }
      }
    }