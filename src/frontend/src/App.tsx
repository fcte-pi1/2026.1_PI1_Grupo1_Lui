import { RouterProvider, createBrowserRouter } from "react-router";
import { Layout } from "./app/components/Layout";
import { Dashboard } from "./app/components/Dashboard";
import { HistoryPage } from './app/components/HistoryPage';

const router = createBrowserRouter([
  {
    path: "/",
    Component: Layout,
    children: [
      { index: true, Component: Dashboard },
      { path: "historico", Component: HistoryPage },
    ],
  },
]);

function App() {
  return <RouterProvider router={router} />;
}

export default App;
