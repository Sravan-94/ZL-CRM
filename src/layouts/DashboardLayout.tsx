import { ReactNode, useState, useEffect } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  LayoutDashboard, 
  Users, 
  BarChart2, 
  Calendar, 
  LogOut, 
  Menu, 
  X,
  Building2,
  Bell
} from 'lucide-react';
import { formatDistanceToNow, isToday, isBefore } from 'date-fns';

interface DashboardLayoutProps {
  children: ReactNode;
}

interface Notification {
  id: string;
  title: string;
  date: Date;
  status: 'overdue' | 'today' | 'upcoming';
  leadId: string;
}

const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  
  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Fetch notifications from API
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const response = await fetch('https://crmbackend-lxbe.onrender.com/api/leads/getall');
        if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
        const data = await response.json();
        
        // Filter leads based on user role
        const filteredLeads = isAdmin 
          ? data 
          : data.filter((lead: any) => {
              if (!lead.assignedTo) return false;
              const assignedTo = lead.assignedTo.trim().toLowerCase();
              const userId = user?.id?.toString().trim().toLowerCase();
              const userName = user?.name?.trim().toLowerCase();
              return assignedTo === userId || assignedTo === userName;
            });

        // Generate notifications from leads with follow-up dates
        const today = new Date();
        const notificationEvents = filteredLeads
          .filter((lead: any) => lead.followUp)
          .map((lead: any) => {
            const followUpDate = new Date(lead.followUp);
            
            // Determine status based on date
            let status: 'overdue' | 'today' | 'upcoming';
            if (isBefore(followUpDate, today) && !isToday(followUpDate)) {
              status = 'overdue';
            } else if (isToday(followUpDate)) {
              status = 'today';
            } else {
              status = 'upcoming';
            }
            
            return {
              id: lead.id.toString(),
              title: lead.name || 'Unknown Lead',
              date: followUpDate,
              status,
              leadId: lead.id.toString(),
            };
          })
          .filter((event: Notification) => event.status === 'today' || event.status === 'overdue');
        
        setNotifications(notificationEvents);
      } catch (error) {
        console.error('Error fetching notifications:', error);
      }
    };

    fetchNotifications();
  }, [user, isAdmin]);

  // Menu items based on user role
  const getMenuItems = () => {
    if (isAdmin) {
      return [
        { name: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
        { name: 'Leads', href: '/admin/leads', icon: Users },
        { name: 'Reports', href: '/admin/reports', icon: BarChart2 },
        { name: 'Calendar', href: '/admin/calendar', icon: Calendar },
        { name: 'RegisterBda', href: '/admin/RegisterBda', icon: Users },
      ];
    } else {
      return [
        { name: 'Dashboard', href: '/bda/dashboard', icon: LayoutDashboard },
        { name: 'Leads', href: '/bda/leads', icon: Users },
        // { name: 'Calendar', href: '/bda/calendar', icon: Calendar },
      ];
    }
  };
  
  const menuItems = getMenuItems();

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Mobile sidebar */}
      <div 
        className={`fixed inset-0 bg-slate-900/50 z-40 lg:hidden transition-opacity duration-200 ${
          sidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setSidebarOpen(false)}
      />
      
      {/* Sidebar */}
      <div 
        className={`fixed inset-y-0 left-0 w-64 bg-white border-r border-slate-200 z-50 lg:translate-x-0 transform transition-transform duration-200 ease-in-out ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="flex items-center justify-between h-16 px-6 border-b border-slate-200">
          <div className="flex items-center">
            <Building2 className="h-6 w-6 text-blue-600 mr-2" />
            <span className="font-semibold text-lg">ZL CRM</span>
          </div>
          <button 
            className="lg:hidden text-slate-500 hover:text-slate-700"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <div className="p-4">
          <div className="flex items-center space-x-3 mb-6 p-2">
            <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-medium">
              {user?.name.charAt(0)}
            </div>
            <div>
              <div className="font-medium text-sm">{user?.name}</div>
              <div className="text-xs text-slate-500 capitalize">{user?.role}</div>
            </div>
          </div>
          
          <nav className="space-y-1">
            {menuItems.map((item) => (
              <NavLink
                key={item.name}
                to={item.href}
                className={({ isActive }) => 
                  `flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                    isActive 
                      ? 'bg-blue-50 text-blue-700' 
                      : 'text-slate-700 hover:bg-slate-100'
                  }`
                }
              >
                <item.icon className="mr-3 h-5 w-5 flex-shrink-0" />
                {item.name}
              </NavLink>
            ))}
          </nav>
        </div>
        
        <div className="absolute bottom-0 w-full p-4 border-t border-slate-200">
          <button 
            onClick={handleLogout}
            className="flex w-full items-center px-3 py-2 text-sm font-medium text-slate-700 rounded-md hover:bg-slate-100 transition-colors"
          >
            <LogOut className="mr-3 h-5 w-5 flex-shrink-0" />
            Logout
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Header */}
        <header className="sticky top-0 z-30 bg-white border-b border-slate-200">
          <div className="flex items-center justify-between h-16 px-4 sm:px-6">
            <div className="flex items-center">
              <button 
                className="lg:hidden mr-4 text-slate-500 hover:text-slate-700"
                onClick={() => setSidebarOpen(true)}
              >
                <Menu className="h-6 w-6" />
              </button>
              
              <h1 className="text-xl font-semibold text-slate-800">
                {menuItems.find(item => item.href === location.pathname)?.name || 'Dashboard'}
              </h1>
            </div>
            
            {/* Notifications */}
            <div className="relative">
              <button
                onClick={() => setNotificationsOpen(!notificationsOpen)}
                className="p-2 rounded-full text-slate-500 hover:text-slate-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 relative"
              >
                <Bell className="h-5 w-5" />
                {notifications.length > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 rounded-full text-xs flex items-center justify-center text-white">
                    {notifications.length}
                  </span>
                )}
              </button>
              
              {notificationsOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-md shadow-lg py-1 z-30 border border-slate-200 max-h-96 overflow-y-auto">
                  <div className="px-4 py-2 border-b border-slate-200">
                    <h3 className="text-sm font-semibold text-slate-700">Notifications</h3>
                  </div>
                  
                  {notifications.length === 0 ? (
                    <div className="px-4 py-3 text-sm text-slate-500">
                      No notifications
                    </div>
                  ) : (
                    <>
                      {notifications.filter(n => n.status === 'overdue').length > 0 && (
                        <div className="px-4 py-1 text-xs font-medium text-red-500 bg-red-50">
                          Overdue Follow-ups
                        </div>
                      )}
                      
                      {notifications.filter(n => n.status === 'overdue').map(event => (
                        <div key={event.id} className="px-4 py-2 border-b border-slate-100 hover:bg-slate-50">
                          <div className="flex items-start">
                            <div className="w-2 h-2 mt-1.5 rounded-full bg-red-500 mr-2"></div>
                            <div>
                              <p className="text-sm font-medium text-slate-800">{event.title}</p>
                              <p className="text-xs text-red-500">
                                Overdue: {formatDistanceToNow(event.date, { addSuffix: true })}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                      
                      {notifications.filter(n => n.status === 'today').length > 0 && (
                        <div className="px-4 py-1 text-xs font-medium text-amber-500 bg-amber-50">
                          Today's Follow-ups
                        </div>
                      )}
                      
                      {notifications.filter(n => n.status === 'today').map(event => (
                        <div key={event.id} className="px-4 py-2 border-b border-slate-100 hover:bg-slate-50">
                          <div className="flex items-start">
                            <div className="w-2 h-2 mt-1.5 rounded-full bg-amber-500 mr-2"></div>
                            <div>
                              <p className="text-sm font-medium text-slate-800">{event.title}</p>
                              <p className="text-xs text-amber-500">Due today</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </header>
        
        {/* Main content */}
        <main className="p-4 sm:p-6">
          {children}
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;