import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/social")({
  component: RouteComponent,
});

// const LIMIT = 10;

function RouteComponent() {
  <section>
    <h1 className="text-2xl font-semibold">Social</h1>
    <Friends />
    <FriendRequests />
    <PlaylistInvites />
  </section>;
}

function Friends() {
  // const [page, setPage] = useState(1);
  // const {
  //   data: friends,
  //   isLoading: friendsLoading,
  //   error: friendsErr,
  // } = useQuery({
  //   queryKey: ["friends"],
  //   queryFn: () => getFriends(LIMIT, LIMIT * (page - 1)),
  // });
  return <div>friends</div>;
}

function FriendRequests() {
  // const [page, setPage] = useState(1);
  // const {
  //   data: friendRequests,
  //   isLoading: friendRequestsLoading,
  //   error: friendRequestsErr,
  // } = useQuery({
  //   queryKey: ["friendRequests"],
  //   queryFn: getFriendRequests,
  // });
  return <div>friendRequests</div>;
}

function PlaylistInvites() {
  // const [page, setPage] = useState(1);
  // const {
  //   data: playlistInvites,
  //   isLoading: playlistInvitesLoading,
  //   error: playlistInvitesErr,
  // } = useQuery({
  //   queryKey: ["playlistInvites"],
  //   queryFn: () => getPlaylistInvites(LIMIT, LIMIT * (page - 1)),
  // });
  return <div>playlistInvites</div>;
}
