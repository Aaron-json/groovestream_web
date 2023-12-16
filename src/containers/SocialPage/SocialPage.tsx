import "./SocialPage.css";
import { useQuery } from "@tanstack/react-query";
import { Invites, FriendsList } from "../../components";
import { getFriendRequests } from "../../api/requests/social";
import { getPlaylistInvites } from "../../api/requests/media";

export default function SocialPage() {
  const {
    data: friendRequests,
    isLoading: friendRequestsLoading,
    error: friendRequestsError,
    refetch: refetchFriendRequests,
  } = useQuery({
    queryKey: ["friendRequests"],
    queryFn: async () => await getFriendRequests(),
  });
  const {
    data: playlistInvites,
    isLoading: playlistInvitesLoading,
    error: playlistInvitesError,
    refetch: refetchPlaylistInvites,
  } = useQuery({
    queryKey: ["playlistInvites"],
    queryFn: async () => await getPlaylistInvites(),
  });

  return (
    <section className="social-page">
      <div className="social-page-header">
        <h1>Socials</h1>
        {/* <span>Friend Count: {pageData.friends.length}</span> */}
      </div>
      <hr />
      <FriendsList />
      <Invites
        data={friendRequests}
        type="friend-requests"
        title="Friend Requests"
        refreshData={refetchFriendRequests}
        loading={friendRequestsLoading}
        error={!!friendRequestsError}
      />
      <Invites
        data={playlistInvites}
        type="playlist-invites"
        title="Playlist Invites"
        refreshData={refetchPlaylistInvites}
        error={!!playlistInvitesError}
        loading={playlistInvitesLoading}
      />
    </section>
  );
}
