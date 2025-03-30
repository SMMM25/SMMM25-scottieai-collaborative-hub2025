import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  PlusCircle, 
  Search, 
  Filter, 
  ArrowLeft, 
  BarChart, 
  Layers, 
  Rocket, 
  Clock
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { 
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../components/ui/dropdown-menu';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { toast } from 'sonner';
import { useAuth } from '../contexts/AuthContext';

export const ProjectsPage = () => {
  const [projects, setProjects] = useState([]);
  const [filteredProjects, setFilteredProjects] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [statistics, setStatistics] = useState({
    total: 0,
    inProgress: 0,
    completed: 0,
    deployed: 0
  });
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // Redirect to login if not authenticated
  useEffect(() => {
    if (!user) {
      navigate('/auth');
    }
  }, [user, navigate]);
  
  // Fetch projects on component mount
  useEffect(() => {
    // Simplified for build
    setIsLoading(false);
    setProjects([]);
    setFilteredProjects([]);
  }, []);
  
  return (
    <div className="min-h-screen flex flex-col">
      <div className="container mx-auto px-4 py-8 flex-1">
        <div className="mb-6">
          <Button variant="ghost" asChild>
            <Link to="/" className="flex items-center text-muted-foreground hover:text-foreground">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Home
            </Link>
          </Button>
        </div>
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Your Projects</h1>
            <p className="text-muted-foreground">
              Manage and deploy your AI-enhanced projects
            </p>
          </div>
          
          <Button 
            className="mt-4 md:mt-0"
            onClick={() => setShowCreateDialog(true)}
          >
            <PlusCircle className="mr-2 h-4 w-4" />
            New Project
          </Button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-2xl flex items-center">
                <Layers className="mr-2 h-5 w-5" />
                {statistics.total}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Total Projects</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-2xl flex items-center">
                <Clock className="mr-2 h-5 w-5" />
                {statistics.inProgress}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">In Progress</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-2xl flex items-center">
                <BarChart className="mr-2 h-5 w-5" />
                {statistics.completed}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Completed</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-2xl flex items-center">
                <Rocket className="mr-2 h-5 w-5" />
                {statistics.deployed}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Deployed</p>
            </CardContent>
          </Card>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-grow">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search projects..."
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="flex gap-2">
                <Filter className="h-4 w-4" />
                <span>Filter</span>
                {statusFilter.length > 0 && (
                  <span className="ml-1 rounded-full bg-primary w-5 h-5 text-white text-xs flex items-center justify-center">
                    {statusFilter.length}
                  </span>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Filter by Status</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuCheckboxItem
                checked={statusFilter.includes('in-progress')}
                onCheckedChange={(checked) => {
                  if (checked) {
                    setStatusFilter([...statusFilter, 'in-progress']);
                  } else {
                    setStatusFilter(statusFilter.filter(status => status !== 'in-progress'));
                  }
                }}
              >
                In Progress
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={statusFilter.includes('completed')}
                onCheckedChange={(checked) => {
                  if (checked) {
                    setStatusFilter([...statusFilter, 'completed']);
                  } else {
                    setStatusFilter(statusFilter.filter(status => status !== 'completed'));
                  }
                }}
              >
                Completed
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={statusFilter.includes('deployed')}
                onCheckedChange={(checked) => {
                  if (checked) {
                    setStatusFilter([...statusFilter, 'deployed']);
                  } else {
                    setStatusFilter(statusFilter.filter(status => status !== 'deployed'));
                  }
                }}
              >
                Deployed
              </DropdownMenuCheckboxItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        
        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <p>Loading projects...</p>
          </div>
        ) : isError ? (
          <div className="text-center py-12">
            <p className="text-red-500 mb-4">Failed to load projects</p>
            <Button onClick={() => window.location.reload()}>
              Try Again
            </Button>
          </div>
        ) : filteredProjects.length === 0 ? (
          <div className="text-center py-12 border rounded-lg bg-card">
            <h3 className="text-xl font-medium mb-2">No projects found</h3>
            <p className="text-muted-foreground mb-6">
              {searchTerm || statusFilter.length > 0 
                ? "Try adjusting your search or filters" 
                : "Create your first project to get started"}
            </p>
            {!(searchTerm || statusFilter.length > 0) && (
              <Button 
                onClick={() => setShowCreateDialog(true)}
              >
                <PlusCircle className="mr-2 h-4 w-4" />
                Create Project
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Project cards would go here */}
            <div className="border rounded-lg p-6 bg-card">
              <h3 className="text-xl font-medium mb-2">Sample Project</h3>
              <p className="text-muted-foreground mb-4">This is a sample project card</p>
              <div className="flex justify-end">
                <Button size="sm" variant="outline">View</Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProjectsPage;
