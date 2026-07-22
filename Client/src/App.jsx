import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import MangaDetails from "./Component/MangaDetails";
import Chapter from "./Component/Chapter";
import "./App.css";
import ProfilePage from "./Component/ProfilePage";
import Home from "./Component/Home";
import Navbar from "./Component/Navbar";
import EditProfile from "./Component/EditProfile";
import ShowSearch from "./Component/ShowSearch";
import ShowTag from "./Component/ShowTag";
import Browse from "./Component/Browse";
import ProtectedRoute from "./Component/ProtectedRoute";
import NotFound from "./Component/NotFound";

function App() {
  return (
    <Router>
      <div className="App">
        <Navbar />

        {/* Cible du lien d'évitement placé dans l'en-tête. */}
        <main id="contenu-principal" className="flex-1">
          <Routes>
            <Route path="/" element={<Home />} />

            {/* L'édition de profil n'est accessible qu'à son propriétaire. */}
            <Route
              path="/EditProfil/:id"
              element={
                <ProtectedRoute requireSelf>
                  <EditProfile />
                </ProtectedRoute>
              }
            />

            <Route path="/manga/:id" element={<MangaDetails />} />
            <Route path="/chapter/:chapterId" element={<Chapter />} />
            <Route path="/User/:id" element={<ProfilePage />} />
            <Route path="/search/:query" element={<ShowSearch />} />
            <Route path="/tag/:query" element={<ShowTag />} />
            <Route path="/browse/:section" element={<Browse />} />

            {/* Toute autre URL affiche une page dédiée plutôt qu'un écran vide. */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
