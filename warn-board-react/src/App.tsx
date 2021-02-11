import React from "react";
import "./App.css";
import GoogleMapsComponent from "./components/googleMapsComponent";

import DataProvider from "./context/dataProvider";
import { Route } from "react-router-dom";
// import PrimarySearchAppBar from "./components/headerComponent";

function App() {
  /**
   * handleSetWarn we are using to call setWarn
   */

  /**
   *
   */
  const gMap = (props: any) => {
    return (
      <GoogleMapsComponent
        googleMapsApiKey={process.env.REACT_APP_GOOGLE_MAPS_API_KEY}
        {...props}
        // mapStyles={mapStyles}
      />
    );
  };

  return (
    <DataProvider>
      <div className="App">
        {/* <PrimarySearchAppBar></PrimarySearchAppBar> */}
        <Route path="/:id?" render={(props) => gMap(props)}></Route>
      </div>
    </DataProvider>
  );
}

export default App;
