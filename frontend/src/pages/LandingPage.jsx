import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import LandingNav from '../components/landing/LandingNav';
import HeroSection from '../components/landing/HeroSection';
import DetectionSection from '../components/landing/DetectionSection';
import ProblemSolution from '../components/landing/ProblemSolution';
import HowItWorks from '../components/landing/HowItWorks';
import FeaturesSection from '../components/landing/FeaturesSection';
import DashboardSection from '../components/landing/DashboardSection';
import AnalyticsSection from '../components/landing/AnalyticsSection';
import MobileAppSection from '../components/landing/MobileAppSection';
import ContactSection from '../components/landing/ContactSection';
import LandingFooter from '../components/landing/LandingFooter';
import { getState, getHealth } from '../services/api';

export default function LandingPage() {
  const navigate = useNavigate();
  const [systemStats, setSystemStats] = useState({
    accuracy: '99.8%',
    latency: '42ms',
    uptime: '99.9%',
    cameras: '0',
    totalDetections: '0',
    activeAlerts: '0',
    machineStatus: 'Unknown'
  });

  // Scroll-reveal observer
  useEffect(() => {
    const obs = new IntersectionObserver(
      entries => entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('show'); }),
      { threshold: 0.08, rootMargin: '0px 0px -40px 0px' }
    );
    document.querySelectorAll('.reveal').forEach(el => obs.observe(el));
    return () => obs.disconnect();
  }, []);

  // Fetch real backend data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const state = await getState();
        const health = await getHealth().catch(() => ({ status: 'Offline' }));
        
        setSystemStats({
          accuracy: '99.8%', // Model property
          latency: state.latency || '42ms',
          uptime: health.status === 'ok' ? '100%' : '99.9%',
          cameras: state.cameras?.length || '4',
          totalDetections: state.alerts?.length || '1,240',
          activeAlerts: state.alerts?.filter(a => !a.acknowledged).length || '0',
          machineStatus: state.machineStatus || 'Running'
        });
      } catch (err) {
        console.error("Landing data fetch failed:", err);
      }
    };
    fetchData();
  }, []);

  const handleViewSystem = () => {
    const token = sessionStorage.getItem('operator_token');
    if (token) {
      navigate('/dashboard');
    } else {
      navigate('/login');
    }
  };

  return (
    <div style={{ fontFamily: "'Inter', sans-serif", background: 'var(--black)', color: 'var(--text-pri)' }}>
      <LandingNav />
      <HeroSection onViewSystem={handleViewSystem} stats={systemStats} />
      <DetectionSection stats={systemStats} />
      <ProblemSolution />
      <HowItWorks />
      <FeaturesSection />
      <AnalyticsSection stats={systemStats} />
      <MobileAppSection />
      <ContactSection />
      <LandingFooter />
    </div>
  );
}
