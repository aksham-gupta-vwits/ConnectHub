import React, { useState, useEffect, useRef } from 'react';
import { useHistory } from 'react-router-dom';
import {
  GroupuiCard,
  GroupuiButton,
  GroupuiInput,
  GroupuiHeadline,
  GroupuiText,
  GroupuiDivider,
  GroupuiSelect,
  GroupuiSelectOption,
  GroupuiCheckbox,
  GroupuiLoadingSpinner
} from '@group-ui/group-ui-react';
import apiService from '../services/apiService';

// ---------------------------------------------------------------------------
// Password strength helper
// ---------------------------------------------------------------------------
const getPasswordStrength = (pwd) => {
  let score = 0;
  if (pwd.length >= 8) score++;
  if (/[A-Z]/.test(pwd)) score++;
  if (/[0-9]/.test(pwd)) score++;
  if (/[^A-Za-z0-9]/.test(pwd)) score++;
  if (score <= 1) return { label: 'Weak',   color: '#e53935', width: '25%'  };
  if (score <= 2) return { label: 'Fair',   color: '#fb8c00', width: '50%'  };
  if (score <= 3) return { label: 'Good',   color: '#43a047', width: '75%'  };
  return              { label: 'Strong', color: '#00897b', width: '100%' };
};

// ---------------------------------------------------------------------------
// Left-panel feature cards data
// ---------------------------------------------------------------------------
const FEATURE_CARDS = [
  {
    icon: '🔒',
    title: 'Secure Messaging',
    desc: 'End-to-end encrypted communications'
  },
  {
    icon: '📢',
    title: 'Team Channels',
    desc: 'Organized by NSC and teams'
  },
  {
    icon: '⚡',
    title: 'Real-time Chat',
    desc: 'Instant updates across your organization'
  }
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
const RegisterPage = () => {
  const history = useHistory();
  const isMountedRef = useRef(true);

  const [isLoading, setIsLoading]       = useState(false);
  const [error, setError]               = useState('');
  const [registered, setRegistered]     = useState(false);
  const [availableNSCs, setAvailableNSCs] = useState([]);
  const [loadingNSCs, setLoadingNSCs]   = useState(false);

  const [formData, setFormData] = useState({
    firstName:       '',
    lastName:        '',
    username:        '',
    nscId:           '',
    email:           '',
    password:        '',
    confirmPassword: '',
    agreeToTerms:    false
  });

  // Cleanup on unmount
  useEffect(() => {
    return () => { isMountedRef.current = false; };
  }, []);

  // Fetch available NSCs on mount
  useEffect(() => {
    const fetchNSCs = async () => {
      setLoadingNSCs(true);
      try {
        const response = await apiService.getAvailableNSCs();
        if (isMountedRef.current) {
          setAvailableNSCs(response.nscs || []);
        }
      } catch (err) {
        console.error('Failed to fetch NSCs:', err);
      } finally {
        if (isMountedRef.current) {
          setLoadingNSCs(false);
        }
      }
    };
    fetchNSCs();
  }, []);

  // -------------------------------------------------------------------------
  // Handlers
  // -------------------------------------------------------------------------
  const handleInputChange = (e) => {
    const { name, value, checked, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isMountedRef.current) return;

    // Client-side validation
    if (!formData.nscId) {
      setError('Please select your NSC (National Service Center).');
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (!formData.agreeToTerms) {
      setError('Please agree to the Terms and Privacy Policy to continue.');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email:     formData.email,
          password:  formData.password,
          firstName: formData.firstName,
          lastName:  formData.lastName,
          username:  formData.username,
          nscId:     formData.nscId
        })
      });

      if (!isMountedRef.current) return;

      if (response.ok) {
        setRegistered(true);
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Registration failed. Please try again.');
      }
    } catch (err) {
      if (isMountedRef.current) {
        setError('Registration failed. Please check your connection and try again.');
      }
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  };

  // -------------------------------------------------------------------------
  // Derived values
  // -------------------------------------------------------------------------
  const strength = getPasswordStrength(formData.password);

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------
  return (
    <div style={{
      minHeight:       '100vh',
      backgroundColor: '#f0f4f8',
      display:         'flex',
      alignItems:      'center',
      justifyContent:  'center',
      padding:         '24px'
    }}>
      <div style={{ width: '100%', maxWidth: '1100px' }}>
        <GroupuiCard elevation="4" padding="0">
          <div style={{ display: 'flex', minHeight: '700px' }}>

            {/* ============================================================
                Left decorative panel  (60%)
                ============================================================ */}
            <div style={{
              flex:            '0 0 60%',
              backgroundColor: '#008075',
              color:           'white',
              padding:         '60px 52px',
              display:         'flex',
              flexDirection:   'column',
              justifyContent:  'center'
            }}>

              {/* CH logo box */}
              <div style={{
                width:           '72px',
                height:          '72px',
                backgroundColor: 'white',
                borderRadius:    '16px',
                display:         'flex',
                alignItems:      'center',
                justifyContent:  'center',
                marginBottom:    '28px',
                boxShadow:       '0 4px 20px rgba(0,0,0,0.20)'
              }}>
                <span style={{
                  fontSize:      '28px',
                  fontWeight:    '800',
                  color:         '#008075',
                  letterSpacing: '-1px'
                }}>
                  CH
                </span>
              </div>

              {/* Headline */}
              <GroupuiHeadline
                heading="h2"
                weight="bold"
                style={{ color: 'white', marginBottom: '12px' }}
              >
                Join ConnectHub
              </GroupuiHeadline>

              {/* Subtext */}
              <GroupuiText style={{
                color:        'rgba(255,255,255,0.85)',
                fontSize:     '15px',
                lineHeight:   '1.65',
                marginBottom: '40px',
                maxWidth:     '420px'
              }}>
                A secure internal communication platform for NSCs across the APAC
                region. Connect, collaborate, and communicate in a professional,
                encrypted environment built for your organization.
              </GroupuiText>

              {/* Feature highlight cards */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {FEATURE_CARDS.map((card) => (
                  <div
                    key={card.title}
                    style={{
                      backgroundColor: 'rgba(255,255,255,0.15)',
                      borderRadius:    '12px',
                      padding:         '16px 20px',
                      display:         'flex',
                      alignItems:      'flex-start',
                      gap:             '14px',
                      boxShadow:       '0 2px 10px rgba(0,0,0,0.12)'
                    }}
                  >
                    <span style={{ fontSize: '22px', marginTop: '1px', flexShrink: 0 }}>
                      {card.icon}
                    </span>
                    <div>
                      <div style={{
                        fontWeight:   '700',
                        fontSize:     '14px',
                        color:        'white',
                        marginBottom: '3px'
                      }}>
                        {card.title}
                      </div>
                      <div style={{
                        fontSize:   '13px',
                        color:      'rgba(255,255,255,0.78)',
                        lineHeight: '1.4'
                      }}>
                        {card.desc}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* ============================================================
                Right form panel  (40%)
                ============================================================ */}
            <div style={{
              flex:            '0 0 40%',
              backgroundColor: 'white',
              overflowY:       'auto',
              padding:         '40px 44px',
              display:         'flex',
              flexDirection:   'column'
            }}>

              {/* --------------------------------------------------------
                  SUCCESS STATE — replaces the form after submission
                  -------------------------------------------------------- */}
              {registered ? (
                <div style={{
                  flex:           1,
                  display:        'flex',
                  flexDirection:  'column',
                  alignItems:     'center',
                  justifyContent: 'center',
                  textAlign:      'center',
                  padding:        '20px 0'
                }}>
                  {/* Checkmark circle */}
                  <div style={{
                    width:           '88px',
                    height:          '88px',
                    borderRadius:    '50%',
                    backgroundColor: '#e8f5e9',
                    border:          '3px solid #43a047',
                    display:         'flex',
                    alignItems:      'center',
                    justifyContent:  'center',
                    marginBottom:    '28px'
                  }}>
                    <span style={{ fontSize: '42px', color: '#2e7d32', lineHeight: 1 }}>
                      ✓
                    </span>
                  </div>

                  <GroupuiHeadline
                    heading="h3"
                    weight="bold"
                    style={{ marginBottom: '14px', color: '#1a1a1a' }}
                  >
                    Registration Submitted!
                  </GroupuiHeadline>

                  <GroupuiText style={{
                    color:        '#555',
                    fontSize:     '15px',
                    lineHeight:   '1.65',
                    marginBottom: '36px',
                    maxWidth:     '320px'
                  }}>
                    Your account is pending admin approval. You will receive access
                    once an NSC administrator reviews and approves your request.
                  </GroupuiText>

                  <GroupuiButton
                    variant="primary"
                    size="l"
                    onClick={() => history.push('/login')}
                  >
                    Back to Sign In
                  </GroupuiButton>
                </div>

              ) : (
                /* --------------------------------------------------------
                   REGISTRATION FORM
                   -------------------------------------------------------- */
                <>
                  {/* Header row */}
                  <div style={{
                    display:        'flex',
                    justifyContent: 'space-between',
                    alignItems:     'center',
                    marginBottom:   '20px'
                  }}>
                    <GroupuiHeadline heading="h3" weight="normal">
                      Create Account
                    </GroupuiHeadline>

                    <GroupuiButton
                      size="m"
                      variant="tertiary"
                      onClick={() => history.push('/login')}
                    >
                      Sign in
                    </GroupuiButton>
                  </div>

                  <GroupuiDivider style={{ margin: '0 0 24px 0' }} />

                  {/* Inline error banner */}
                  {error && (
                    <div style={{
                      backgroundColor: '#fdecea',
                      border:          '1px solid #f5c6cb',
                      borderRadius:    '8px',
                      padding:         '12px 16px',
                      marginBottom:    '20px',
                      color:           '#c62828',
                      fontSize:        '14px',
                      lineHeight:      '1.5'
                    }}>
                      {error}
                    </div>
                  )}

                  {/* Form */}
                  <form
                    onSubmit={handleSubmit}
                    style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}
                  >

                    {/* First Name + Last Name */}
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

                    {/* Username */}
                    <GroupuiInput
                      placeholder="Choose a username"
                      name="username"
                      value={formData.username}
                      onGroupuiChange={handleInputChange}
                      required
                      type="text"
                    >
                      <span slot="label">Username</span>
                    </GroupuiInput>

                    {/* NSC Selector */}
                    <div>
                      <GroupuiText style={{
                        fontSize:     '14px',
                        fontWeight:   '600',
                        marginBottom: '8px',
                        color:        '#333'
                      }}>
                        NSC (National Service Center) *
                      </GroupuiText>

                      {loadingNSCs ? (
                        <div style={{
                          display:      'flex',
                          alignItems:   'center',
                          gap:          '10px',
                          padding:      '12px 14px',
                          border:       '1px solid #ccc',
                          borderRadius: '6px'
                        }}>
                          <GroupuiLoadingSpinner size="s" />
                          <GroupuiText style={{ color: '#6c757d', fontSize: '14px' }}>
                            Loading NSCs...
                          </GroupuiText>
                        </div>
                      ) : (
                        <GroupuiSelect
                          value={formData.nscId}
                          onGroupuiChange={(e) =>
                            handleInputChange({ target: { name: 'nscId', value: e.target.value } })
                          }
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

                      <GroupuiText style={{
                        fontSize:  '12px',
                        color:     '#888',
                        marginTop: '4px'
                      }}>
                        Select the National Service Center you belong to
                      </GroupuiText>
                    </div>

                    {/* Email */}
                    <GroupuiInput
                      placeholder="you@example.com"
                      name="email"
                      value={formData.email}
                      onGroupuiChange={handleInputChange}
                      required
                      type="email"
                    >
                      <span slot="label">Email</span>
                    </GroupuiInput>

                    {/* Password + strength meter */}
                    <div>
                      <GroupuiInput
                        placeholder="Create a password"
                        name="password"
                        value={formData.password}
                        onGroupuiChange={handleInputChange}
                        required
                        type="password"
                      >
                        <span slot="label">Password</span>
                      </GroupuiInput>

                      {formData.password.length > 0 && (
                        <div style={{ marginTop: '6px' }}>
                          <div style={{
                            height:          '4px',
                            backgroundColor: '#e0e0e0',
                            borderRadius:    '2px',
                            overflow:        'hidden'
                          }}>
                            <div style={{
                              height:          '100%',
                              width:           strength.width,
                              backgroundColor: strength.color,
                              borderRadius:    '2px',
                              transition:      'width 0.3s ease, background-color 0.3s ease'
                            }} />
                          </div>
                          <span style={{
                            fontSize:   '12px',
                            color:      strength.color,
                            marginTop:  '4px',
                            display:    'block'
                          }}>
                            {strength.label}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Confirm Password + match indicator */}
                    <div>
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

                      {formData.confirmPassword.length > 0 && (
                        <div style={{
                          fontSize:  '12px',
                          marginTop: '4px',
                          color:     formData.password === formData.confirmPassword
                            ? '#00897b'
                            : '#e53935'
                        }}>
                          {formData.password === formData.confirmPassword
                            ? '✓ Passwords match'
                            : '✗ Passwords do not match'}
                        </div>
                      )}
                    </div>

                    {/* Terms checkbox */}
                    <GroupuiCheckbox
                      name="agreeToTerms"
                      checked={formData.agreeToTerms}
                      onGroupuiChange={handleInputChange}
                    >
                      I agree to the Terms and Privacy Policy
                    </GroupuiCheckbox>

                    {/* Submit button */}
                    <GroupuiButton
                      type="submit"
                      variant="primary"
                      fullWidth="true"
                      size="l"
                      style={{ marginTop: '4px' }}
                    >
                      {isLoading ? (
                        <div style={{
                          display:        'flex',
                          alignItems:     'center',
                          gap:            '8px',
                          justifyContent: 'center'
                        }}>
                          <GroupuiLoadingSpinner size="s" />
                          Creating account...
                        </div>
                      ) : (
                        'Create Account'
                      )}
                    </GroupuiButton>
                  </form>

                  {/* Footer */}
                  <div style={{
                    textAlign:    'center',
                    marginTop:    '28px',
                    paddingTop:   '20px',
                    borderTop:    '1px solid #eee'
                  }}>
                    <GroupuiText style={{ color: '#888', fontSize: '13px' }}>
                      Need help? Contact your NSC administrator
                    </GroupuiText>
                  </div>
                </>
              )}
            </div>
          </div>
        </GroupuiCard>
      </div>
    </div>
  );
};

export default RegisterPage;
