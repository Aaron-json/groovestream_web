import { useQuery } from "@tanstack/react-query";
import { getAudioFileHistory, getMostPlayedAudioFiles, getPlaylistAudioFiles } from "../api/requests/media";
import { useMediaStore } from "../state/store";


// TODO: create store key in hooks and return it
export function usePlaylistAudioFiles(key: string, playlistId: number) {
	const setMediaList = useMediaStore((state) => state.setMediaList)
	const query = useQuery({
		queryKey: [key],
		queryFn: async () => {
			const data = await getPlaylistAudioFiles(playlistId)
			setMediaList(key, data)
			return data
		}
	})
	return query
}

export function useMostPlayed(key: string, limit = 10) {
	const setMediaList = useMediaStore((state) => state.setMediaList)
	const query = useQuery({
		queryKey: [key],
		queryFn: async () => {
			const data = await getMostPlayedAudioFiles(limit)
			setMediaList(key, data)
			return data
		}
	})
	return query
}

export function useListeningHistory(key: string, limit = 10, skip?: number) {
	const setMediaList = useMediaStore((state) => state.setMediaList)
	const query = useQuery({
		queryKey: [key],
		queryFn: async () => {
			const data = await getAudioFileHistory(limit, skip)
			setMediaList(key, data)
			return data
		}
	})
	return query
}

