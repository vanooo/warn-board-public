import React, {
  // useState,
  useEffect,
  useContext,
} from "react";
import firebase from "../utils/firebase";
// import { QuerySnapshot } from "@firebase/firestore-types";
// import MovieRow from "./movieRow";
import WarnContext, { WarnInterface } from "../context/warnContext";

export interface FilterProps {}

const Filter: React.SFC<FilterProps> = () => {
  // const [filterBy, setFiterBy] = useState(null);
  // const [warns, setWarns] = useState(null) as any;

  /**
   * Add status:
   * - somebody is adding a content - on warnContextChange, could be a seperate subscription
   * -
   */
  const warnContext: WarnInterface = useContext(WarnContext);

  const getLastValue = (obj: any) => {
    if (!obj) {
      return null;
    }

    const getLastValue = Math.max(
      ...Object.entries(obj).map((i) => Number(i[0]))
    );
    return obj[getLastValue];
  };

  useEffect(() => {
    const unsubscribe: any = firebase
      .firestore()
      .collection("warns")
      .onSnapshot((snapshot: firebase.firestore.QuerySnapshot) => {
        console.log(snapshot.empty);

        const newWarns: any = [];
        snapshot.docs.forEach((item: any) => {
          const {
            category,
            locations,
            descriptions,
            photos,
            created,
          } = item.data();

          if (locations) {
            const location = getLastValue(locations);
            // const photo = getLastValue(photos);
            const description = getLastValue(descriptions);

            // locations = Object.entries(locations => {
            //     [key] = locations;
            // })

            newWarns.push({
              id: item.id,
              category,
              location,
              description,
              photos,
              created,
            });
          }
        });

        console.log(newWarns);
        warnContext.handleSetWarn(newWarns);
      });

    return () => unsubscribe();
  }, []);

  //   const onSubmit: FormEventHandler = (e: React.FormEvent<HTMLInputElement>) => {
  //     e.preventDefault();
  //     console.log();
  //   };

  return (
    <select
      name=""
      id=""
      // onChange={(e: any) => setFiterBy(e.target.value)}
    >
      <option value="">All</option>
      <option value="car_road">Car / Road</option>
      <option value="housing_municipal">Housing / Municipal</option>
      <option value="emergency">Emergency</option>
      <option value="other">Other</option>
    </select>
  );
};

export default Filter;
