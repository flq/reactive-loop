import {Observable} from "rx";

export interface Action {
  type : string
}

export interface SadFunc<S> {
  (S, Action, Dispatcher?) : S;
}

export type Selector = string|((Action) => boolean);

export interface Dispatcher {
  (msg: Action|Observable<Action>):void;
}

export interface ReaxContext<S> {
  dispatch : Dispatcher;
  getState : ()=>S;
}

export interface ReaxApp<S> {
  (ctx? : ReaxContext<S>) : Object;
}


export interface AppFunc<S> {
  selector: Selector;
  func: SadFunc<S>;
}