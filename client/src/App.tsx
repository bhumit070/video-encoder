import { useEffect } from "react";
import Navbar from "./components/Navbar";
import { APIS, apiV1Client } from "./helper/api";

function App() {
  async function getVideos() {
    const response = await apiV1Client.get(APIS.v1.GET_VIDEOS);
    console.log(response);
  }

  useEffect(() => {
    getVideos();
  }, []);

  return (
    <>
      <Navbar />
      <h1 className="text-3xl font-bold underline">Hello world!</h1>
    </>
  );
}

export default App;
