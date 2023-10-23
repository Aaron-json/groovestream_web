import "./SocialPage.css";
import { FriendRequests, FriendsList } from "../../components";

export default function SocialPage() {
  return (
    <section className="social-page">
      <div className="social-page-header">
        <h1>Socials</h1>
        {/* <span>Friend Count: {pageData.friends.length}</span> */}
      </div>
      <hr />
      <FriendsList />
      <FriendRequests />
    </section>
  );
}
