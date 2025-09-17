import React, { useState, useEffect, useRef } from 'react';
import { 
  GroupuiCard, 
  GroupuiButton, 
  GroupuiInput, 
  GroupuiHeadline, 
  GroupuiText, 
  GroupuiBrandLogo,
  GroupuiDivider,
  GroupuiGrid,
  GroupuiGridRow,
  GroupuiGridCol,
  GroupuiCheckbox,
  GroupuiSelect,
  GroupuiSelectOption,
  GroupuiLoadingSpinner
} from '@group-ui/group-ui-react';
import { useAuth } from '../contexts/AuthContext';
import CustomNotification from '../components/CustomNotification';
import apiService from '../services/apiService';

const LoginPage = () => {
  const { login } = useAuth();
  const isMountedRef = useRef(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [availableNSCs, setAvailableNSCs] = useState([]);
  const [loadingNSCs, setLoadingNSCs] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    username: '',
    nscId: '',
    confirmPassword: '',
    agreeToTerms: false
  });

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Fetch available NSCs when switching to signup
  useEffect(() => {
    const fetchNSCs = async () => {
      if (!isSignUp) return;
      
      setLoadingNSCs(true);
      try {
        const response = await apiService.getAvailableNSCs();
        if (isMountedRef.current) {
          setAvailableNSCs(response.nscs || []);
        }
      } catch (error) {
        console.error('Failed to fetch NSCs:', error);
        if (isMountedRef.current) {
          setError('Failed to load available NSCs. Please try again.');
        }
      } finally {
        if (isMountedRef.current) {
          setLoadingNSCs(false);
        }
      }
    };

    fetchNSCs();
  }, [isSignUp]);

  const handleInputChange = (e) => {
    const { name, value, checked, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    // Clear error when user starts typing
    if (error) setError('');
    if (successMessage) setSuccessMessage('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isMountedRef.current) return;
    
    setIsLoading(true);
    setError('');

    if (isSignUp) {
      // Handle sign up
      if (formData.password !== formData.confirmPassword) {
        if (isMountedRef.current) {
          setError('Passwords do not match');
          setIsLoading(false);
        }
        return;
      }
      if (!formData.agreeToTerms) {
        if (isMountedRef.current) {
          setError('Please agree to the Terms and Privacy Policy');
          setIsLoading(false);
        }
        return;
      }
      
      if (!formData.nscId) {
        if (isMountedRef.current) {
          setError('Please select your NSC (National Service Center)');
          setIsLoading(false);
        }
        return;
      }
      
      try {
        const response = await fetch('/api/auth/register', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            email: formData.email,
            password: formData.password,
            firstName: formData.firstName,
            lastName: formData.lastName,
            username: formData.username,
            nscId: formData.nscId
          })
        });

        if (!isMountedRef.current) return;

        if (response.ok) {
          const result = await response.json();
          setError('');
          if (result.needsApproval) {
            setSuccessMessage('Registration submitted successfully! Your account is pending admin approval. You will receive access once approved.');
          } else {
            setSuccessMessage('Account created successfully! Please sign in with your new credentials.');
          }
          setIsSignUp(false);
          setFormData({
            ...formData,
            firstName: '',
            lastName: '',
            confirmPassword: '',
            agreeToTerms: false
          });
        } else {
          const errorData = await response.json();
          setError(errorData.message || 'Registration failed');
        }
      } catch (error) {
        if (isMountedRef.current) {
          setError('Registration failed. Please try again.');
        }
      }
    } else {
      // Handle sign in
      const result = await login({
        email: formData.email,
        password: formData.password
      });
      
      if (!isMountedRef.current) return;
      
      if (!result.success) {
        setError(result.error || 'Login failed. Please try again.');
      }
    }
    
    if (isMountedRef.current) {
      setIsLoading(false);
    }
  };

  const handleSSOLogin = () => {
    // Redirect to Windows SSO endpoint
    window.location.href = '/api/auth/sso';
  };

  const toggleMode = () => {
    setIsSignUp(!isSignUp);
    setError('');
    setSuccessMessage('');
    setFormData({
      email: '',
      password: '',
      firstName: '',
      lastName: '',
      confirmPassword: '',
      agreeToTerms: false
    });
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#f8f9fa',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      <div style={{ width: '100%', maxWidth: '1000px' }}>
        <GroupuiCard elevation="4" padding="0">
          <GroupuiGrid gutter="0px">
            <GroupuiGridRow>
              {/* Left Banner - Hidden on mobile */}
              <GroupuiGridCol l="7" m="7" s="0">
                <div style={{
                  backgroundColor: '#008075',
                  color: 'white',
                  padding: '60px 40px',
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  minHeight: '600px'
                }}>
                  <div style={{ maxWidth: '400px' }}>
                    {/* Logo placeholder */}
                    {/* <GroupuiBrandLogo></GroupuiBrandLogo> */}
                    <div style={{
                      width: '80px',
                      height: '80px',
                      backgroundColor: 'white',
                      borderRadius: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginBottom: '24px'
                    }}>
                      <span style={{
                        fontSize: '32px',
                        fontWeight: 'bold',
                        color: '#008075'
                      }}>
                        CH
                      </span>
                    </div>
                    
                    <GroupuiHeadline heading="h1" weight="normal" style={{ 
                      color: 'white',
                      marginBottom: '16px'
                    }}>
                      ConnectHub
                    </GroupuiHeadline>
                    
                    <GroupuiText style={{ 
                      color: 'rgba(255, 255, 255, 0.9)',
                      fontSize: '16px',
                      lineHeight: '1.5'
                    }}>
                      A secure internal communication platform designed for NSCs (National Service Centers) 
                      across the APAC region. Connect, collaborate, and communicate with your team members 
                      in a professional and secure environment.
                    </GroupuiText>
                  </div>
                </div>
              </GroupuiGridCol>

              {/* Right Form */}
              <GroupuiGridCol l="5" m="5" s="12">
                <div style={{
                  padding: '40px',
                  height: '100%',
                  minHeight: '600px',
                  display: 'flex',
                  flexDirection: 'column'
                }}>
                  {/* Header */}
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '24px'
                  }}>
                    <GroupuiHeadline heading="h3" weight="normal">
                      {isSignUp ? 'Sign up' : 'Sign in'}
                    </GroupuiHeadline>
                    <GroupuiButton 
                      alignment="right" 
                      size="m" 
                      variant="tertiary"
                      onClick={toggleMode}
                    >
                      {isSignUp ? 'Log in' : 'Sign up'}
                    </GroupuiButton>
                  </div>

                  <GroupuiDivider style={{ margin: '0 0 24px 0' }} />

                  {/* SSO Login Button */}
                  {!isSignUp && (
                    <>
                      <GroupuiButton
                        fullWidth="true"
                        size="l"
                        variant="secondary"
                        onClick={handleSSOLogin}
                        style={{ marginBottom: '24px' }}
                      >
                        Continue with Windows SSO
                      </GroupuiButton>

                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        margin: '20px 0',
                        color: '#6c757d'
                      }}>
                        <div style={{ flex: 1, height: '1px', backgroundColor: '#e0e0e0' }}></div>
                        <GroupuiText style={{ margin: '0 16px', fontSize: '14px' }}>
                          OR
                        </GroupuiText>
                        <div style={{ flex: 1, height: '1px', backgroundColor: '#e0e0e0' }}></div>
                      </div>
                    </>
                  )}

                  {/* Error Message */}
                  {error && (
                    <CustomNotification 
                      message={error}
                      severity="error"
                      onClose={() => setError('')}
                      autoHideDuration={6000}
                      style={{ 
                        position: 'relative',
                        top: 'auto',
                        right: 'auto',
                        marginBottom: '20px',
                        maxWidth: '100%'
                      }}
                    />
                  )}

                  {/* Success Message */}
                  {successMessage && (
                    <CustomNotification 
                      message={successMessage}
                      severity="success"
                      onClose={() => setSuccessMessage('')}
                      autoHideDuration={5000}
                      style={{ 
                        position: 'relative',
                        top: 'auto',
                        right: 'auto',
                        marginBottom: '20px',
                        maxWidth: '100%'
                      }}
                    />
                  )}

                  {/* Form */}
                  <form onSubmit={handleSubmit} style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginBottom: '24px' }}>
                      
                      {/* Name fields for sign up */}
                      {isSignUp && (
                        <>
                          <div style={{ display: 'flex', gap: '12px' }}>
                            <div style={{ flex: 1 }}>
                              <GroupuiInput
                                placeholder="First name"
                                name="firstName"
                                value={formData.firstName}
                                onGroupuiChange={handleInputChange}
                                required
                                type="text"
                              >
                                <span slot="label">First Name</span>
                              </GroupuiInput>
                            </div>
                            <div style={{ flex: 1 }}>
                              <GroupuiInput
                                placeholder="Last name"
                                name="lastName"
                                value={formData.lastName}
                                onGroupuiChange={handleInputChange}
                                required
                                type="text"
                              >
                                <span slot="label">Last Name</span>
                              </GroupuiInput>
                            </div>
                          </div>
                          <GroupuiInput
                                placeholder="UserName"
                                name="username"
                                value={formData.username}
                                onGroupuiChange={handleInputChange}
                                required
                                type="text"
                              >
                                <span slot="label">User Name</span>
                              </GroupuiInput>

                          {/* NSC Selection */}
                          <div>
                            <GroupuiText style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '8px' }}>
                              NSC (National Service Center) *
                            </GroupuiText>
                            {loadingNSCs ? (
                              <div style={{ 
                                display: 'flex', 
                                alignItems: 'center', 
                                gap: '8px', 
                                padding: '12px',
                                border: '1px solid #ccc',
                                borderRadius: '4px'
                              }}>
                                <GroupuiLoadingSpinner size="s" />
                                <GroupuiText style={{ color: '#6c757d' }}>Loading NSCs...</GroupuiText>
                              </div>
                            ) : (
                              <GroupuiSelect
                                value={formData.nscId}
                                onGroupuiChange={(e) => handleInputChange({
                                  target: { name: 'nscId', value: e.target.value }
                                })}
                                placeholder="Select your NSC"
                                required
                              >
                                <GroupuiSelectOption value="">Select your NSC</GroupuiSelectOption>
                                {availableNSCs.map(nsc => (
                                  <GroupuiSelectOption key={nsc.id} value={nsc.id}>
                                    {nsc.name} ({nsc.region})
                                  </GroupuiSelectOption>
                                ))}
                              </GroupuiSelect>
                            )}
                            <GroupuiText style={{ fontSize: '12px', color: '#6c757d', marginTop: '4px' }}>
                              Select the National Service Center you belong to
                            </GroupuiText>
                          </div>
                        </>
                      )}

                      {/* Email */}
                      <GroupuiInput
                        placeholder="Enter your email"
                        name="email"
                        value={formData.email}
                        onGroupuiChange={handleInputChange}
                        required
                        type="email"
                      >
                        <span slot="label">Email</span>
                      </GroupuiInput>

                      {/* Password */}
                      <GroupuiInput
                        placeholder="Enter your password"
                        name="password"
                        value={formData.password}
                        onGroupuiChange={handleInputChange}
                        required
                        type="password"
                      >
                        <span slot="label">Password</span>
                      </GroupuiInput>

                      {/* Confirm Password for sign up */}
                      {isSignUp && (
                        <GroupuiInput
                          placeholder="Confirm your password"
                          name="confirmPassword"
                          value={formData.confirmPassword}
                          onGroupuiChange={handleInputChange}
                          required
                          type="password"
                        >
                          <span slot="label">Confirm Password</span>
                        </GroupuiInput>
                      )}

                      {/* Terms checkbox for sign up */}
                      {isSignUp && (
                        <GroupuiCheckbox
                          name="agreeToTerms"
                          checked={formData.agreeToTerms}
                          onGroupuiChange={handleInputChange}
                        >
                          I agree to the Terms and Privacy Policy
                        </GroupuiCheckbox>
                      )}
                    </div>

                    {/* Submit Button */}
                    <GroupuiButton
                      type="submit"
                      variant="primary"
                      // disabled={isLoading || !formData.email || !formData.password || (isSignUp && (!formData.firstName || !formData.lastName || !formData.confirmPassword || !formData.agreeToTerms))}
                      // style={{
                      //   backgroundColor: '#4a154b',
                      //   marginTop: 'auto'
                      // }}
                    >
                      {isLoading ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <GroupuiLoadingSpinner size="s" />
                          {isSignUp ? 'Creating account...' : 'Signing in...'}
                        </div>
                      ) : (
                        isSignUp ? 'Sign up' : 'Sign in'
                      )}
                    </GroupuiButton>
                  </form>

                  {/* Footer */}
                  <div style={{
                    textAlign: 'center',
                    marginTop: '24px',
                    paddingTop: '20px',
                    borderTop: '1px solid #e0e0e0'
                  }}>
                    <GroupuiText style={{ color: '#6c757d', fontSize: '14px' }}>
                      Need help? Contact your NSC administrator
                    </GroupuiText>
                  </div>
                </div>
              </GroupuiGridCol>
            </GroupuiGridRow>
          </GroupuiGrid>
        </GroupuiCard>
      </div>
    </div>
  );
};

export default LoginPage;
