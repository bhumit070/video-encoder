import { useState } from "react";
import Navbar from "./components/Navbar";
import Videos from "./components/Videos";

function App() {
  const [selectedValue, setSelectedValue] = useState("processed");

  const handleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedValue(event.target.value);
  };

  return (
    <>
      <Navbar />
      <div className="flex justify-center items-start">
        <div className="mt-4">
          <select
            id="status"
            value={selectedValue}
            onChange={handleChange}
            className="block w-64  px-4 py-2 rounded-md shadow focus:outline-none focus:ring-2 "
          >
            <option value="processed">Processed</option>
            <option value="pending">Pending</option>
          </select>
        </div>
      </div>
      <Videos selectedValue={selectedValue} />
    </>
  );
}

export default App;
