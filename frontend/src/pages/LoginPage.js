import React, { useState, useEffect, useRef } from 'react';
import { useHistory } from 'react-router-dom';
import styled, { keyframes } from 'styled-components';
import { useAuth } from '../contexts/AuthContext';
import CustomNotification from '../components/CustomNotification';

// ── Keyframe Animations ───────────────────────────────────────────────────────
const fadeInUp = keyframes`
  from { opacity: 0; transform: translateY(30px); }
  to   { opacity: 1; transform: translateY(0); }
`;

const fadeIn = keyframes`
  from { opacity: 0; }
  to   { opacity: 1; }
`;

const pulse = keyframes`
  0%, 100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(0, 201, 177, 0.5); }
  50%       { transform: scale(1.06); box-shadow: 0 0 0 18px rgba(0, 201, 177, 0); }
`;

const floatOrb = keyframes`
  0%, 100% { transform: translate(0, 0) scale(1); }
  33%       { transform: translate(40px, -60px) scale(1.1); }
  66%       { transform: translate(-30px, 25px) scale(0.92); }
`;

const rotateRing = keyframes`
  from { transform: rotate(0deg); }
  to   { transform: rotate(360deg); }
`;

const slideInLeft = keyframes`
  from { opacity: 0; transform: translateX(-40px); }
  to   { opacity: 1; transform: translateX(0); }
`;

const shimmer = keyframes`
  0%   { left: -60%; }
  100% { left: 130%; }
`;

const spin = keyframes`
  from { transform: rotate(0deg); }
  to   { transform: rotate(360deg); }
`;

const dotBounce = keyframes`
  0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; }
  40%           { transform: scale(1);   opacity: 1; }
`;

// ── Layout ────────────────────────────────────────────────────────────────────
const PageWrapper = styled.div`
  min-height: 100vh;
  background: linear-gradient(135deg, #080d14 0%, #001510 55%, #001a17 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  position: relative;
  overflow: hidden;
`;

const Orb = styled.div`
  position: absolute;
  border-radius: 50%;
  filter: blur(90px);
  pointer-events: none;
  animation: ${floatOrb} ${props => props.duration || '10s'} ease-in-out infinite;
  animation-delay: ${props => props.delay || '0s'};
  opacity: 0.25;
`;

const GlassCard = styled.div`
  width: 100%;
  max-width: 1020px;
  background: rgba(255, 255, 255, 0.04);
  backdrop-filter: blur(24px);
  -webkit-backdrop-filter: blur(24px);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 28px;
  overflow: hidden;
  display: flex;
  box-shadow:
    0 30px 80px rgba(0, 0, 0, 0.6),
    0 0 0 1px rgba(255, 255, 255, 0.04),
    inset 0 1px 0 rgba(255, 255, 255, 0.08);
  animation: ${fadeIn} 0.9s cubic-bezier(0.22, 1, 0.36, 1);
  position: relative;
  z-index: 10;

  @media (max-width: 768px) {
    flex-direction: column;
    max-width: 480px;
  }
`;

// ── Left Panel ────────────────────────────────────────────────────────────────
const LeftPanel = styled.div`
  flex: 7;
  background: linear-gradient(145deg, rgba(0, 128, 117, 0.75) 0%, rgba(0, 55, 50, 0.9) 100%);
  padding: 64px 44px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  position: relative;
  overflow: hidden;
  min-height: 620px;

  @media (max-width: 768px) {
    display: none;
  }
`;

const Ring = styled.div`
  position: absolute;
  border-radius: 50%;
  border: 1px solid rgba(255, 255, 255, 0.08);
  pointer-events: none;
  animation: ${rotateRing} ${props => props.duration || '24s'} linear infinite;
  animation-direction: ${props => props.reverse ? 'reverse' : 'normal'};
`;

const LogoWrapper = styled.div`
  width: 88px;
  height: 88px;
  background: white;
  border-radius: 22px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 32px;
  animation: ${pulse} 3.5s ease-in-out infinite;
  flex-shrink: 0;
`;

const LogoText = styled.span`
  font-size: 34px;
  font-weight: 900;
  color: #008075;
  letter-spacing: -2px;
`;

const HeroTitle = styled.h1`
  font-size: 44px;
  font-weight: 800;
  color: white;
  margin: 0 0 18px 0;
  line-height: 1.1;
  letter-spacing: -1px;
  animation: ${slideInLeft} 0.8s cubic-bezier(0.22, 1, 0.36, 1) 0.15s both;
`;

const HeroSubtitle = styled.p`
  font-size: 15px;
  color: rgba(255, 255, 255, 0.7);
  line-height: 1.75;
  margin: 0 0 44px 0;
  max-width: 340px;
  animation: ${slideInLeft} 0.8s cubic-bezier(0.22, 1, 0.36, 1) 0.3s both;
`;

const FeatureList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 14px;
  animation: ${slideInLeft} 0.8s cubic-bezier(0.22, 1, 0.36, 1) 0.45s both;
