import React from 'react';

export interface WarnInterface {
    data: any,
    handleSetWarn: any,
}

const WarnContext = React.createContext({} as WarnInterface);

export default WarnContext