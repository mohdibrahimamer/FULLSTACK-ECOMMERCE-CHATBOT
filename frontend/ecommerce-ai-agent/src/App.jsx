import { useState } from "react";
import reactLogo from "./app/assets/react.svg";
import viteLogo from "/vite.svg";
import "./App.css";
import EcommerceStore from "./app/components/ecommerce-store/EcommerceStore";
function App() {
  const [count, setCount] = useState(0);

  return (
    <>
      <p>hello amer you will conquer the world</p>
      <EcommerceStore />
    </>
  );
}

export default App;
