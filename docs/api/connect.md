# connect

> connect(ReactComponent, stateSelectorFunc = ()=>{});

You use `connect` to make React components aware of the `dispatch` function, which allows to
feed a new action into the reactive loop.

    import {connect} from 'reax';

    const Button = connect(({id,label,dispatch}) => (
      <input 
        type="button" 
        value={label}
        onClick={()=>dispatch({ type: id })} />));

This is done through **React's context**. What is also made available is a `state` function that will provide the state as pushed into the connected component via the **state selector**. This is a function that can be defined as the second argument to connect and projects the application's state onto the connected component.