import {useState} from 'react';

interface RouteSaverProps{
  onSaveRoute: (location: { lat: number; lng: number }[]) => void;
}

export function RouteSaver({onSaveRoute}:RouteSaverProps){
  const [route, setRoute] =useState<{lat:number; lng:number}[]>([]);

  const handleAddLocation=(location:{lat:number; lng:number})=>{
      setRoute([...route,location]); 
    };

  const handleSaveRoute=()=>{
    onSaveRoute(route);
    alert("ルートを保存しました");
  };

  return(
    <div>
      <h2>旅行ルートの保存</h2>
      <button onClick={()=>handleAddLocation({lat:35.6895, lng: 139.6917})}>
        東京を追加
      </button>
      <button onClick={()=>handleAddLocation({ lat: 34.0522, lng: -118.2437 })}>
        ロサンゼルスを追加
      </button>
      <div>
        <h3>保存されたルート</h3>
        <ul>
          {route.map((location,index)=>(
            <li key={index}>
              {`緯度: ${location.lat}, 経度: ${location.lng}`}
            </li>
          ))}
        </ul>
      </div>
      <button onClick={handleSaveRoute}>ルートを保存</button>
    </div>
  )
}