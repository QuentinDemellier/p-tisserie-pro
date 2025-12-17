import NewOrder from './pages/NewOrder';
import OrdersList from './pages/OrdersList';
import Production from './pages/Production';
import CatalogProducts from './pages/CatalogProducts';
import Admin from './pages/Admin';
import Home from './pages/Home';
import VendeurHome from './pages/VendeurHome';
import ProductionHome from './pages/ProductionHome';
import AdminHome from './pages/AdminHome';
import DeliveryPrep from './pages/DeliveryPrep';
import Reports from './pages/Reports';
import __Layout from './Layout.jsx';


export const PAGES = {
    "NewOrder": NewOrder,
    "OrdersList": OrdersList,
    "Production": Production,
    "CatalogProducts": CatalogProducts,
    "Admin": Admin,
    "Home": Home,
    "VendeurHome": VendeurHome,
    "ProductionHome": ProductionHome,
    "AdminHome": AdminHome,
    "DeliveryPrep": DeliveryPrep,
    "Reports": Reports,
}

export const pagesConfig = {
    mainPage: "NewOrder",
    Pages: PAGES,
    Layout: __Layout,
};