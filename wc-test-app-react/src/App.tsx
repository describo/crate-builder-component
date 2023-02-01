/* eslint-disable */
import metaData from "./data/ro-crate-metadata.json" 
import "crate-builder-wc/dist/crate-builder-component.umd";
import "crate-builder-wc/dist/style.css"

import {useState, useEffect, useRef, useLayoutEffect, DOMAttributes} from "react";

type CustomElement<T> = Partial<T & DOMAttributes<T> & { children: any }>;

declare global {
  namespace JSX {
    interface IntrinsicElements {
      ['describo-crate-builder']: CustomElement<any>;
    }
  }
}

function DescriboCrateBuilder({crate, profile, onDataChange}: any) {
  const ref = useRef();

  useLayoutEffect(() => {
    const { current }: CustomElement<any> = ref;

    current?.addEventListener("save:crate", (event: Event ) => {
        const customEvent = event as CustomEvent;
        onDataChange(customEvent?.detail[0]?.crate, customEvent?.detail[0]?.profile);
      }
    );
  }, [ref]);

  return(
    <describo-crate-builder
      ref={ref}
      crate={JSON.stringify(crate)}
      profile={JSON.stringify({})}
    />
  )
}

function App() {
  const [data, setData] = useState({
    crate: metaData,
    profile: {}
  })

  function onDataChange(crate: any, profile: any) {
    setData({crate, profile})
  }

  return (
    <div className="flex">
      <DescriboCrateBuilder
        crate={metaData}
        onDataChange={onDataChange}
      />
      <div className="w-1/2">
        <div className="border-b-2 border-gray-700">
          <h1 className="m-2 text-2xl">Preview Crate</h1>
        </div>
        <pre className="border-l-2 border-gray-300 p-2 overflow-scroll text-gray-700">
          {JSON.stringify(data.crate, undefined, 2)}
        </pre>
      </div>
    </div> 
  );
}

export default App;
