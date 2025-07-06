import { useGameSocket } from "../hooks/useGameSocket";

const Home = () => {
    useGameSocket();
  return (
    <div>Home</div>
  )
}

export default Home