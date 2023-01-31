/* eslint-disable */ 
import metaData from "./data/ro-crate-metadata.json" 
import describo from "crate-builder-wc/dist/crate-builder-component.umd";
import "crate-builder-wc/dist/style.css"
import router from "./index";

import { useState, useEffect } from "react";

function App() {
  const [data, setData] = useState({
    crate: metaData,
    profile: {}
  })

  useEffect(() => {
    const describo = document?.querySelector("describo-crate-builder")
    describo.addEventListener("save:crate", (event) => {
      setData({
        ...data,
        crate: event?.detail[0]?.crate
      })
    })
  }, [])

  return (
    <div className="flex">
      <describo-crate-builder 
        crate={JSON.stringify(data.crate)} 
        profile={JSON.stringify(data.profile)}
      />
      <div className="w-1/2">
        <div class="border-b-2 border-gray-700">
          <h1 class="m-2 text-2xl">Preview Crate</h1>
        </div>
        <pre className="border-l-2 border-gray-300 p-2 overflow-scroll text-gray-700">
          {JSON.stringify(data.crate, undefined, 2)}
        </pre>
      </div>
    </div> 
  );
}

export default App;
