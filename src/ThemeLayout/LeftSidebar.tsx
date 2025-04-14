import React, { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { RootState, AppDispatch } from "Slices/theme/store";
import { logout } from "Slices/AuthSlice";
import { Collapse } from "react-bootstrap";

//import images
import icons01 from "assets/images/icons/01.png";
import icons02 from "assets/images/icons/02.png";
import icons03 from "assets/images/icons/03.png";
import icons04 from "assets/images/icons/04.png";
import icons05 from "assets/images/icons/05.png";
import icons06 from "assets/images/icons/06.png";
import icons07 from "assets/images/icons/07.png";
import icons08 from "assets/images/icons/08.png";
import icons09 from "assets/images/icons/09.png";
import icons14 from "assets/images/icons/14.png";
import avatar02 from "assets/images/avatar/02.png";

const LeftSidebar = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const dispatch = useDispatch<AppDispatch>();
    const themeSidebarToggle = useSelector((state: RootState) => state.theme.themeSidebarToggle);
    const { user, isAuthenticated } = useSelector((state: RootState) => state.auth);
    const [open, setOpen] = useState(false);

    const handleSettingsClick = () => {
        setOpen(!open);
    };

    const handleFaqClick = () => {
        if (open) {
            setOpen(false);
        }
    };

    const handleLogout = () => {
        dispatch(logout());
        navigate('/login');
    };

    return (
        <>
            <div className={`left-side-bar ${themeSidebarToggle ? "collapsed" : ""}`}>
                <div className="overlay-mobile-area"></div>
                <div className="inner">
                    <div className="single-menu-wrapper">
                        <Link to="/" className={`single-menu openuptip ${location.pathname === "/" ? "active" : ""}`}>
                            <div className="icon">
                                <img src={icons01} alt="icons" />
                            </div>
                            <p>Home</p>
                        </Link>
                        {/* Only show Campaigns link if user is authenticated */}
                        {isAuthenticated && (
                            <Link to="/campaigns" className={`single-menu openuptip ${location.pathname === "/compaigns" ? "active" : ""}`}>
                                <div className="icon">
                                    <img src={icons02} alt="icons" />
                                </div>
                                <p>Campaigns</p>
                            </Link>
                        )}
                        {/* <Link to="/community-feed"
                            className={`single-menu openuptip ${location.pathname === "/community-feed" ? "active" : ""}`}
                        >
                            <div className="icon">
                                <img src={icons02} alt="icons" />
                            </div>
                            <p>Community Feed</p>
                        </Link> */}
                        {/* <Link to="/community-details"
                            className={`single-menu openuptip ${location.pathname === "/community-details" ? "active" : ""}`}>
                            <div className="icon">
                                <img src={icons02} alt="icons" />
                            </div>
                            <p>Community Details</p>
                        </Link> */}
                        <Link to="/manage-subscription" className={`single-menu openuptip ${location.pathname === "/manage-subscription" ? "active" : ""}`}>
                            <div className="icon">
                                <img src={icons03} alt="icons" />
                            </div>
                            <p>Manage Subscription</p>
                        </Link>
                    </div>
                    <div className="single-menu-wrapper">
                        <Link to="/chatbot" className={`single-menu openuptip ${location.pathname === "/chatbot" ? "active" : ""}`}>
                            <div className="icon">
                                <img src={icons04} alt="icons" />
                            </div>
                            <p>AI Chat Bot</p>
                        </Link>
                        <Link to="/image-generator" className={`single-menu openuptip ${location.pathname === "/image-generator" ? "active" : ""}`}>
                            <div className="icon">
                                <img src={icons05} alt="icons" />
                            </div>
                            <p>Image Generator</p>
                        </Link>
                        <Link to="/voicegenerator" className={`single-menu openuptip ${location.pathname === "/voicegenerator" ? "active" : ""}`}>
                            <div className="icon">
                                <img src={icons06} alt="icons" />
                            </div>
                            <p>Voice Generate</p>
                        </Link>
                    </div>
                    <div className="single-menu-wrapper">
                        {!isAuthenticated && (
                            <Link to="/register" className="single-menu">
                                <div className="icon">
                                    <img src={icons07} alt="icons" />
                                </div>
                                <p>Register</p>
                            </Link>
                        )}
                        <Link
                            onClick={handleSettingsClick}
                            aria-expanded={open}
                            className="collapse-btn collapsed single-menu" to="#" role="button">
                            <div className="icon">
                                <img src={icons08} alt="icons" />
                            </div>
                            <p>Settings</p>
                        </Link>
                        <Collapse in={open}>
                            <ul className="submenu rts-default-sidebar-list">
                                <li>
                                    <Link to="/faq" className={`${location.pathname === "/faq" ? "active" : ""}`} onClick={handleFaqClick}>
                                        <i className="fa-sharp fa-regular fa-user"></i>
                                        <span>FAQ's</span>
                                    </Link>
                                </li>
                                {!isAuthenticated && (
                                    <li>
                                        <Link to="/login">
                                            <i className="fa-sharp fa-regular fa-shopping-bag"></i>
                                            <span>Log In</span>
                                        </Link>
                                    </li>
                                )}
                                <li>
                                    <Link to="/reset-password">
                                        <i className="fa-sharp fa-regular fa-users"></i>
                                        <span>Reset Password</span>
                                    </Link>
                                </li>
                            </ul>
                        </Collapse>
                        {isAuthenticated ? (
                            <Link to="#" onClick={handleLogout} className="single-menu">
                                <div className="icon">
                                    <img src={icons09} alt="icons" />
                                </div>
                                <p>Logout</p>
                            </Link>
                        ) : (
                            <Link to="/login" className="single-menu">
                                <div className="icon">
                                    <img src={icons09} alt="icons" />
                                </div>
                                <p>Login</p>
                            </Link>
                        )}
                    </div>
                </div>
                <div className="bottom-user">
                    <div className="user-wrapper">
                        <img src={avatar02} alt="avatar" />
                        <div className="info">
                            {isAuthenticated && user ? (
                                <>
                                    <h6 className="title">{user.username}</h6>
                                    <Link to="/profile">{user.email}</Link>
                                </>
                            ) : (
                                <>
                                    <h6 className="title">Guest User</h6>
                                    <Link to="/login">Sign in to account</Link>
                                </>
                            )}
                        </div>
                        <span>{isAuthenticated ? "Free" : "Guest"}</span>
                    </div>
                    <div className="pro-upgrade">
                        <button className="rts-btn btn-primary" data-bs-toggle="modal" data-bs-target="#exampleModal" data-bs-whatever="@mdo">
                            <img src={icons14} alt="icons" />
                            Upgrade To Pro
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
};

export default LeftSidebar;