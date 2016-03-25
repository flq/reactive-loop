# ReaxConnector

The `ReaxConnector` is the _"host"_ of your application and must lie at the root of any React Component which want access to e.g. the `dispatch` function.

    import {appBuilder, ReaxConnector} from 'reax';
    const app = appBuilder()...build();

    ReactDom.render(
      <ReaxConnector app={ app }>
        <Button id="inc" label="Increment" />
        <Button id="undo" label="Undo" />
        <HelloWorld />
      </ReaxConnector>, renderTarget);

Currently untested, you could quite possibly use several ReaxConnectors, but nesting them is _most likely_ to result in disappointment and failure.