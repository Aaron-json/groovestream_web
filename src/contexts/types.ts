type NullorUndefined = null | undefined;

type ContextProvider = {
  children: React.ReactNode;
};

type CurrentMedia =
  | {
      index: number;
      queue: Media[];
    }
  | NullorUndefined;

type mediaStateAction = {
  type: "next" | "previous" | "newMedia" | "unload";
  payload?: any | NullorUndefined;
};
