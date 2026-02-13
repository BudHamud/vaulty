import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import AnimeApp from './pages/AnimeApp';
import Explorar from './pages/Explorar';

function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<AnimeApp />} />
          <Route path="/explorar" element={<Explorar />} />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;