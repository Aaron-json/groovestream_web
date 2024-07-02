import { create } from "zustand";
import { AudioFile, Playlist } from "../types/media";

type MediaStore = {
	mediaLists: {
		[key: string]: (Playlist | AudioFile)[]
	}
	setMediaList: (key: string, list: (Playlist | AudioFile)[]) => void
}

export const useMediaStore = create<MediaStore>((set) => ({
	mediaLists: {},
	setMediaList: (key: string, list: (Playlist | AudioFile)[]) => {
		set((prevState) => ({
			mediaLists: {
				...prevState.mediaLists,
				[key]: list
			}
		}))
	}
}))
