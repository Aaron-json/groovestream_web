type NullorUndefined = null | undefined;

type ContextProvider = {
  children: React.ReactNode;
};

type CurrentMedia = {
  index: number | NullorUndefined;
  queue: AudioFile[] | NullorUndefined;
};

type mediaStateAction = {
  type: string;
  payload?: any | NullorUndefined;
};
