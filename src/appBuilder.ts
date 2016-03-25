import {Observable} from "rx";

import {
  Action,
  ReaxApp, 
  AppFunc, 
  Selector, 
  SADFunc,
  AsyncAppFunc,
  AsyncSADFunc,
  AppArtefacts
} from "./interfaces";


interface AppBuilder<S> {
  addApp(appProvider : ReaxApp<S>) : AppBuilder<S>;
  addAppFunc(selector : Selector, func : SADFunc<S>) : AppBuilder<S>;
  addAsyncAppFunc(selector : Selector, async : AsyncSADFunc<S>) : AppBuilder<S>;
  addStateRefinement(func : (S) => S) : AppBuilder<S>;
  setInitialState<U extends S>(state : U) : AppBuilder<S>;
  addActionSource(obs : Observable<Action>) : AppBuilder<S>;
  build() : AppArtefacts<S>;
}

export default function appBuilder<S>() : AppBuilder<S> {
  const apps : Array<ReaxApp<S>> = [];
  const appFuncs : Array<AppFunc<S>> = [];
  const asyncAppFuncs : Array<AsyncAppFunc<S>> = [];
  const stateSugar : Array<(S) => S> = [];
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