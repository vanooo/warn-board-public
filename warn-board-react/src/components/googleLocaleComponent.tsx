import React from "react";

const Locate: React.SFC<any> = ({ panTo }: { panTo: any }) => {
  return (
    <button
      className="locate"
      onClick={() => {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            panTo({
              lat: position.coords.latitude,
              lng: position.coords.longitude,
            });
          },
          () => null
        );
      }}
    >
      <img src="/icons/compass.svg" alt="compass" />
    </button>
  );
};
export default Locate;
