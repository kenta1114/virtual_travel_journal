export async function getNearbySuggestions(location:{lat:number; lng:number}){
  console.log(`Fetching suggestions for location: (${location.lat}, ${location.lng})`);
  return ["Spot A","Spot B","Spot C"];
}