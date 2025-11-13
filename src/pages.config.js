import NewOrder from './pages/NewOrder';
import OrdersList from './pages/OrdersList';
import Production from './pages/Production';
import AdminProducts from './pages/AdminProducts';
import AdminCategories from './pages/AdminCategories';
import AdminShops from './pages/AdminShops';
import CatalogProducts from './pages/CatalogProducts';
import Layout from './Layout.jsx';


export const PAGES = {
    "NewOrder": NewOrder,
    "OrdersList": OrdersList,
    "Production": Production,
    "AdminProducts": AdminProducts,
    "AdminCategories": AdminCategories,
    "AdminShops": AdminShops,
    "CatalogProducts": CatalogProducts,
}

export const pagesConfig = {
    mainPage: "NewOrder",
    Pages: PAGES,
    Layout: Layout,
};