`;

const FeatureItem = styled.div`
  display: flex;
  align-items: center;
  gap: 14px;
  color: rgba(255, 255, 255, 0.82);
  font-size: 14px;
`;

const FeatureIcon = styled.div`
  width: 32px;
  height: 32px;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.12);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 15px;
  flex-shrink: 0;
`;

// ── Right Panel ───────────────────────────────────────────────────────────────
const RightPanel = styled.div`
  flex: 5;
  padding: 52px 44px;
  display: flex;
  flex-direction: column;
  background: rgba(0, 0, 0, 0.1);
`;

const RightHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 32px;
  animation: ${fadeInUp} 0.6s ease-out 0.2s both;
`;

const FormTitle = styled.h2`
  font-size: 26px;
  font-weight: 700;
  color: white;
  margin: 0;
`;

const SignUpLink = styled.button`
  background: rgba(0, 201, 177, 0.1);
  border: 1px solid rgba(0, 201, 177, 0.3);
  border-radius: 8px;
  color: #00c9b1;
  font-size: 13px;
  font-weight: 600;
  padding: 8px 16px;
  cursor: pointer;
  transition: all 0.25s ease;

  &:hover {
    background: rgba(0, 201, 177, 0.2);
    border-color: rgba(0, 201, 177, 0.6);
    transform: translateY(-1px);
  }
`;

const SSOButton = styled.button`
  width: 100%;
  padding: 14px;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 14px;
  color: rgba(255, 255, 255, 0.9);
  font-size: 15px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  animation: ${fadeInUp} 0.6s ease-out 0.35s both;

  &:hover {
    background: rgba(255, 255, 255, 0.11);
    border-color: rgba(255, 255, 255, 0.3);
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.3);
  }
`;

const Divider = styled.div`
  display: flex;
  align-items: center;
  gap: 14px;
  margin: 22px 0;
  animation: ${fadeInUp} 0.6s ease-out 0.45s both;

  &::before, &::after {
    content: '';
    flex: 1;
    height: 1px;
    background: rgba(255, 255, 255, 0.1);
  }

  span {
    color: rgba(255, 255, 255, 0.3);
    font-size: 12px;
    text-transform: uppercase;
    letter-spacing: 1.5px;
  }
`;

const InputGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 18px;
  animation: ${fadeInUp} 0.6s ease-out ${props => props.delay || '0.5s'} both;
`;

const Label = styled.label`
  font-size: 12px;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.55);
  text-transform: uppercase;
  letter-spacing: 0.8px;
`;

const StyledInput = styled.input`
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 12px;
  padding: 14px 16px;
  color: white;
  font-size: 15px;
  outline: none;
  transition: all 0.3s ease;
  width: 100%;
  box-sizing: border-box;

  &::placeholder {
    color: rgba(255, 255, 255, 0.25);
  }

  &:focus {
    border-color: rgba(0, 201, 177, 0.6);
    background: rgba(0, 201, 177, 0.06);
    box-shadow: 0 0 0 3px rgba(0, 201, 177, 0.12);
  }

  &:-webkit-autofill {
    -webkit-box-shadow: 0 0 0 1000px #0a1f1d inset;
    -webkit-text-fill-color: white;
  }
`;

const SubmitButton = styled.button`
  width: 100%;
  padding: 15px;
  background: linear-gradient(135deg, #008075 0%, #00c9b1 100%);
  border: none;
  border-radius: 14px;
  color: white;
  font-size: 15px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
  animation: ${fadeInUp} 0.6s ease-out 0.75s both;
  letter-spacing: 0.3px;

  &:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 10px 30px rgba(0, 128, 117, 0.55);
  }

  &:active:not(:disabled) {
    transform: translateY(0);
  }

  &:disabled {
    opacity: 0.75;
    cursor: not-allowed;
  }

  &::after {
    content: '';
    position: absolute;
    top: -50%;
    width: 35%;
    height: 200%;
    background: rgba(255, 255, 255, 0.18);
    transform: skewX(-20deg);
    animation: ${shimmer} 2.5s ease-in-out infinite;
  }
`;

const SpinnerRing = styled.div`
  width: 17px;
  height: 17px;
  border: 2px solid rgba(255, 255, 255, 0.35);
  border-top-color: white;
  border-radius: 50%;
  animation: ${spin} 0.75s linear infinite;
  flex-shrink: 0;
`;

const FooterText = styled.div`
  text-align: center;
  margin-top: auto;
  padding-top: 28px;
  font-size: 13px;
  color: rgba(255, 255, 255, 0.3);
  animation: ${fadeInUp} 0.6s ease-out 0.9s both;
  line-height: 1.8;

  a {
    color: #00c9b1;
    cursor: pointer;
    text-decoration: none;
    font-weight: 600;

    &:hover { text-decoration: underline; }
  }
