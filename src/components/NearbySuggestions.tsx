import {useState,useEffect} from "react";
import {getNearbySuggestions} from "../utils/suggestionsApi";

interface NearbySuggestiosProps{
  location:{lat:number; lng:number};
}

export function NearbySuggestions({location}:NearbySuggestiosProps){
  const [suggestions,setSuggestions] = useState<String[]>([]);

  useEffect(()=>{
    async function fetchSuggestions(){
      const results = await getNearbySuggestions(location);
      setSuggestions(results);
    }
    fetchSuggestions();
  },[location]);

  return(
    <div>
      <h3>近隣スポットの提案</h3>
      <ul>
        {suggestions.map((place,index)=>(
          <li key={index}>{place}</li>
        ))}
      </ul>
    </div>
  )
}