import React, { useEffect } from "react";
import { Container, Row, Col, Card, Button, Alert, Spinner } from "react-bootstrap";
import { useNavigate, useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "Slices/theme/store";
import { verifyCheckoutSession, clearCreditErrors, clearSuccessMessage } from "Slices/CreditSlice";
import { fetchUserData } from "Slices/AuthSlice";
import useSidebarToggle from "Common/UseSideberToggleHooks";

const PaymentResult: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const dispatch = useDispatch<AppDispatch>();
    const themeSidebarToggle = useSidebarToggle();
    
    // Access Redux state
    const auth = useSelector((state: RootState) => state.auth);
    const { isLoading, error, successMessage } = useSelector((state: RootState) => state.credits);
    
    useEffect(() => {
        // Clean up state on component unmount
        return () => {
            dispatch(clearCreditErrors());
            dispatch(clearSuccessMessage());
        };
    }, [dispatch]);
    
    useEffect(() => {
        const verifyPayment = async () => {
            const params = new URLSearchParams(location.search);
            const sessionId = params.get('session_id');
            const resultStatus = params.get('result');
            
            if (!sessionId) {
                return;
            }
            
            // If result is failure, don't proceed with verification
            if (resultStatus === 'failure') {
                return;
            }
            
            // Verify the session
            await dispatch(verifyCheckoutSession({ sessionId }));
            
            // Refresh user data to get updated credits
            if (auth.user?.id) {
                dispatch(fetchUserData());
            }
        };
        
        verifyPayment();
    }, [location, dispatch, auth.user?.id]);
    
    // Determine the result status from URL params or state
    const getResultStatus = () => {
        const params = new URLSearchParams(location.search);
        const resultStatus = params.get('result');
        
        if (error) return 'error';
        if (resultStatus === 'failure') return 'cancelled';
        if (successMessage) return 'success';
        return 'pending';
    };
    
    const status = getResultStatus();
    const plan = new URLSearchParams(location.search).get('plan') || '';
    
    return (
        <>
            <div className={`main-center-content-m-left ${themeSidebarToggle ? "collapsed" : ""}`}>
                <Container className="my-5">
                    <Row className="justify-content-center">
                        <Col md={8} lg={6}>
                            <Card className="shadow-sm border-0">
                                <Card.Body className="p-5 text-center">
                                    {status === 'pending' ? (
                                        <>
                                            <div className="mb-3">
                                                <Spinner animation="border" role="status" variant="primary">
                                                    <span className="visually-hidden">Loading...</span>
                                                </Spinner>
                                            </div>
                                            <h3>Verifying your payment...</h3>
                                            <p>Please wait while we process your subscription.</p>
                                        </>
                                    ) : status === 'success' ? (
                                        <>
                                            <div className="text-success mb-4">
                                                <i className="fa-solid fa-circle-check fa-4x"></i>
                                            </div>
                                            <h3>Subscription Successful!</h3>
                                            <p>{successMessage}</p>
                                            <div className="my-4 p-3 bg-light rounded">
                                                <p className="mb-1">Plan: <strong>{plan}</strong></p>
                                                <p className="mb-0">Available Credits: <strong>{auth.user?.credits || 0}</strong></p>
                                            </div>
                                            <Button 
                                                variant="primary" 
                                                className="mt-2"
                                                onClick={() => navigate('/')}
                                            >
                                                Go to Dashboard
                                            </Button>
                                        </>
                                    ) : status === 'cancelled' ? (
                                        <>
                                            <div className="text-warning mb-4">
                                                <i className="fa-solid fa-triangle-exclamation fa-4x"></i>
                                            </div>
                                            <h3>Payment Cancelled</h3>
                                            <p>Your subscription was not processed.</p>
                                            <Button 
                                                variant="primary" 
                                                className="mt-3"
                                                onClick={() => navigate('/manage-subscription')}
                                            >
                                                Try Again
                                            </Button>
                                        </>
                                    ) : (
                                        <>
                                            <div className="text-danger mb-4">
                                                <i className="fa-solid fa-circle-exclamation fa-4x"></i>
                                            </div>
                                            <h3>Something went wrong</h3>
                                            <p>{error || "An error occurred during payment processing."}</p>
                                            <Button 
                                                variant="primary" 
                                                className="mt-3"
                                                onClick={() => navigate('/manage-subscription')}
                                            >
                                                Back to Subscription
                                            </Button>
                                        </>
                                    )}
                                </Card.Body>
                            </Card>
                        </Col>
                    </Row>
                </Container>
            </div>
        </>
    );
};

export default PaymentResult;