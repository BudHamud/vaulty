import { BrowserRouter, Routes, Route } from 'react-router-dom';
import AnimeApp from './pages/AnimeApp';
import Explorar from './pages/Explorar';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<AnimeApp />} />
        <Route path="/explorar" element={<Explorar />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;