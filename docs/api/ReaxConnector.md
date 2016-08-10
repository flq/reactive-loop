# ReaxConnector

The `ReaxConnector` is the _"host"_ of your application and must lie at the root 
of any React Component which want access to e.g. the `dispatch` function.
Please note that `ReaxConnector` only supports a **single child**. Multiple elements
must be wrapped into a single root.

    import {appBuilder, ReaxConnector} from 'reactive-loop';
    const app = appBuilder()...build();

    ReactDom.render(
      <ReaxConnector app={ app }>
        <div>
          <Button id="inc" label="Increment" />
          <Button id="undo" label="Undo" />
          <HelloWorld />
        </div>
      </ReaxConnector>, renderTarget);

Currently untested, you can probably use several ReaxConnectors, 
but nesting them will _most likely_ result in disappointment and failure.