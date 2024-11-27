import { useState,useEffect } from 'react';
import { AuthPage } from './components/auth/AuthPage';
import { JournalPage } from './components/journal/JournalPage';
import { MapView } from "./components/MapView";
import {RouteSaver} from "./components/RouteSaver";
import {NearbySuggestions} from "./components/NearbySuggestions";
import { User } from "./types";

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [savedRoute, setSavedRoute] = useState<{lat:number; lng:number; title:string}[]>([]);
  const [selectedLocation] = useState<{lat:number; lng:number} | null>(null);

  useEffect(()=>{
    const savedUser = localStorage.getItem("user");
    if(savedUser){
      setUser(JSON.parse(savedUser));
    } 
  },[]);

  // const loadSavedUser = () => {
  //   if (typeof window !== "undefined") {
  //     const savedUser = localStorage.getItem("user");
  //     return savedUser ? JSON.parse(savedUser) : null;
  //   }
  //   return null;
  // };


  const handleSaveRoute = (route:{lat:number;lng:number;title:string}[])=>{
    setSavedRoute(route);
  };

  const handleAuthSuccess = (userData: User) => {
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    setUser(null);
  };

  // const handleLocationSelect = (location:{lat:number; lng:number})=>{
  //   setSelectedLocation(location);
  // };
  
  if (!user) {
    return <AuthPage onAuthSuccess={handleAuthSuccess} />;
  }

  return(
    <div className="app-container">
      <JournalPage user={user} onLogout={handleLogout} />

      {/*地図の表示 */}
      <MapView savedRoute={savedRoute}/>

      {/*選択した場所のルート保存 */}
      {selectedLocation && (
        <RouteSaver onSaveRoute={handleSaveRoute}/>
      )}

      {/*近隣スポット提案 */}
      {selectedLocation &&(
        <NearbySuggestions location={selectedLocation}/>
      )}


    </div>
  ); 
}

export default App;
