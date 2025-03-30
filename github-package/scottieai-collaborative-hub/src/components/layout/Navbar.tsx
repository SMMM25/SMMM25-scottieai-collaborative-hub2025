
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Github, Settings, UserPlus, Code, Info, LogIn, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/contexts/AuthContext';

const Navbar = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <nav className="border-b bg-background">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="font-bold text-2xl scottie-gradient-text">ScottieAI</div>
          <span className="px-2 py-0.5 text-xs bg-scottie-light text-scottie rounded-full">
            Beta
          </span>
        </div>
        
        <div className="hidden md:flex items-center space-x-6">
          <Link to="/" className="text-foreground hover:text-scottie transition-colors">
            Home
          </Link>
          <Link to="/projects" className="text-foreground hover:text-scottie transition-colors">
            Projects
          </Link>
          <Link to="/integrations" className="text-foreground hover:text-scottie transition-colors">
            Integrations
          </Link>
          <Link to="/docs" className="text-foreground hover:text-scottie transition-colors">
            Documentation
          </Link>
        </div>
        
        <div className="flex items-center gap-3">
          <a 
            href="https://github.com" 
            target="_blank" 
            rel="noopener noreferrer"
            className="p-2 rounded-full hover:bg-secondary transition-colors"
          >
            <Github size={20} />
          </a>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <Settings size={20} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>
                <UserPlus className="mr-2 h-4 w-4" />
                <span>Account</span>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Code className="mr-2 h-4 w-4" />
                <span>API Keys</span>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Info className="mr-2 h-4 w-4" />
                <span>About</span>
              </DropdownMenuItem>
              {user && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Sign Out</span>
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
          
          {user ? (
            <Button className="bg-scottie hover:bg-scottie-secondary transition-colors">
              My Dashboard
            </Button>
          ) : (
            <Button 
              className="bg-scottie hover:bg-scottie-secondary transition-colors"
              onClick={() => navigate('/auth')}
            >
              <LogIn className="mr-2 h-4 w-4" />
              Sign In
            </Button>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
