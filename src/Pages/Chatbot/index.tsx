import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { useSelector } from "react-redux";
import RightSidebar from "./RightSidebar";
import useSidebarToggle from "Common/UseSideberToggleHooks";

// Import images
import avatar03 from "assets/images/avatar/03.png";
import avatar04 from "assets/images/avatar/04.png";
import openupLogo from "assets/images/openup-logo.png"; // Make sure this path is correct

// Import Redux store for theme
import { RootState } from "Slices/theme/store";
import AuthModal from "Common/AuthModal";

const Chatbot = () => {
    // Redux hooks - only for authentication status and theme
    const { isAuthenticated } = useSelector((state: RootState) => state.auth);
    const themeType = useSelector((state: RootState) => state.theme.themeType);
    
    // Local state
    const [userInput, setUserInput] = useState("");
    const [showAuthModal, setShowAuthModal] = useState(false);
    const [conversations, setConversations] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const themeSidebarToggle = useSidebarToggle();
    const bottomRef = useRef<HTMLDivElement>(null);
    const isDarkMode = themeType === 'dark';
    
    // Original useEffect hooks
    useEffect(() => {
        document.body.classList.add("chatbot");
        return () => {
            document.body.classList.remove("chatbot");
        };
    }, []);

    useEffect(() => {
        const handleScroll = () => {
            const distanceFromBottom = document.documentElement.scrollHeight - window.innerHeight - window.scrollY;
            const threshold = 200;
            const searchForm = document.querySelector('.chatbot .search-form');
            if (searchForm) {
                if (distanceFromBottom < threshold) {
                    searchForm.classList.add('active');
                } else {
                    searchForm.classList.remove('active');
                }
            }
        };
        
        window.addEventListener('scroll', handleScroll);
        return () => {
            window.removeEventListener('scroll', handleScroll);
        };
    }, []);

    // Scroll to bottom when conversations change
    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [conversations]);

    // Handle form submission - always shows error message
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!userInput.trim()) return;
        
        // Check if user is authenticated
        if (!isAuthenticated) {
            setShowAuthModal(true);
            return;
        }
        
        // Add user message to conversations
        setConversations([...conversations, {
            type: 'user',
            content: userInput
        }]);
        
        // Clear input field
        setUserInput("");
        
        // Show loading indicator
        setIsLoading(true);
        
        // Simulate a delay then show error message
        setTimeout(() => {
            setIsLoading(false);
            setConversations(prev => [...prev, {
                type: 'bot',
                content: "Sorry, there was an error processing your request."
            }]);
        }, 1000); // 1 second delay to simulate processing
    };

    // Close auth modal
    const closeAuthModal = () => {
        setShowAuthModal(false);
    };

    // Render a conversation message
    const renderConversation = (item: any, index: number) => {
        if (item.type === 'user') {
            return (
                <div className="single__question__answer" key={index}>
                    <div className="question_user">
                        <div className="left_user_info">
                            <img src={avatar03} alt="avatar" />
                            <div className="question__user">{item.content}</div>
                        </div>
                        <div className="edit__icon openuptip">
                            <i className="fa-regular fa-pen-to-square"></i>
                        </div>
                    </div>
                </div>
            );
        } else {
            return (
                <div className="single__question__answer" key={index}>
                    <div className="answer__area">
                        <div className="thumbnail">
                            <img src={avatar04} alt="avatar" />
                        </div>
                        <div className="answer_main__wrapper">
                            <h4 className="common__title">Openup</h4>
                            <p className="disc">{item.content}</p>
                        </div>
                    </div>

                    <div className="share-reaction-area">
                        <ul>
                            <li><Link to="#" className="openuptip"><i className="fa-regular fa-bookmark"></i></Link></li>
                            <li><Link to="#" className="openuptip"><i className="fa-light fa-thumbs-up"></i></Link></li>
                            <li><Link to="#" className="openuptip"><i className="fa-regular fa-thumbs-down"></i></Link></li>
                        </ul>
                    </div>
                </div>
            );
        }
    };

    return (
        <>
            <div className={`main-center-content-m-left center-content search-sticky ${themeSidebarToggle ? "collapsed" : ""}`}>
                <div className="question_answer__wrapper__chatbot">
                    {!isAuthenticated ? (
                        <div className="empty-state">
                            <p>Please sign in to start using the chatbot</p>
                            <button 
                                className="rts-btn btn-primary"
                                onClick={() => setShowAuthModal(true)}
                            >
                                Sign In
                            </button>
                        </div>
                    ) : conversations.length > 0 ? (
                        conversations.map(renderConversation)
                    ) : (
                        <div className="empty-state">
                            <p>Type a message to start chatting!</p>
                        </div>
                    )}
                    {isLoading && (
                        <div className="loading-indicator">
                            <p>Generating response...</p>
                        </div>
                    )}
                    <div ref={bottomRef} />
                </div>

                <form onSubmit={handleSubmit} className={`search-form ${!isAuthenticated ? 'disabled' : ''}`}>
                    <input 
                        type="text" 
                        placeholder={isAuthenticated ? "Message openup..." : "Sign in to start"}
                        value={userInput}
                        onChange={(e) => setUserInput(e.target.value)}
                        disabled={!isAuthenticated}
                    />
                    <button 
                        type="submit"
                        disabled={!isAuthenticated || !userInput.trim()}
                    >
                        <i className="fa-regular fa-arrow-up"></i>
                    </button>
                </form>
                <div className="copyright-area-bottom">
                    <p> <Link to="#">AdGenie</Link> 2025. All Rights Reserved.</p>
                </div>
            </div>

            <RightSidebar />

            {/* Authentication Modal */}
            <AuthModal 
                isOpen={showAuthModal} 
                onClose={closeAuthModal} 
                isDarkMode={isDarkMode}
            />
        </>
    );
};

export default Chatbot;