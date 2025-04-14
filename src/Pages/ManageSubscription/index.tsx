import React, { useState, useEffect } from "react";
import { Col, Container, Nav, Row, Tab, TabContainer, Alert } from "react-bootstrap";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "Slices/theme/store";
import useSidebarToggle from "Common/UseSideberToggleHooks";
import { 
  createCheckoutSession, 
  clearCreditErrors, 
  clearCheckoutSession 
} from "Slices/CreditSlice";

import { redirectToCheckout } from "utils/stripeUtils";

// Define plan type
interface Plan {
  id: string;
  name: string;
  price: number;
  wordLimit: string;
  templates: string;
  languages: string;
}

// Define plan details type
interface PlanDetails {
  monthly: Plan[];
  annual: Plan[];
}

const ManageSubscription: React.FC = () => {
    const [activeIndex, setActiveIndex] = useState<number | null>(0);
    const [activePricing, setActivePricing] = useState<'monthly' | 'annual'>('monthly');
    const themeSidebarToggle = useSidebarToggle();
    const navigate = useNavigate();
    const dispatch = useDispatch<AppDispatch>();
    
    // Access Redux state
    const { user } = useSelector((state: RootState) => state.auth);
    const { isLoading, error, checkoutSessionId } = useSelector((state: RootState) => state.credits);
    
    // Clear errors when component mounts/unmounts
    useEffect(() => {
        dispatch(clearCreditErrors());
        return () => {
            dispatch(clearCreditErrors());
        };
    }, [dispatch]);
    
    // Handle Stripe redirect if we get a checkout session ID
    useEffect(() => {
        if (checkoutSessionId) {
            console.log(`Ready to redirect to Stripe with session ID: ${checkoutSessionId}`);
            
            // Add a small delay to ensure messages are logged
            setTimeout(() => {
                redirectToCheckout(checkoutSessionId)
                    .catch((err: Error) => {
                        console.error("Stripe redirect error:", err);
                        // Display error to user
                        dispatch(clearCreditErrors());
                        dispatch(clearCheckoutSession());
                        // Show error to user
                        // Using your existing error display mechanism
                    });
            }, 300);
        }
    }, [checkoutSessionId, dispatch]);
    
    const handleToggle = (index: number) => {
        setActiveIndex(activeIndex === index ? null : index);
    };
    
    // Define plans with their details
    const planDetails: PlanDetails = {
        monthly: [
            {
                id: "basic",
                name: "Basic",
                price: 0,
                wordLimit: "10,000",
                templates: "10+",
                languages: "10+"
            },
            {
                id: "diamond",
                name: "Diamond",
                price: 39.9,
                wordLimit: "60,000",
                templates: "60+",
                languages: "60+"
            },
            {
                id: "premium", 
                name: "Premium",
                price: 19.9,
                wordLimit: "30,000",
                templates: "30+",
                languages: "40+"
            }
        ],
        annual: [
            {
                id: "basic",
                name: "Basic",
                price: 0,
                wordLimit: "10,000",
                templates: "10+",
                languages: "10+"
            },
            {
                id: "diamond",
                name: "Diamond",
                price: 399,
                wordLimit: "60,000",
                templates: "60+",
                languages: "60+"
            },
            {
                id: "premium",
                name: "Silver",
                price: 199,
                wordLimit: "30,000",
                templates: "30+",
                languages: "40+"
            }
        ]
    };
    
    const handleSubscribe = (planId: string): void => {
        if (!user || !user.id) {
            // Redirect to login if user is not logged in
            navigate("/login?redirect=manage-subscription");
            return;
        }
        
        // Find selected plan
        const selectedPlan = planDetails[activePricing].find(p => p.id === planId);
        if (!selectedPlan) return;
        
        console.log(`Subscribing to plan: ${selectedPlan.name}, price: ${selectedPlan.price}`);
        
        // Clear any previous checkout sessions
        dispatch(clearCheckoutSession());
        
        // Dispatch action to create checkout session
        dispatch(createCheckoutSession({
            userId: user.id,
            plan: selectedPlan.name,
            price: selectedPlan.price
        }));
    };
    
    interface AccordionItem {
        title: string;
        content: string;
    }
    
    const accordionData: AccordionItem[] = [
        {
            title: 'What is openup content writing tool?',
            content: 'Once you know your audience, choose a topic that will resonate with them. Look for trending topics in your industry or address common questions or challenges your audience may be facing.'
        },
        {
            title: 'What languages does it supports?',
            content: 'Once you know your audience, choose a topic that will resonate with them. Look for trending topics in your industry or address common questions or challenges your audience may be facing.'
        },
        {
            title: 'What is SEO writing AI and how do I use it?',
            content: 'Once you know your audience, choose a topic that will resonate with them. Look for trending topics in your industry or address common questions or challenges your audience may be facing.'
        },
        {
            title: 'What languages does it supports?',
            content: 'Once you know your audience, choose a topic that will resonate with them. Look for trending topics in your industry or address common questions or challenges your audience may be facing.'
        },
        {
            title: 'Does Openup To write long articles?',
            content: 'Once you know your audience, choose a topic that will resonate with them. Look for trending topics in your industry or address common questions or challenges your audience may be facing.'
        },
    ];

    return (
        <>
            {/* {isLoading && <Loading />} */}
            
            <div className={`main-center-content-m-left ${themeSidebarToggle ? "collapsed" : ""}`}>
                <div className="pricing-plane-area rts-section-gapBottom">
                    <Container>
                        <Row>
                            <div className="col-lgl-12">
                                <div className="title-conter-area">
                                    <h2 className="title">
                                        Manage Subscription
                                    </h2>
                                    <span className="pre-title-bg">Want to get more out of Imagine AI? Subscribe to one of our professional plans.</span>
                                </div>
                            </div>
                        </Row>
                        
                        {error && (
                            <Row className="mt-3">
                                <Col>
                                    <Alert variant="danger" dismissible onClose={() => dispatch(clearCreditErrors())}>
                                        {error}
                                    </Alert>
                                </Col>
                            </Row>
                        )}

                        <TabContainer defaultActiveKey="home">
                            <div className="tab-area-pricing-two mt--30">
                                <Nav className="nav-tabs pricing-button-one two" id="myTab" role="tablist">
                                    <Nav.Item as="li" role="presentation">
                                        <Nav.Link 
                                            as="button" 
                                            eventKey="home" 
                                            id="home-tab"
                                            onClick={() => setActivePricing("monthly")}
                                        >
                                            Monthly Pricing
                                        </Nav.Link>
                                    </Nav.Item>
                                    <Nav.Item as="li" role="presentation">
                                        <Nav.Link 
                                            as="button" 
                                            eventKey="profile" 
                                            id="profile-tab"
                                            onClick={() => setActivePricing("annual")}
                                        >
                                            Annual Pricing
                                        </Nav.Link>
                                    </Nav.Item>
                                    <li className="save-badge">
                                        <span>SAVE 25%</span>
                                    </li>
                                </Nav>
                                <Tab.Content className="mt--20" id="myTabContent">
                                    <Tab.Pane eventKey="home">
                                        <div className="row g-5 mt--10">
                                            {planDetails.monthly.map((plan) => (
                                                <div className="col-lg-4 col-md-6 col-sm-12 col-12" key={plan.id}>
                                                    <div className={`single-pricing-single-two ${plan.id === "diamond" ? "active" : ""}`}>
                                                        <div className="head">
                                                            <span className="top">{plan.name}</span>
                                                            <div className="date-use">
                                                                <h4 className="title">${plan.price}</h4>
                                                                <span>/month</span>
                                                            </div>
                                                        </div>
                                                        <div className="body">
                                                            <p className="para">A premium pricing plan is a pricing <br /> structure that is designed.</p>

                                                            <div className="check-wrapper">
                                                                <div className="check-area">
                                                                    <i className="fa-solid fa-check"></i>
                                                                    <p>{plan.wordLimit} Monthly Word Limit</p>
                                                                </div>

                                                                <div className="check-area">
                                                                    <i className="fa-solid fa-check"></i>
                                                                    <p>{plan.templates} Templates</p>
                                                                </div>

                                                                <div className="check-area">
                                                                    <i className="fa-solid fa-check"></i>
                                                                    <p>All types of content</p>
                                                                </div>

                                                                <div className="check-area">
                                                                    <i className="fa-solid fa-check"></i>
                                                                    <p>{plan.languages} Languages</p>
                                                                </div>
                                                            </div>
                                                            <button 
                                                                className="pricing-btn"
                                                                onClick={() => handleSubscribe(plan.id)}
                                                                disabled={isLoading}
                                                            >
                                                                {isLoading ? "Processing..." : "Get Started"}
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </Tab.Pane>
                                    <Tab.Pane eventKey="profile">
                                        <div className="row g-5 mt--10">
                                            {planDetails.annual.map((plan) => (
                                                <div className="col-lg-4 col-md-6 col-sm-12 col-12" key={plan.id}>
                                                    <div className={`single-pricing-single-two ${plan.id === "diamond" ? "active" : ""}`}>
                                                        <div className="head">
                                                            <span className="top">{plan.name}</span>
                                                            <div className="date-use">
                                                                <h4 className="title">${plan.price}</h4>
                                                                <span>/year</span>
                                                            </div>
                                                        </div>
                                                        <div className="body">
                                                            <p className="para">A premium pricing plan is a pricing <br /> structure that is designed.</p>

                                                            <div className="check-wrapper">
                                                                <div className="check-area">
                                                                    <i className="fa-solid fa-check"></i>
                                                                    <p>{plan.wordLimit} Monthly Word Limit</p>
                                                                </div>

                                                                <div className="check-area">
                                                                    <i className="fa-solid fa-check"></i>
                                                                    <p>{plan.templates} Templates</p>
                                                                </div>

                                                                <div className="check-area">
                                                                    <i className="fa-solid fa-check"></i>
                                                                    <p>All types of content</p>
                                                                </div>

                                                                <div className="check-area">
                                                                    <i className="fa-solid fa-check"></i>
                                                                    <p>{plan.languages} Languages</p>
                                                                </div>
                                                            </div>
                                                            <button 
                                                                className="pricing-btn"
                                                                onClick={() => handleSubscribe(plan.id)}
                                                                disabled={isLoading}
                                                            >
                                                                {isLoading ? "Processing..." : "Get Started"}
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </Tab.Pane>
                                </Tab.Content>
                            </div>
                        </TabContainer>
                    </Container>
                </div>

                <div className="rts-faq-area rts-section-gapBottom bg_faq">
                    <div className="container">
                        <Row>
                            <Col lg={12}>
                                <div className="title-conter-area dashboard">
                                    <h2 className="title">
                                        Frequently Asked Questions
                                    </h2>
                                    <p className="disc">
                                        Can't find the answer you're looking for? Reach out to our customer support team
                                    </p>
                                </div>
                            </Col>
                        </Row>
                        <div className="row mt--60">
                            <Col lg={12}>
                                <div className="accordion-area-one">
                                    <div className="accordion" id="accordionExample">
                                        {accordionData.map((item, index) => (
                                            <div className="accordion-item" key={index}>
                                                <h2 className="accordion-header" id={`heading${index}`}>
                                                    <button
                                                        className={`accordion-button ${activeIndex === index ? '' : 'collapsed'}`}
                                                        type="button"
                                                        onClick={() => handleToggle(index)}
                                                        aria-expanded={activeIndex === index}
                                                        aria-controls={`collapse${index}`}
                                                    >
                                                        {item.title}
                                                    </button>
                                                </h2>
                                                <div
                                                    id={`collapse${index}`}
                                                    className={`accordion-collapse collapse ${activeIndex === index ? 'show' : ''}`}
                                                    aria-labelledby={`heading${index}`}
                                                    data-bs-parent="#accordionExample"
                                                >
                                                    <div className="accordion-body">
                                                        {item.content}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </Col>
                        </div>
                    </div>
                </div>
            </div>

            <div className="copyright-area-bottom">
                <p> <Link to="#">Reactheme©</Link> 2024. All Rights Reserved.</p>
            </div>
        </>
    );
};

export default ManageSubscription;