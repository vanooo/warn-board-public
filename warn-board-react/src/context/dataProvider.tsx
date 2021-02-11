import React, { useState } from "react";
import WarnContext from "./warnContext";

const DataProvider: React.SFC<any> = (props) => {
  /**
   * don't like any, but have no other idea
   * */
  const [warn, setWarn] = useState([] as any);

  return (
    <WarnContext.Provider
      value={{
        data: warn,
        handleSetWarn: (newValue: Array<{}>) => {
          setWarn([...newValue]);
        },
      }}
    >
      {props.children}
    </WarnContext.Provider>
  );
};

export default DataProvider;
