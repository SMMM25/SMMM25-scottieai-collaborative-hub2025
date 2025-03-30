import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  HomeIcon, 
  FolderIcon, 
  UploadIcon, 
  UserIcon,
  BrainIcon,
  MessageSquareIcon,
  RefreshCwIcon
} from 'lucide-react';
import { cn } from '../../lib/utils';

interface SidebarProps {
  className?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({ className }) => {
  const location = useLocation();
  
  const navItems = [
    { name: 'Home', href: '/', icon: HomeIcon },
    { name: 'Projects', href: '/projects', icon: FolderIcon },
    { name: 'Upload', href: '/upload', icon: UploadIcon },
    { name: 'AI Models', href: '/ai-models', icon: BrainIcon },
    { name: 'AI Chat', href: '/ai-chat', icon: MessageSquareIcon },
    { name: 'AI Recommendations', href: '/ai-recommendations', icon: RefreshCwIcon },
    { name: 'Profile', href: '/profile', icon: UserIcon },
  ];
  
  return (
    <div className={cn("flex flex-col h-full bg-white border-r", className)}>
      <div className="p-4">
        <h2 className="text-xl font-bold">ScottieAI Hub</h2>
      </div>
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {navItems.map((item) => (
            <li key={item.name}>
              <Link
                to={item.href}
                className={cn(
                  "flex items-center p-2 rounded-md text-gray-700 hover:bg-gray-100 transition-colors",
                  location.pathname === item.href && "bg-gray-100 font-medium"
                )}
              >
                <item.icon className="h-5 w-5 mr-3" />
                {item.name}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      <div className="p-4 border-t">
        <div className="text-sm text-gray-500">
          <p>© 2025 ScottieAI</p>
          <p>Version 2.0.0</p>
        </div>
      </div>
    </div>
  );
};
