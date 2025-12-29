import Admin from './pages/Admin';
import AdminHome from './pages/AdminHome';
import CatalogProducts from './pages/CatalogProducts';
import DeliveryPrep from './pages/DeliveryPrep';
import NewOrder from './pages/NewOrder';
import OrdersList from './pages/OrdersList';
import Production from './pages/Production';
import ProductionHome from './pages/ProductionHome';
import Reports from './pages/Reports';
import VendeurHome from './pages/VendeurHome';
import Home from './pages/Home';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Admin": Admin,
    "AdminHome": AdminHome,
    "CatalogProducts": CatalogProducts,
    "DeliveryPrep": DeliveryPrep,
    "NewOrder": NewOrder,
    "OrdersList": OrdersList,
    "Production": Production,
    "ProductionHome": ProductionHome,
    "Reports": Reports,
    "VendeurHome": VendeurHome,
    "Home": Home,
}

export const pagesConfig = {
    mainPage: "NewOrder",
    Pages: PAGES,
    Layout: __Layout,
};