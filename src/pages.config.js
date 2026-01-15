import AdminHome from './pages/AdminHome';
import CatalogProducts from './pages/CatalogProducts';
import DeliveryPrep from './pages/DeliveryPrep';
import EventOrders from './pages/EventOrders';
import Home from './pages/Home';
import NewOrder from './pages/NewOrder';
import OrdersList from './pages/OrdersList';
import Production from './pages/Production';
import ProductionHome from './pages/ProductionHome';
import Reports from './pages/Reports';
import VendeurHome from './pages/VendeurHome';
import Admin from './pages/Admin';
import __Layout from './Layout.jsx';


export const PAGES = {
    "AdminHome": AdminHome,
    "CatalogProducts": CatalogProducts,
    "DeliveryPrep": DeliveryPrep,
    "EventOrders": EventOrders,
    "Home": Home,
    "NewOrder": NewOrder,
    "OrdersList": OrdersList,
    "Production": Production,
    "ProductionHome": ProductionHome,
    "Reports": Reports,
    "VendeurHome": VendeurHome,
    "Admin": Admin,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: __Layout,
};