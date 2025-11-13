import NewOrder from './pages/NewOrder';
import OrdersList from './pages/OrdersList';
import Production from './pages/Production';
import Layout from './Layout.jsx';


export const PAGES = {
    "NewOrder": NewOrder,
    "OrdersList": OrdersList,
    "Production": Production,
}

export const pagesConfig = {
    mainPage: "NewOrder",
    Pages: PAGES,
    Layout: Layout,
};