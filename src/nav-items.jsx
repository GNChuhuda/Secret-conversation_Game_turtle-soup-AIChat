import { HomeIcon, Gamepad2, History } from "lucide-react";
import Index from "./pages/Index.jsx";
import Game from "./pages/Game.jsx";
import HistoryPage from "./pages/History.jsx";

/**
 * Central place for defining the navigation items. Used for navigation components and routing.
 */
export const navItems = [
  {
    title: "首页",
    to: "/",
    icon: <HomeIcon className="h-4 w-4" />,
    page: <Index />,
  },
  {
    title: "游戏",
    to: "/game",
    icon: <Gamepad2 className="h-4 w-4" />,
    page: <Game />,
  },
  {
    title: "历史",
    to: "/history",
    icon: <History className="h-4 w-4" />,
    page: <HistoryPage />,
  },
];
