import { RouterProvider } from "react-router";
import { createBrowserRouter } from "react-router";
import { Layout } from "./app/components/Layout";
import { Dashboard } from "./app/components/Dashboard";

const router = createBrowserRouter([
  {
    path: "/",
    Component: Layout,
    children: [
      { index: true, Component: Dashboard },
    ],
  },
]);

function App() {
  return <RouterProvider router={router} />;
}

export default App;
