import React, { useState, useCallback, useContext, useEffect } from "react";
import "@reach/combobox/styles.css";
import {
  GoogleMap,
  useLoadScript,
  Marker,
  InfoWindow,
} from "@react-google-maps/api";

import Search from "./googleSearchComponent";
import { formatRelative } from "date-fns";
import WarnContext, { WarnInterface } from "../context/warnContext";
import Filter from "./filterSortingComponent";
import { Helmet } from "react-helmet";

declare const google: any;

const libraries = ["places"];
const mapContainerStyle = {
  height: "100vh",
  width: "100vw",
};
const options = {
  // styles: "",
  disableDefaultUI: true,
  zoomControl: true,
};
const center = {
  lat: 49.8397,
  lng: 24.0297,
};

type MapMarker = {
  lat: number;
  lng: number;
  time: string;
};

const GoogleMapsComponent: React.SFC<any> = ({
  googleMapsApiKey,
  history,
  match,
}) => {
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey,
    libraries,
  });
  const [markers, setMarkers] = useState([] as Array<any>);
  const [selected, setSelected] = useState(null);

  const warnContext: WarnInterface = useContext(WarnContext);

  // const onMapClick = React.useCallback(
  //   (e) => {
  //     const newMarkerSet = (current: Array<any> | Array<MapMarker>) => {
  //       return [
  //         ...current,
  //         {
  //           lat: e.latLng.lat(),
  //           lng: e.latLng.lng(),
  //           time: new Date(),
  //         },
  //       ];
  //     };
  //     setMarkers((current: Array<any> | Array<MapMarker>) => {
  //       return newMarkerSet(current);
  //     });
  //   },
  //   [selected]
  // );

  const mapRef = React.useRef();

  const onMapLoad = useCallback((map) => {
    if (!map) {
      throw new Error(`can't load a map`);
    }
    mapRef.current = map;
  }, []);

  const panTo: any = useCallback(
    ({ lat, lng }: { lat: number; lng: number }) => {
      if (!mapRef) {
        throw new Error(`@panTo: mapRef is empty`);
      } else {
        if (mapRef !== undefined) {
          if (mapRef.current !== undefined) {
            const map = mapRef.current as any; //google Maps?

            map.panTo({ lat, lng });
            map.setZoom(14);
          }
        }
      }
    },
    []
  );
  const getSelect = () => {
    const { id: markerId } = match.params as any;
    if (!markerId) {
      return;
    }
    const selected = markers.find((marker) => marker.id === markerId);
    if (selected) {
      setSelected(selected);
    }
  };
  useEffect(() => {
    const newMarkers = warnContext.data.map((warn: any) => {
      const lat = warn.location.location.latitude;
      const lng = warn.location.location.longitude;
      const text = warn.description ? warn.description.text : null;
      const { category, created, photos } = warn;

      let newPhotoObject;

      // filter photos without storage url
      if (photos && JSON.stringify(photos).indexOf("storage_url") !== -1) {
        newPhotoObject = photos;
      }

      return {
        id: warn.id,
        lat,
        lng,
        text,
        category,
        photos: newPhotoObject,
        created: created.toDate(), // convert from firestore timestamp to JS Date
      };
    });
    console.log("newMarkers: ", newMarkers);
    setMarkers(newMarkers);
  }, [warnContext]);

  useEffect(() => {
    if (markers.length && match && match.params) {
      getSelect();
    }
  }, [markers, match]);

  if (loadError) return <div>"Error"</div>;
  if (!isLoaded) return <div>"Loading..."</div>;

  const getSvgIconUrn = (category: string) => {
    let icon;

    switch (category) {
      case "car_road":
        icon = "car";
        break;
      case "housing_municipal":
        icon = "roll_of_paper";
        break;
      case "emergency":
        icon = "ripple";
        break;
      case "other":
        icon = "location_indicator";
        break;
      default:
        // icon = "spinner";
        icon = "double_ring";

        break;
    }

    return `/icons/${icon}_icon.svg`;
  };

  // const spanIcon = (category: string) => {
  //   let icon;

  //   switch (category) {
  //     case "car_road":
  //       icon = "🚘";
  //       break;
  //     default:
  //       icon = "📝";
  //       break;
  //   }

  //   return (
  //     <span role="img" aria-label="bear">
  //       {icon}
  //     </span>
  //   );
  // };
  const generateImage = (photos: any) => {
    const smallImages = Object.values(photos).map((photo: any) => {
      const { file_unique_id: id, height, storage_url, width } = photo.photo[0];
      return {
        id,
        src: `https://storage.googleapis.com/warn-board.appspot.com/${storage_url}`,
        height,
        width,
      };
    });

    return smallImages.map((item) => {
      return (
        <img
          key={item.id}
          alt={item.id}
          src={item.src}
          height={item.height}
          width={item.width}
        />
      );
    });
  };

  const getPreviewImage = (photos: any) => {
    const smallImages = Object.values(photos) as any;
    return smallImages[0].photo[0].storage_url;
  };

  const infoScreen = () => {
    const { lat, lng, text, category, created, photos, id } = selected as any;
    return (
      <InfoWindow
        position={{ lat, lng }}
        onCloseClick={() => {
          history.push(`/`);
          setSelected(null);
        }}
      >
        <div>
          <Helmet>
            <html prefix="og: http://ogp.me/ns#" />
            <meta charSet="utf-8" />
            {text && <title>text</title>}
            <link rel="canonical" href={`https://warn-board.web.app/${id}`} />
            <meta property="og:type" content="article" />
            {text && <meta property="og:description" content={text} />}
            {photos && (
              <meta property="og:image" content={getPreviewImage(photos)} />
            )}
          </Helmet>
          <h2 style={{ display: "flex", alignItems: "center" }}>
            <img
              alt={category}
              height="35"
              width="35"
              src={getSvgIconUrn(category)}
            />{" "}
            Description:
          </h2>
          {text && <p>{text}</p>}
          {photos && generateImage(photos)}
          <p>Spotted {formatRelative(created, new Date())}</p>
        </div>
      </InfoWindow>
    );
  };

  return (
    <React.Fragment>
      <Search panTo={panTo} />
      <Filter />
      <GoogleMap
        id="map"
        mapContainerStyle={mapContainerStyle}
        zoom={8}
        center={center}
        options={options}
        // onClick={onMapClick}
        onLoad={onMapLoad}
      >
        {google &&
          google.maps &&
          markers.map((marker) => (
            <Marker
              key={marker.id}
              position={{ lat: marker.lat, lng: marker.lng }}
              onClick={() => {
                // setSelected(marker);
                history.push(`/${marker.id}`);
              }}
              icon={{
                url: `${getSvgIconUrn(marker.category)}`,
                origin: new google.maps.Point(0, 0),
                anchor: new google.maps.Point(15, 15),
                scaledSize: new google.maps.Size(30, 30),
              }}
            />
          ))}
        {selected && infoScreen()}
      </GoogleMap>
    </React.Fragment>
  );
};

export default GoogleMapsComponent;
