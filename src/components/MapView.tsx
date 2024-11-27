import { useState } from "react";
import { GoogleMap, Marker, useJsApiLoader } from "@react-google-maps/api";

interface MapViewProps {
  // onLocationSelect:(location:{lat:number; lng:number})=>void;
  savedRoute: { lat: number; lng: number; title: string;}[];
}

export function MapView({ savedRoute }: MapViewProps) {
  const [blobUrl,setBlobUrl]=useState<string | null>(null);

  // 環境変数からAPIキーを取得
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "";

  // デバッグ用ログ
  console.log("Google Maps API Key:", apiKey);

  if (!apiKey) {
    console.error("Google Maps API key is not defined. Check your .env file.");
    return <div>Error: API key is not defined</div>;
  }

  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: apiKey,
  });

  if (!isLoaded) {
    return <div>Loading...</div>;
  }

  const handleFileChange=(event:React.ChangeEvent<HTMLInputElement>)=>{
    if(event.target.files && event.target.files[0]){
      const file = event.target.files[0];
      const newBlobUrl = URL.createObjectURL(file);
      setBlobUrl(newBlobUrl);
    }
  };

  return (
    <div>
      <GoogleMap
        mapContainerStyle={{ width: "100%", height: "500px" }}
        center={savedRoute[0] || { lat: 0, lng: 0 }}
        zoom={10}
      >
        {savedRoute.map((location, index) => (
          <Marker key={index} position={{ lat: location.lat, lng: location.lng }} title={location.title} />
        ))}
      </GoogleMap>

      <input type="file" onChange={handleFileChange}/>
      {blobUrl && <img src={blobUrl} alt="Preview"/>}
    </div>
  );
}
