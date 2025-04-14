import { ReactElement } from "react";
import CommunityFeed from "Pages/CommunityFeed";
import Dashboard from "Pages/Home/index";
import CommunityDetails from "Pages/CommunityDetails";
import ManageSubscription from "Pages/ManageSubscription";
import PaymentResult from "Pages/PaymentResult"; // Import the new PaymentResult component
import Chatbot from "Pages/Chatbot";
import ImageGenerator from "Pages/ImageGenerator";
import VoiceGenerator from "Pages/VoiceGenerator";
import Register from "Pages/Auth/Register";
import Faq from "Pages/Settings/Faq";
import Login from "Pages/Auth/Login";
import ResetPassword from "Pages/Auth/ResetPassword";
import Campaigns from "Pages/compaigns";
import CampaignDetails from "Pages/compaigns/CampaignDetails";

// Admin Pages
import AdminDashboard from "Pages/Admin/Dashboard";
import UserManagement from "Pages/Admin/UserManagement";
import CampaignReview from "Pages/Admin/CampaignReview";

export interface RouteProps {
    path: string;
    component: ReactElement;
    requiresVerification?: boolean; // New property for routes that require verified accounts
}

// Regular authenticated routes (available to both users and admins)
const routes: RouteProps[] = [
    { path: "/", component: <Dashboard /> },
    { path: "/community-feed", component: <CommunityFeed /> },
    { path: "/community-details", component: <CommunityDetails /> },
    { path: "/manage-subscription", component: <ManageSubscription /> },
    { path: "/payment-result", component: <PaymentResult /> }, // Add the payment result route
    { path: "/chatbot", component: <Chatbot /> },
    { path: "/image-generator", component: <ImageGenerator /> },
    { path: "/image-generator/:id", component: <ImageGenerator /> },
    { path: "/voicegenerator", component: <VoiceGenerator /> },
    { path: "/faq", component: <Faq /> },
];

// Routes that specifically require verification (for regular users)
// Admins can always access these routes regardless of verification status
const verifiedRoutes: RouteProps[] = [
    { path: "/campaigns", component: <Campaigns />, requiresVerification: true },
    { path: "/campaign/:id", component: <CampaignDetails />, requiresVerification: true },
];

// Admin-only routes
const adminRoutes: RouteProps[] = [
    { path: "/admin", component: <AdminDashboard /> },
    { path: "/admin/dashboard", component: <AdminDashboard /> },
    { path: "/admin/users", component: <UserManagement /> },
    { path: "/admin/campaigns", component: <CampaignReview /> },
];

// Public routes (no auth required)
const nonAuthRoutes: RouteProps[] = [
    { path: "/register", component: <Register /> },
    { path: "/login", component: <Login /> },
    { path: "/reset-password", component: <ResetPassword /> },
];

export {
    routes,
    verifiedRoutes,
    adminRoutes,
    nonAuthRoutes
};