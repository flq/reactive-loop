import {
  ReaxApp, 
  AppFunc, 
  Selector, 
  SadFunc
} from "./interfaces";

interface AppBuilder<S> {
  addApp(appProvider : ReaxApp<S>) : AppBuilder<S>;
  addAppFunc(selector : Selector, func : SadFunc<S>) : AppBuilder<S>;
}

export default function appBuilder<S>() : AppBuilder<S> {
  const apps : Array<ReaxApp<S>> = [];
  const appFuncs : Array<AppFunc<S>> = [];
  const asyncAppFuncs = [];
  const stateSugar = [];
  const actionObservables = [];
  let initialState = {};

  const builder = {
    addApp(appProviderFunc) {
      apps.push(appProviderFunc);
      return builder;
    },
    addAppFunc(selector, func) {
      appFuncs.push({ selector, func });
      return builder;
    },
    addErrorListener(func) {
      appFuncs.push({ selector: 'error', func: (s,a) => { func(s,a); return s(); } });
      return this;
    },
    addAsyncAppFunc(selector, async) {
      asyncAppFuncs.push({ selector, async });
      return builder;
    },
    addActionSource(actionObservable) {
      actionObservables.push(actionObservable);
      return builder;
    },
    addStateRefinement(func) {
      stateSugar.push(func);
      return builder;
    },
    setInitialState(state) {
      initialState = state;
      return builder;
    },
    build() {
      return {apps, appFuncs, asyncAppFuncs, actionObservables, stateSugar, initialState};
    }
  };
  return builder;
}