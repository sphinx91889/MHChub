import React from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import { Menu, Settings, LogOut, Users, UserCheck } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { signOut } from '@/lib/supabase';
import { API_TOKEN } from '@/lib/api-config';
import OnlineProvidersModal from './OnlineProvidersModal';
import NotificationsPopover from './NotificationsPopover';
import QueueTrackingModal from './QueueTrackingModal';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

export default function Layout({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = React.useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
  const [gfeQueueCount, setGfeQueueCount] = React.useState<number | null>(null);
  const [gfeError, setGfeError] = React.useState<string | null>(null);
  const [providersOnlineCount, setProvidersOnlineCount] = React.useState<number | null>(null);
  const [providersOnlineError, setProvidersOnlineError] = React.useState<string | null>(null);
  const [gfeWarningActive, setGfeWarningActive] = React.useState(false);
  const gfeHighLoadTimer = React.useRef<NodeJS.Timeout | null>(null);
  const [isQueueModalOpen, setIsQueueModalOpen] = React.useState(false);
  const [lastQueueTime, setLastQueueTime] = React.useState<string | null>(localStorage.getItem('lastQueueTime'));
  const prevQueueCountRef = React.useRef<number | null>(null);
  const [isProvidersModalOpen, setIsProvidersModalOpen] = React.useState(false);

  const handleGfeQueueUpdate = (count: number) => {
    if (count > 1) {
      if (!gfeHighLoadTimer.current) {
        gfeHighLoadTimer.current = setTimeout(() => {
          setGfeWarningActive(true);
        }, 150000);
      }
    } else {
      if (gfeHighLoadTimer.current) {
        clearTimeout(gfeHighLoadTimer.current);
        gfeHighLoadTimer.current = null;
      }
      setGfeWarningActive(false);
    }
  };

  React.useEffect(() => {
    const fetchGfeQueue = async () => {
      try {
        const response = await fetch('https://app.healthcoversonline.com/api/patient/online', {
          headers: {
            'Authorization': `Bearer ${API_TOKEN}`,
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          },
          mode: 'cors'
        });
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        setGfeQueueCount(data.payload.count);
        
        if (prevQueueCountRef.current && prevQueueCountRef.current > 0 && data.payload.count === 0) {
          const now = new Date().toLocaleString();
          setLastQueueTime(now);
          localStorage.setItem('lastQueueTime', now);
        }
        
        prevQueueCountRef.current = data.payload.count;
        
        handleGfeQueueUpdate(data.payload.count);
        setGfeError(null);
      } catch (error) {
        console.error('Error fetching GFE queue:', error);
        setGfeError('Failed to load GFE queue');
        setGfeQueueCount(null);
      }
    };

    const fetchProvidersOnline = async () => {
      try {
        const response = await fetch('https://app.healthcoversonline.com/api/provider/online', {
          headers: {
            'Authorization': `Bearer ${API_TOKEN}`,
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          },
          mode: 'cors'
        });
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        setProvidersOnlineCount(data.payload.count);
        setProvidersOnlineError(null);
      } catch (error) {
        console.error('Error fetching providers online:', error);
        setProvidersOnlineError('Connection error');
        setProvidersOnlineCount(null);
      }
    };

    fetchGfeQueue();
    fetchProvidersOnline();
    
    const interval = setInterval(fetchGfeQueue, 5000);
    const providersInterval = setInterval(fetchProvidersOnline, 5000);
    
    return () => {
      clearInterval(interval);
      clearInterval(providersInterval);
      if (gfeHighLoadTimer.current) {
        clearTimeout(gfeHighLoadTimer.current);
      }
    };
  }, []);

  const handleNavClick = () => {
    if (window.innerWidth < 768) {
      setIsMobileMenuOpen(false);
      setIsSidebarCollapsed(true);
    }
  };

  React.useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setIsSidebarCollapsed(true);
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    user ? (
    <div className="min-h-screen bg-slate-50">
      {/* Navbar */}
      <nav className="bg-white md:glass shadow-glass px-4 py-2 fixed top-0 left-0 right-0 z-30">
        <div className="container-fluid flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              onClick={() => {
                setIsSidebarCollapsed(!isSidebarCollapsed);
                setIsMobileMenuOpen(!isMobileMenuOpen);
              }}
              className="hover:bg-white/30"
            >
              <Menu className="w-5 h-5" />
            </Button>
          <img 
            src="https://healthcoversonline.com/wp-content/uploads/2024/01/main-logo-edited.png" 
            alt="Health Covers Online" 
            className="h-16 hidden sm:block"
          />
          </div>
          <div className="flex items-center overflow-x-auto">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                asChild
                className={cn(
                  "flex items-center gap-2 px-4 py-3 rounded-full h-12",
                  gfeError ? "bg-red-50 text-red-600" : 
                  gfeWarningActive ? "bg-red-50 text-red-600 animate-pulse" :
                  "bg-blue-50 text-blue-600"
                )}
              >
                <Link to="/customer-queue" className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  <span className="font-medium text-base">
                    {gfeError ? "GFE Error" : `GFE Queue: ${gfeQueueCount ?? '...'}`}
                  </span>
                </Link>
              </Button>
              <Button
                variant="ghost"
                className={cn(
                  "flex items-center gap-2 px-4 py-3 rounded-full h-12",
                  providersOnlineError ? "bg-red-50 text-red-600" : "bg-green-50 text-green-600"
                )}
                onClick={() => setIsProvidersModalOpen(true)}
              >
                <UserCheck className="w-5 h-5" />
                <span className="font-medium text-base">
                  {providersOnlineError ? "Connection error" : `Providers Online: ${providersOnlineCount ?? '...'}`}
                </span>
              </Button>
              <Avatar>
                <AvatarImage src={user.user_metadata?.avatar_url || `https://www.gravatar.com/avatar/${user.email.toLowerCase().trim()}`} />
                <AvatarFallback>
                  {user.email.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col hidden sm:block">
                <span className="font-medium">{user.email}</span>
                <span className="text-sm text-gray-500">{user.user_metadata?.role || 'User'}</span>
              </div>
              <Separator orientation="vertical" className="h-8 mx-2" />
              <div className="flex items-center gap-2">
                <NotificationsPopover />
                <Button variant="ghost" size="icon" className="hover:bg-white/30">
                  <Settings className="w-5 h-5 text-slate-600" />
                </Button>
                <Button variant="ghost" size="icon" className="hover:bg-white/30" onClick={handleSignOut}>
                  <LogOut className="w-5 h-5 text-slate-600" />
                </Button>
              </div>
            </div>
          </div>
          
          <OnlineProvidersModal 
            isOpen={isProvidersModalOpen} 
            onClose={() => setIsProvidersModalOpen(false)} 
          />
        </div>
      </nav>

      {/* Sidebar */}
      <div className={`fixed top-[49px] left-0 h-[calc(100vh-49px)] glass shadow-glass transition-all duration-300 z-20
        ${isSidebarCollapsed ? 'w-16' : 'w-56'}
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
        <div className="pt-10">
          <ul className="flex flex-col space-y-1">
            <li>
              <NavLink to="/" onClick={handleNavClick}>
                {({ isActive }) => (
                  <Button
                    variant="ghost"
                    className={cn(
                      "w-full justify-start px-4 py-2 transition-colors",
                      isActive && "bg-primary-50/50 text-primary-600 border-l-2 border-primary-500 hover:bg-primary-50/70",
                      !isActive && "hover:bg-white/30"
                    )}
                  >
                    <span className="mr-3 text-lg">🎯</span>
                    <span className={`${isSidebarCollapsed ? 'hidden' : 'block'}`}>Dashboard</span>
                  </Button>
                )}
              </NavLink>
            </li>
            <li>
              <NavLink to="/customer-queue" onClick={handleNavClick}>
                {({ isActive }) => (
                  <Button
                    variant="ghost"
                    className={cn(
                      "w-full justify-start px-4 py-2 transition-colors",
                      isActive && "bg-primary-50/50 text-primary-600 border-l-2 border-primary-500 hover:bg-primary-50/70",
                      !isActive && "hover:bg-white/30"
                    )}
                  >
                    <span className="mr-3 text-lg">👥</span>
                    <span className={`${isSidebarCollapsed ? 'hidden' : 'block'}`}>Patient Queue</span>
                  </Button>
                )}
              </NavLink>
            </li>
            <li>
              <NavLink to="/clients" onClick={handleNavClick}>
                {({ isActive }) => (
                  <Button
                    variant="ghost"
                    className={cn(
                      "w-full justify-start px-4 py-2 transition-colors",
                      isActive && "bg-primary-50/50 text-primary-600 border-l-2 border-primary-500 hover:bg-primary-50/70",
                      !isActive && "hover:bg-white/30"
                    )}
                  >
                    <span className="mr-3 text-lg">👥</span>
                    <span className={`${isSidebarCollapsed ? 'hidden' : 'block'}`}>Clients</span>
                  </Button>
                )}
              </NavLink>
            </li>
            <li>
              <NavLink to="/gfes" onClick={handleNavClick}>
                {({ isActive }) => (
                  <Button
                    variant="ghost"
                    className={cn(
                      "w-full justify-start px-4 py-2 transition-colors",
                      isActive && "bg-primary-50/50 text-primary-600 border-l-2 border-primary-500 hover:bg-primary-50/70",
                      !isActive && "hover:bg-white/30"
                    )}
                  >
                    <span className="mr-3 text-lg">📋</span>
                    <span className={`${isSidebarCollapsed ? 'hidden' : 'block'}`}>GFEs</span>
                  </Button>
                )}
              </NavLink>
            </li>
            <li>
              <NavLink to="/tasks" onClick={handleNavClick}>
                {({ isActive }) => (
                  <Button
                    variant="ghost"
                    className={cn(
                      "w-full justify-start px-4 py-2 transition-colors",
                      isActive && "bg-primary-50/50 text-primary-600 border-l-2 border-primary-500 hover:bg-primary-50/70",
                      !isActive && "hover:bg-white/30"
                    )}
                  >
                    <span className="mr-3 text-lg">✓</span>
                    <span className={`${isSidebarCollapsed ? 'hidden' : 'block'}`}>Tasks</span>
                  </Button>
                )}
              </NavLink>
            </li>
            <li>
              <NavLink to="/providers" onClick={handleNavClick}>
                {({ isActive }) => (
                  <Button
                    variant="ghost"
                    className={cn(
                      "w-full justify-start px-4 py-2 transition-colors",
                      isActive && "bg-primary-50/50 text-primary-600 border-l-2 border-primary-500 hover:bg-primary-50/70",
                      !isActive && "hover:bg-white/30"
                    )}
                  >
                    <span className="mr-3 text-lg">👨‍⚕️</span>
                    <span className={`${isSidebarCollapsed ? 'hidden' : 'block'}`}>Provider Directory</span>
                  </Button>
                )}
              </NavLink>
            </li>
            <li>
              <NavLink to="/medical-directors" onClick={handleNavClick}>
                {({ isActive }) => (
                  <Button
                    variant="ghost"
                    className={cn(
                      "w-full justify-start px-4 py-2 transition-colors",
                      isActive && "bg-primary-50/50 text-primary-600 border-l-2 border-primary-500 hover:bg-primary-50/70",
                      !isActive && "hover:bg-white/30"
                    )}
                  >
                    <span className="mr-3 text-lg">👨‍⚕️</span>
                    <span className={`${isSidebarCollapsed ? 'hidden' : 'block'}`}>Medical Directors</span>
                  </Button>
                )}
              </NavLink>
            </li>
            <li>
              <NavLink to="/invoices" onClick={handleNavClick}>
                {({ isActive }) => (
                  <Button
                    variant="ghost"
                    className={cn(
                      "w-full justify-start px-4 py-2 transition-colors",
                      isActive && "bg-primary-50/50 text-primary-600 border-l-2 border-primary-500 hover:bg-primary-50/70",
                      !isActive && "hover:bg-white/30"
                    )}
                  >
                    <span className="mr-3 text-lg">💰</span>
                    <span className={`${isSidebarCollapsed ? 'hidden' : 'block'}`}>Invoices</span>
                  </Button>
                )}
              </NavLink>
            </li>
            <li>
              <NavLink to="/email-templates" onClick={handleNavClick}>
                {({ isActive }) => (
                  <Button
                    variant="ghost"
                    className={cn(
                      "w-full justify-start px-4 py-2 transition-colors",
                      isActive && "bg-primary-50/50 text-primary-600 border-l-2 border-primary-500 hover:bg-primary-50/70",
                      !isActive && "hover:bg-white/30"
                    )}
                  >
                    <span className="mr-3 text-lg">📧</span>
                    <span className={`${isSidebarCollapsed ? 'hidden' : 'block'}`}>Email Templates</span>
                  </Button>
                )}
              </NavLink>
            </li>
            <li>
              <NavLink to="/reviews" onClick={handleNavClick}>
                {({ isActive }) => (
                  <Button
                    variant="ghost"
                    className={cn(
                      "w-full justify-start px-4 py-2 transition-colors",
                      isActive && "bg-primary-50/50 text-primary-600 border-l-2 border-primary-500 hover:bg-primary-50/70",
                      !isActive && "hover:bg-white/30"
                    )}
                  >
                    <span className="mr-3 text-lg">⭐</span>
                    <span className={`${isSidebarCollapsed ? 'hidden' : 'block'}`}>Reviews</span>
                  </Button>
                )}
              </NavLink>
            </li>
            <li>
              <NavLink to="/sops" onClick={handleNavClick}>
                {({ isActive }) => (
                  <Button
                    variant="ghost"
                    className={cn(
                      "w-full justify-start px-4 py-2 transition-colors",
                      isActive && "bg-primary-50/50 text-primary-600 border-l-2 border-primary-500 hover:bg-primary-50/70",
                      !isActive && "hover:bg-white/30"
                    )}
                  >
                    <span className="mr-3 text-lg">📚</span>
                    <span className={`${isSidebarCollapsed ? 'hidden' : 'block'}`}>SOPs</span>
                  </Button>
                )}
              </NavLink>
            </li>
            <li>
              <NavLink to="/reports" onClick={handleNavClick}>
                {({ isActive }) => (
                  <Button
                    variant="ghost"
                    className={cn(
                      "w-full justify-start px-4 py-2 transition-colors",
                      isActive && "bg-primary-50/50 text-primary-600 border-l-2 border-primary-500 hover:bg-primary-50/70",
                      !isActive && "hover:bg-white/30"
                    )}
                  >
                    <span className="mr-3 text-lg">📈</span>
                    <span className={`${isSidebarCollapsed ? 'hidden' : 'block'}`}>Reports</span>
                  </Button>
                )}
              </NavLink>
            </li>
            <li>
              <NavLink to="/settings" onClick={handleNavClick}>
                {({ isActive }) => (
                  <Button
                    variant="ghost"
                    className={cn(
                      "w-full justify-start px-4 py-2 transition-colors",
                      isActive && "bg-primary-50/50 text-primary-600 border-l-2 border-primary-500 hover:bg-primary-50/70",
                      !isActive && "hover:bg-white/30"
                    )}
                  >
                    <span className="mr-3 text-lg">⚙️</span>
                    <span className={`${isSidebarCollapsed ? 'hidden' : 'block'}`}>Settings</span>
                  </Button>
                )}
              </NavLink>
            </li>
            <li className="mt-auto mb-4">
              <Button
                asChild
                variant="ghost"
                className="w-full justify-start px-4 py-2 transition-colors text-primary-600 hover:bg-white/30"
              >
                <a
                  href="https://app.healthcoversonline.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <span className="mr-3 text-lg">🌐</span>
                  <span className={`${isSidebarCollapsed ? 'hidden' : 'block'}`}>Open MHC Portal</span>
                </a>
              </Button>
            </li>
            <li className="mb-4">
              <Button
                asChild
                variant="ghost"
                className="w-full justify-start px-4 py-2 transition-colors text-primary-600 hover:bg-white/30"
              >
                <a
                  href="https://app.rivieregroup.org"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <span className="mr-3 text-lg">🔗</span>
                  <span className={`${isSidebarCollapsed ? 'hidden' : 'block'}`}>Nexus CRM Access</span>
                </a>
              </Button>
            </li>
            <li className="mb-4">
              <Button
                variant="ghost"
                className="w-full justify-start px-4 py-2 transition-colors text-primary-600 hover:bg-white/30"
                disabled
              >
                <span className="mr-3 text-lg">🤖</span>
                <span className={`${isSidebarCollapsed ? 'hidden' : 'block'}`}>MHC A.I. - Coming Soon</span>
              </Button>
            </li>
          </ul>
        </div>
      </div>

      {/* Main Content */}
      <div className={`transition-all duration-300 bg-gradient-to-br from-slate-50/90 to-white/50 backdrop-blur-glass
        pt-[50px] md:pt-[100px] p-4 md:p-6
        ${isSidebarCollapsed ? 'md:ml-16' : 'md:ml-56'}`}>
        {children}
      </div>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-white/80 backdrop-blur-sm z-10 md:hidden"
          onClick={() => {
            setIsMobileMenuOpen(false);
            setIsSidebarCollapsed(true);
          }}
        />
      )}
      
    </div>
    ) : children
  );
}