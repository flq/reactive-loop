import {Observable} from "rx";
import {Promise} from "es6-promise";

export interface Action {
  type : string
}

export interface Dispatcher {
  (msg: Action|Observable<Action>):void;
}

export interface GetState<S> {
  ():S;
}

export interface SADFunc<S> {
  (s: GetState<S>, a : Action, d? : Dispatcher) : S;
}

export interface AsyncSADFunc<S> {
  (s: GetState<S>, a : Action, d? : Dispatcher) : Promise<S>;
}

export interface ReaxContext<S> {
  dispatch : Dispatcher;
  getState : GetState<S>;
}

export interface ReaxApp<S> {
  (ctx? : ReaxContext<S>) : Object;
}

export type Selector = string|((Action) => boolean);

export interface AppFunc<S> {
  selector: Selector;
  func: SADFunc<S>;
}

export interface AsyncAppFunc<S> {
  selector: Selector;
  async: AsyncSADFunc<S>;
}

export interface AppArtefacts<S> {
  apps : Array<ReaxApp<S>>;
  appFuncs : Array<AppFunc<S>>;
  asyncAppFuncs : Array<AsyncAppFunc<S>>;
  stateSugar : Array<(S) => S>;
  actionObservables : Array<Observable<Action>>;
  initialState : Object;
}