import { useState, useEffect, useContext } from "react";
import { useParams, Link } from "react-router-dom";
import { Pencil, User } from "lucide-react";
import LoadingComponent from "./LoadingComponent";
import Manga from "./Manga";
import DisplayMangaSeen from "./DisplayMangaSeen";
import CommentUser from "./CommentUser";
import Seo from "./Seo";
import { AuthContext } from "./AuthContext";
import api, { messageFromError } from "../api";

const ProfilePage = () => {
  const { id } = useParams();
  const { user } = useContext(AuthContext);
  const [profile, setProfile] = useState(null);
  const [followManga, setFollowManga] = useState(null);
  const [mangaSeen, setMangaSeen] = useState(null);
  const [userComments, setUserComments] = useState([]);
  const [error, setError] = useState("");

  const isOwnProfile = user?.id === id;

  useEffect(() => {
    let cancelled = false;

    const fetchData = async () => {
      setError("");
      setProfile(null);
      try {
        const [profileRes, commentsRes, detailsRes] = await Promise.all([
          api.get("/User", { params: { id } }),
          api.get("/user/info/comment", { params: { userId: id } }),
          api.get("/user/info/", { params: { id } }),
        ]);

        if (cancelled) return;
        setProfile(profileRes.data);
        setUserComments(Array.isArray(commentsRes.data) ? commentsRes.data : []);
        setFollowManga(detailsRes.data.followedMangas || []);
        setMangaSeen(detailsRes.data.chaptersSeen || []);
      } catch (err) {
        if (!cancelled) {
          setError(messageFromError(err, "Could not load this profile."));
        }
      }
    };

    fetchData();
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (error) {
    return (
      <div className="container-page flex min-h-[60vh] flex-col items-center justify-center gap-6 text-center">
        <p className="text-lg text-ink-200">{error}</p>
        <Link
          to="/"
          className="rounded-full bg-brand-500 px-6 py-3 text-sm font-bold whitespace-nowrap text-white transition-colors duration-300 hover:bg-brand-600"
        >
          Back to home
        </Link>
      </div>
    );
  }

  if (!profile) return <LoadingComponent />;

  return (
    <>
      {/* Les profils ne sont pas indexés : contenu personnel. */}
      <Seo
        title={`Profile of ${profile.username}`}
        path={`/User/${id}`}
        description={`Profile of ${profile.username} on ScanGo.`}
        noindex
      />

      <div className="relative">
        <div className="h-48 w-full overflow-hidden md:h-60">
          {profile.banner ? (
            <img
              src={profile.banner}
              alt=""
              aria-hidden="true"
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="h-full w-full bg-ink-900" />
          )}
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-ink-950" />
        </div>

        <div className="container-page relative -mt-14 flex flex-col items-center gap-3 md:-mt-16 md:flex-row md:items-end">
          {profile.profile_picture ? (
            <img
              src={profile.profile_picture}
              alt=""
              className="h-28 w-28 shrink-0 rounded-full object-cover ring-4 ring-ink-950"
            />
          ) : (
            <span className="grid h-28 w-28 shrink-0 place-items-center rounded-full bg-ink-850 text-ink-400 ring-4 ring-ink-950">
              <User size={36} strokeWidth={1.5} />
            </span>
          )}

          <div className="flex flex-1 flex-col items-center gap-2 pb-2 md:flex-row md:items-end md:justify-between">
            <h1 className="text-2xl text-ink-050 md:text-3xl">{profile.username}</h1>

            {isOwnProfile && (
              <Link
                to={`/EditProfil/${id}`}
                className="inline-flex items-center gap-2 rounded-full bg-white/5 px-4 py-2 text-sm font-semibold whitespace-nowrap text-ink-100 ring-1 ring-white/10 transition-colors duration-300 hover:bg-white/10"
              >
                <Pencil size={16} strokeWidth={2} />
                Edit my profile
              </Link>
            )}
          </div>
        </div>
      </div>

      <div className="container-page flex flex-col gap-12 py-12">
        <section>
          <h2 className="mb-4 text-xl text-ink-050">Followed titles</h2>
          {followManga?.length > 0 ? (
            <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
              {followManga.map((manga) => (
                <Manga key={manga.id} mangaData={manga} headingLevel="h3" />
              ))}
            </ul>
          ) : (
            <p className="text-sm text-ink-500">No followed titles.</p>
          )}
        </section>

        <section>
          <h2 className="mb-4 text-xl text-ink-050">Reading history</h2>
          <DisplayMangaSeen mangaSeenList={mangaSeen} />
        </section>

        <section>
          <h2 className="mb-4 text-xl text-ink-050">Comments</h2>
          <CommentUser comments={userComments} setComments={setUserComments} />
        </section>
      </div>
    </>
  );
};

export default ProfilePage;
