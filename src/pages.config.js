import NewOrder from './pages/NewOrder';
import OrdersList from './pages/OrdersList';
import Production from './pages/Production';
import AdminProducts from './pages/AdminProducts';
import AdminCategories from './pages/AdminCategories';
import AdminShops from './pages/AdminShops';
import CatalogProducts from './pages/CatalogProducts';
import Admin from './pages/Admin';
import Home from './pages/Home';
import VendeurHome from './pages/VendeurHome';
import ProductionHome from './pages/ProductionHome';
import AdminHome from './pages/AdminHome';
import DeliveryPrep from './pages/DeliveryPrep';
import __Layout from './Layout.jsx';


export const PAGES = {
    "NewOrder": NewOrder,
    "OrdersList": OrdersList,
    "Production": Production,
    "AdminProducts": AdminProducts,
    "AdminCategories": AdminCategories,
    "AdminShops": AdminShops,
    "CatalogProducts": CatalogProducts,
    "Admin": Admin,
    "Home": Home,
    "VendeurHome": VendeurHome,
    "ProductionHome": ProductionHome,
    "AdminHome": AdminHome,
    "DeliveryPrep": DeliveryPrep,
}

export const pagesConfig = {
    mainPage: "NewOrder",
    Pages: PAGES,
    Layout: __Layout,
};