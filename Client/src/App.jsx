import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import MangaDetails from "./Component/MangaDetails"; 
import Chapter from './Component/Chapter'; // Ce composant doit être capable d'afficher les détails d'un chapitre spécifique
import './App.css';
import ProfilePage from './Component/ProfilePage';
import Home from './Component/Home';
import Navbar from './Component/Navbar'; // Import the Navbar component
import EditProfile from './Component/EditProfile';
import ShowSearch from './Component/ShowSearch';
import ShowTag from './Component/ShowTag';
import Chatbot from './Component/Chatbot';

function App() {

  return (
    <Router>
      <div className="App">
        <Navbar /> 
        <Routes>
          <Route path="/" element={
            <div className="app-container">
              <Home />
            </div>
          } />
          <Route path="/EditProfil/:id" element={<EditProfile />} />
          <Route path="/manga/:id" element={<MangaDetails />} />
          <Route path="/chapter/:chapterId" element={<Chapter/>} /> 
          <Route path="/User/:id" element={<ProfilePage />} />
          <Route path="/search/:query" element={<ShowSearch />} />
          <Route path="/tag/:query" element={<ShowTag />} />
        </Routes>
        <Chatbot />
      </div>
    </Router>
  );
}

export default App;