`;

// ── Component ─────────────────────────────────────────────────────────────────
const FEATURES = [
  { icon: '🔒', text: 'End-to-end encrypted messaging' },
  { icon: '⚡', text: 'Real-time collaboration tools' },
  { icon: '🛡️', text: 'Role-based access control' },
  { icon: '🌏', text: 'NSC-wide channel management' },
];

const LoginPage = () => {
  const { login } = useAuth();
  const history = useHistory();
  const isMountedRef = useRef(true);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [formData, setFormData] = useState({ email: '', password: '' });

  useEffect(() => {
    return () => { isMountedRef.current = false; };
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (error) setError('');
    if (successMessage) setSuccessMessage('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isMountedRef.current) return;
    setIsLoading(true);
    setError('');
    const result = await login({ email: formData.email, password: formData.password });
    if (!isMountedRef.current) return;
    if (!result.success) setError(result.error || 'Login failed. Please try again.');
    if (isMountedRef.current) setIsLoading(false);
  };

  const handleSSOLogin = () => {
    window.location.href = '/api/auth/sso';
  };

  return (
    <PageWrapper>
      {/* Ambient orbs */}
      <Orb style={{ width: 500, height: 500, background: '#008075', top: '-160px', left: '-160px' }} duration="13s" />
      <Orb style={{ width: 350, height: 350, background: '#00c9b1', bottom: '-80px', right: '-80px' }} duration="10s" delay="2s" />
      <Orb style={{ width: 220, height: 220, background: '#004d45', top: '45%', left: '35%' }} duration="16s" delay="1.5s" />
      <Orb style={{ width: 150, height: 150, background: '#006b62', top: '20%', right: '20%' }} duration="9s" delay="4s" />

      <GlassCard>
        {/* ── LEFT PANEL ── */}
        <LeftPanel>
          <Ring style={{ width: 340, height: 340, top: '-140px', right: '-140px' }} duration="28s" />
          <Ring style={{ width: 220, height: 220, bottom: '-90px', left: '-90px' }} duration="22s" reverse />
          <Ring style={{ width: 160, height: 160, bottom: '28%', right: '-60px' }} duration="35s" />

          <LogoWrapper>
            <LogoText>CH</LogoText>
          </LogoWrapper>

          <HeroTitle>
            Connect.<br />
            Collaborate.<br />
            Communicate.
          </HeroTitle>

          <HeroSubtitle>
            A secure internal platform for NSCs across the APAC region.
            Built for teams that need to move fast and stay in sync.
          </HeroSubtitle>

          <FeatureList>
            {FEATURES.map(({ icon, text }) => (
              <FeatureItem key={text}>
                <FeatureIcon>{icon}</FeatureIcon>
                {text}
              </FeatureItem>
            ))}
          </FeatureList>
        </LeftPanel>

        {/* ── RIGHT PANEL ── */}
        <RightPanel>
          <RightHeader>
            <FormTitle>Welcome back</FormTitle>
            <SignUpLink onClick={() => history.push('/register')}>
              Sign up
            </SignUpLink>
          </RightHeader>

          <SSOButton onClick={handleSSOLogin} type="button">
            <svg width="18" height="18" viewBox="0 0 21 21" fill="none">
              <rect x="0"  y="0"  width="10" height="10" fill="#f25022" />
              <rect x="11" y="0"  width="10" height="10" fill="#7fba00" />
              <rect x="0"  y="11" width="10" height="10" fill="#00a4ef" />
              <rect x="11" y="11" width="10" height="10" fill="#ffb900" />
            </svg>
            Continue with Windows SSO
          </SSOButton>

          <Divider><span>or sign in with email</span></Divider>

          {error && (
            <CustomNotification
              message={error}
              severity="error"
              onClose={() => setError('')}
              autoHideDuration={6000}
              style={{ position: 'relative', top: 'auto', right: 'auto', marginBottom: '16px', maxWidth: '100%' }}
            />
          )}
          {successMessage && (
            <CustomNotification
              message={successMessage}
              severity="success"
              onClose={() => setSuccessMessage('')}
              autoHideDuration={5000}
              style={{ position: 'relative', top: 'auto', right: 'auto', marginBottom: '16px', maxWidth: '100%' }}
            />
          )}

          <form onSubmit={handleSubmit} style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            <InputGroup delay="0.5s">
              <Label htmlFor="email">Email</Label>
              <StyledInput
                id="email"
                type="email"
                name="email"
                placeholder="you@company.com"
                value={formData.email}
                onChange={handleInputChange}
                required
                autoComplete="email"
              />
            </InputGroup>

            <InputGroup delay="0.62s">
              <Label htmlFor="password">Password</Label>
              <StyledInput
                id="password"
                type="password"
                name="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={handleInputChange}
                required
                autoComplete="current-password"
              />
            </InputGroup>

            <div style={{ marginTop: '8px', marginBottom: '8px' }}>
              <SubmitButton type="submit" disabled={isLoading}>
                {isLoading ? (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                    <SpinnerRing />
                    Signing in...
                  </div>
                ) : 'Sign in'}
              </SubmitButton>
            </div>
          </form>

          <FooterText>
            Need help?{' '}
            <a href="#">Contact your NSC administrator</a>
          </FooterText>
        </RightPanel>
      </GlassCard>
    </PageWrapper>
  );
};

export default LoginPage;
